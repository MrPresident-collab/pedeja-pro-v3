CREATE OR REPLACE FUNCTION private.is_authenticated()
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SET search_path TO ''
  AS $function$
  select auth.uid() is not null;
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_authenticated"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."is_authenticated"() FROM PUBLIC;
