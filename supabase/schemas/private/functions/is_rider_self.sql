CREATE OR REPLACE FUNCTION private.is_rider_self (
  p_rider_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1 from public.riders r
    join public.rider_profiles rp on rp.user_id = r.user_id
    where r.id = p_rider_id
      and r.user_id = (select auth.uid())
      and rp.verification_status = 'VERIFIED'::public.rider_verification_status
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_rider_self"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."is_rider_self"(uuid) FROM PUBLIC;
