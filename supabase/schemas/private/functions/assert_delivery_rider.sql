CREATE OR REPLACE FUNCTION private.assert_delivery_rider (
  p_delivery_job_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare v_user_id uuid := auth.uid(); v_rider_user_id uuid; v_assignment_count integer;
begin
  if v_user_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
  select count(*)::integer, max(r.user_id)::uuid into v_assignment_count, v_rider_user_id
  from public.delivery_assignments da join public.riders r on r.id=da.rider_id
  where da.delivery_job_id=p_delivery_job_id and da.status in ('ASSIGNED','ACCEPTED') and r.user_id=v_user_id;
  if v_assignment_count=0 then raise exception 'DELIVERY_ACCESS_DENIED' using errcode='42501'; end if;
  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."assert_delivery_rider"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."assert_delivery_rider"(uuid) FROM PUBLIC;
