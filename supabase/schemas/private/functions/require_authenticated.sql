CREATE OR REPLACE FUNCTION private.require_authenticated()
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '28000';
  end if;
  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."require_authenticated"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."require_authenticated"() FROM PUBLIC;
