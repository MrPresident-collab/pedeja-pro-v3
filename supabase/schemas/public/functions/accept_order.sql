CREATE OR REPLACE FUNCTION public.accept_order (
  p_order_id uuid
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ select private.transition_order(p_order_id, 'ACCEPT', 'BUSINESS'); $function$;

GRANT EXECUTE ON FUNCTION "public"."accept_order"(uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."accept_order"(uuid) FROM PUBLIC;
