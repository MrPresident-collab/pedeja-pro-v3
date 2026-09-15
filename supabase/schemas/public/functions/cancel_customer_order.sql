CREATE OR REPLACE FUNCTION public.cancel_customer_order (
  p_order_id uuid
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ select private.transition_order(p_order_id, 'CANCEL_CUSTOMER', 'CUSTOMER'); $function$;

GRANT EXECUTE ON FUNCTION "public"."cancel_customer_order"(uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."cancel_customer_order"(uuid) FROM PUBLIC;
