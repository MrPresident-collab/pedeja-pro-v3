CREATE OR REPLACE FUNCTION public.mark_order_ready (
  p_order_id uuid
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ select private.transition_order(p_order_id, 'MARK_READY', 'BUSINESS'); $function$;

GRANT EXECUTE ON FUNCTION "public"."mark_order_ready"(uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."mark_order_ready"(uuid) FROM PUBLIC;
