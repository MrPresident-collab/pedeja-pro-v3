CREATE OR REPLACE FUNCTION private.set_updated_at()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SET search_path TO ''
  AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."set_updated_at"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."set_updated_at"() FROM PUBLIC;
