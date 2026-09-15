CREATE OR REPLACE FUNCTION private.assert_customer_owner (
  p_customer_id uuid
)
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

  if p_customer_id is null or p_customer_id <> v_user_id then
    raise exception 'RESOURCE_ACCESS_DENIED' using errcode = '42501';
  end if;

  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."assert_customer_owner"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."assert_customer_owner"(uuid) FROM PUBLIC;
