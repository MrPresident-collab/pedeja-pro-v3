CREATE OR REPLACE FUNCTION public.process_verified_payment_webhook (
  p_provider           public.payment_provider,
  p_provider_event_id  text,
  p_provider_reference text,
  p_event_type         public.payment_event_type,
  p_amount             numeric,
  p_currency_code      text,
  p_payload            jsonb                     DEFAULT '{}'::jsonb
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_webhook_id uuid;
  v_existing_event public.payment_webhook_events%rowtype;
  v_payment_id uuid;
  v_payment public.payments%rowtype;
  v_expected_amount numeric(14,2);
  v_expected_currency text;
  v_order_id uuid;
  v_enviar_id uuid;
begin
  if p_provider_event_id is null or btrim(p_provider_event_id) = '' then raise exception 'PROVIDER_EVENT_ID_REQUIRED'; end if;
  if p_provider_reference is null or btrim(p_provider_reference) = '' then raise exception 'PROVIDER_REFERENCE_REQUIRED'; end if;
  if p_amount is null or p_amount <= 0 then raise exception 'INVALID_WEBHOOK_AMOUNT'; end if;
  if p_currency_code is null or p_currency_code <> upper(p_currency_code) or char_length(p_currency_code) <> 3 then raise exception 'INVALID_WEBHOOK_CURRENCY'; end if;
  if p_payload is null or jsonb_typeof(p_payload) <> 'object' then raise exception 'INVALID_WEBHOOK_PAYLOAD'; end if;
  select * into v_existing_event from public.payment_webhook_events where provider=p_provider and provider_event_id=p_provider_event_id for update;
  if found then
    if v_existing_event.provider_reference <> p_provider_reference or v_existing_event.event_type <> p_event_type or v_existing_event.amount <> p_amount or v_existing_event.currency_code <> p_currency_code then raise exception 'WEBHOOK_EVENT_ID_REUSE_MISMATCH'; end if;
    if v_existing_event.processed_at is not null then
      select pe.payment_id into v_payment_id from public.payment_events pe where pe.provider=p_provider and pe.provider_event_id=p_provider_event_id limit 1;
      if v_payment_id is null then raise exception 'PROCESSED_WEBHOOK_MISSING_PAYMENT_EVENT'; end if;
      return v_payment_id;
    end if;
    v_webhook_id := v_existing_event.id;
  else
    insert into public.payment_webhook_events(provider,provider_event_id,provider_reference,event_type,amount,currency_code,payload,signature_verified)
    values(p_provider,p_provider_event_id,p_provider_reference,p_event_type,p_amount,p_currency_code,p_payload,true) returning id into v_webhook_id;
  end if;
  select * into v_payment from public.payments where provider=p_provider and provider_reference=p_provider_reference for update;
  if not found then raise exception 'PAYMENT_NOT_FOUND_FOR_PROVIDER_REFERENCE'; end if;
  v_payment_id:=v_payment.id; v_order_id:=v_payment.order_id; v_enviar_id:=v_payment.enviar_shipment_id;
  if v_order_id is not null then select o.total_amount,o.currency_code into v_expected_amount,v_expected_currency from public.orders o where o.id=v_order_id for update;
  else select e.total_amount,e.currency_code into v_expected_amount,v_expected_currency from public.enviar_shipments e where e.id=v_enviar_id for update; end if;
  if v_expected_amount is null or v_expected_currency is null then raise exception 'BILLABLE_RESOURCE_NOT_FOUND'; end if;
  if p_amount<>v_expected_amount or p_currency_code<>v_expected_currency then raise exception 'WEBHOOK_AMOUNT_OR_CURRENCY_MISMATCH'; end if;
  if v_payment.amount<>v_expected_amount or v_payment.currency_code<>v_expected_currency then raise exception 'PAYMENT_RECORD_AMOUNT_OR_CURRENCY_MISMATCH'; end if;
  if p_event_type='SUCCEEDED' then
    if v_payment.status<>'SUCCEEDED' then
      if v_payment.status not in ('INITIATED','PENDING','PROCESSING') then raise exception 'INVALID_PAYMENT_SUCCESS_TRANSITION'; end if;
      update public.payments set status='SUCCEEDED',succeeded_at=coalesce(succeeded_at,now()),failed_at=null,cancelled_at=null,expired_at=null where id=v_payment_id;
      insert into public.payment_events(payment_id,provider,event_type,provider_event_id,provider_reference,payload,received_at,processed_at) values(v_payment_id,p_provider,'SUCCEEDED',p_provider_event_id,p_provider_reference,p_payload,now(),now());
      if v_order_id is not null then update public.orders set payment_status='PAID',status=case when status='PENDING_PAYMENT' then 'PAID' else status end where id=v_order_id and payment_status in ('UNPAID','PENDING','PAYMENT_FAILED');
      else update public.enviar_shipments set payment_status='PAID',status=case when status in ('DRAFT','REQUESTED','PAYMENT_PENDING') then 'CONFIRMED' else status end where id=v_enviar_id and payment_status in ('UNPAID','PENDING','PAYMENT_FAILED'); end if;
    end if;
    perform private.post_successful_payment_to_ledger(v_payment_id);
  elsif p_event_type='FAILED' then
    if v_payment.status<>'SUCCEEDED' then
      update public.payments set status='FAILED',failed_at=coalesce(failed_at,now()) where id=v_payment_id;
      insert into public.payment_events(payment_id,provider,event_type,provider_event_id,provider_reference,payload,received_at,processed_at) values(v_payment_id,p_provider,'FAILED',p_provider_event_id,p_provider_reference,p_payload,now(),now());
      if v_order_id is not null then update public.orders set payment_status='PAYMENT_FAILED' where id=v_order_id and payment_status<>'PAID'; else update public.enviar_shipments set payment_status='PAYMENT_FAILED' where id=v_enviar_id and payment_status<>'PAID'; end if;
    end if;
  elsif p_event_type='CANCELLED' then
    if v_payment.status<>'SUCCEEDED' then
      update public.payments set status='CANCELLED',cancelled_at=coalesce(cancelled_at,now()) where id=v_payment_id;
      insert into public.payment_events(payment_id,provider,event_type,provider_event_id,provider_reference,payload,received_at,processed_at) values(v_payment_id,p_provider,'CANCELLED',p_provider_event_id,p_provider_reference,p_payload,now(),now());
    end if;
  elsif p_event_type='EXPIRED' then
    if v_payment.status not in ('SUCCEEDED') then
      update public.payments set status='EXPIRED',expired_at=coalesce(expired_at,now()) where id=v_payment_id;
      insert into public.payment_events(payment_id,provider,event_type,provider_event_id,provider_reference,payload,received_at,processed_at) values(v_payment_id,p_provider,'EXPIRED',p_provider_event_id,p_provider_reference,p_payload,now(),now());
    end if;
  else raise exception 'UNSUPPORTED_WEBHOOK_EVENT_TYPE'; end if;
  update public.payment_webhook_events set processed_at=coalesce(processed_at,now()),processing_error=null where id=v_webhook_id;
  return v_payment_id;
end;
$function$;

GRANT EXECUTE
  ON FUNCTION "public"."process_verified_payment_webhook"(public.payment_provider, text, text, public.payment_event_type, numeric, text, jsonb)
  TO "postgres", "service_role";

REVOKE ALL ON FUNCTION "public"."process_verified_payment_webhook"(public.payment_provider, text, text, public.payment_event_type, numeric, text, jsonb) FROM PUBLIC;
