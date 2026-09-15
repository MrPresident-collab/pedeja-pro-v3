CREATE OR REPLACE FUNCTION public.start_preparing_order (
  p_order_id uuid
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$ select private.transition_order(p_order_id, 'START_PREPARING', 'BUSINESS'); $function$;

GRANT EXECUTE ON FUNCTION "public"."start_preparing_order"(uuid) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."start_preparing_order"(uuid) FROM PUBLIC;
