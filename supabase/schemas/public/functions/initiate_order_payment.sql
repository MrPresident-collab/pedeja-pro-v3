CREATE OR REPLACE FUNCTION public.initiate_order_payment (
  p_order_id        uuid,
  p_provider        public.payment_provider,
  p_idempotency_key text
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select private.initiate_order_payment(
    p_order_id,
    p_provider,
    p_idempotency_key
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."initiate_order_payment"(uuid, public.payment_provider, text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."initiate_order_payment"(uuid, public.payment_provider, text) FROM PUBLIC;
