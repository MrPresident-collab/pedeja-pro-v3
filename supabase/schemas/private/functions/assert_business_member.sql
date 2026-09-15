CREATE OR REPLACE FUNCTION private.assert_business_member (
  p_business_id uuid,
  p_min_role    public.business_member_role DEFAULT 'STAFF'::public.business_member_role
)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare v_user_id uuid := auth.uid(); v_role public.business_member_role;
begin
  if v_user_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
  select bm.role into v_role from public.business_members bm where bm.business_id=p_business_id and bm.user_id=v_user_id;
  if v_role is null then raise exception 'BUSINESS_ACCESS_DENIED' using errcode='42501'; end if;
  if p_min_role='MANAGER' and v_role not in ('OWNER','MANAGER') then raise exception 'BUSINESS_ACCESS_DENIED' using errcode='42501'; end if;
  if p_min_role='OWNER' and v_role <> 'OWNER' then raise exception 'BUSINESS_ACCESS_DENIED' using errcode='42501'; end if;
  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."assert_business_member"(uuid, public.business_member_role) TO "postgres";

REVOKE ALL ON FUNCTION "private"."assert_business_member"(uuid, public.business_member_role) FROM PUBLIC;
