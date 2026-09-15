CREATE OR REPLACE FUNCTION public.activate_customer()
  RETURNS void
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select private.activate_customer();
$function$;

GRANT EXECUTE ON FUNCTION "public"."activate_customer"() TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."activate_customer"() FROM PUBLIC;
