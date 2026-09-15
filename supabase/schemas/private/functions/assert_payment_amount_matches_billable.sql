CREATE OR REPLACE FUNCTION private.assert_payment_amount_matches_billable (
  p_payment_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_payment public.payments%rowtype;
  v_expected numeric(14,2);
  v_currency text;
begin
  if v_user_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
  select * into v_payment from public.payments where id=p_payment_id;
  if not found then raise exception 'PAYMENT_NOT_FOUND' using errcode='P0002'; end if;

  if v_payment.order_id is not null then
    select o.total_amount,o.currency_code into v_expected,v_currency from public.orders o where o.id=v_payment.order_id;
  else
    select e.total_amount,e.currency_code into v_expected,v_currency from public.enviar_shipments e where e.id=v_payment.enviar_shipment_id;
  end if;

  if v_expected is null then raise exception 'BILLABLE_RESOURCE_NOT_FOUND' using errcode='P0002'; end if;
  if v_payment.amount <> v_expected or v_payment.currency_code <> v_currency then
    raise exception 'PAYMENT_AMOUNT_MISMATCH' using errcode='22023';
  end if;
  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."assert_payment_amount_matches_billable"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."assert_payment_amount_matches_billable"(uuid) FROM PUBLIC;
