CREATE OR REPLACE FUNCTION private.current_user_id()
  RETURNS uuid
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select auth.uid();
$function$;

GRANT EXECUTE ON FUNCTION "private"."current_user_id"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."current_user_id"() FROM PUBLIC;
