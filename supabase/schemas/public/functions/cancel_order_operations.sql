CREATE OR REPLACE FUNCTION public.cancel_order_operations (
  p_order_id uuid
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ select private.transition_order(p_order_id, 'CANCEL_OPERATIONS', 'OPERATIONS'); $function$;

GRANT EXECUTE ON FUNCTION "public"."cancel_order_operations"(uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."cancel_order_operations"(uuid) FROM PUBLIC;
