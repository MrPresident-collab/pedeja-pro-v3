CREATE OR REPLACE FUNCTION private.assert_rider_identity (
  p_rider_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare v_user_id uuid := auth.uid(); v_rider_user_id uuid; v_verification public.rider_verification_status;
begin
  if v_user_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
  select r.user_id, rp.verification_status into v_rider_user_id, v_verification
  from public.riders r join public.rider_profiles rp on rp.user_id=r.user_id where r.id=p_rider_id;
  if v_rider_user_id is null then raise exception 'RESOURCE_NOT_FOUND' using errcode='P0002'; end if;
  if v_rider_user_id <> v_user_id then raise exception 'RESOURCE_ACCESS_DENIED' using errcode='42501'; end if;
  if v_verification <> 'VERIFIED'::public.rider_verification_status then raise exception 'RIDER_NOT_VERIFIED' using errcode='42501'; end if;
  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."assert_rider_identity"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."assert_rider_identity"(uuid) FROM PUBLIC;
