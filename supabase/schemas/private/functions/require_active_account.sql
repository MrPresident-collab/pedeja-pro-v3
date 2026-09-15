CREATE OR REPLACE FUNCTION private.require_active_account()
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_account_status public.account_status;
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '28000';
  end if;

  select p.account_status
    into v_account_status
  from public.profiles p
  where p.id = v_user_id;

  if v_account_status is null then
    raise exception 'ACCOUNT_SUSPENDED' using errcode = '42501';
  end if;

  if v_account_status <> 'ACTIVE'::public.account_status then
    raise exception 'ACCOUNT_SUSPENDED' using errcode = '42501';
  end if;

  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."require_active_account"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."require_active_account"() FROM PUBLIC;
