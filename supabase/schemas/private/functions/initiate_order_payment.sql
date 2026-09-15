CREATE OR REPLACE FUNCTION private.initiate_order_payment (
  p_order_id        uuid,
  p_provider        public.payment_provider,
  p_idempotency_key text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid;
  v_order public.orders%rowtype;
  v_payment_id uuid := extensions.gen_random_uuid();
  v_existing_payment public.payments%rowtype;
  v_request_fingerprint text;
begin
  v_user_id := private.require_active_account();
  perform private.assert_order_customer(p_order_id);

  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) not between 1 and 200 then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;
  p_idempotency_key := btrim(p_idempotency_key);
  v_request_fingerprint := encode(
    extensions.digest(
      jsonb_build_object('order_id', p_order_id, 'provider', p_provider)::text,
      'sha256'
    ),
    'hex'
  );

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  select *
    into v_existing_payment
  from public.payments p
  where p.customer_id = v_user_id
    and p.order_id = p_order_id
    and p.idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_existing_payment.idempotency_request_fingerprint <> v_request_fingerprint then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing_payment.id;
  end if;

  if p_provider not in (
    'PAYSTACK'::public.payment_provider,
    'FLUTTERWAVE'::public.payment_provider,
    'PEACH'::public.payment_provider
  ) then
    raise exception 'PAYMENT_PROVIDER_NOT_ALLOWED' using errcode = '22023';
  end if;

  if v_order.status <> 'PENDING_PAYMENT'::public.order_status then
    raise exception 'ORDER_NOT_PAYABLE' using errcode = 'P0001';
  end if;
  if v_order.payment_status not in (
    'UNPAID'::public.order_payment_status,
    'PAYMENT_FAILED'::public.order_payment_status
  ) then
    raise exception 'ORDER_PAYMENT_ALREADY_IN_PROGRESS' using errcode = 'P0001';
  end if;
  if v_order.total_amount <= 0 then
    raise exception 'INVALID_PAYMENT_AMOUNT' using errcode = '22023';
  end if;

  if exists (
    select 1
    from public.payments p
    where p.order_id = p_order_id
      and p.status in (
        'INITIATED'::public.payment_status,
        'PENDING'::public.payment_status,
        'PROCESSING'::public.payment_status
      )
  ) then
    raise exception 'ACTIVE_PAYMENT_EXISTS' using errcode = 'P0001';
  end if;

  insert into public.payments(
    id, customer_id, order_id, provider, status, currency_code, amount,
    metadata, idempotency_key, idempotency_request_fingerprint
  ) values (
    v_payment_id, v_user_id, p_order_id, p_provider,
    'INITIATED'::public.payment_status,
    v_order.currency_code, v_order.total_amount,
    jsonb_build_object('source', 'trusted_rpc'),
    p_idempotency_key, v_request_fingerprint
  );

  insert into public.payment_events(
    id, payment_id, provider, event_type, payload
  ) values (
    extensions.gen_random_uuid(), v_payment_id, p_provider,
    'CREATED'::public.payment_event_type,
    jsonb_build_object(
      'source', 'trusted_rpc',
      'order_id', p_order_id,
      'amount', v_order.total_amount,
      'currency', v_order.currency_code,
      'idempotency_key_present', true
    )
  );

  update public.orders
  set payment_status = 'PENDING'::public.order_payment_status,
      updated_at = now()
  where id = p_order_id;

  return v_payment_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."initiate_order_payment"(uuid, public.payment_provider, text) TO "postgres";

REVOKE ALL ON FUNCTION "private"."initiate_order_payment"(uuid, public.payment_provider, text) FROM PUBLIC;
