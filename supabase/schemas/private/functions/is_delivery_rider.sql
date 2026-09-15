CREATE OR REPLACE FUNCTION private.is_delivery_rider (
  p_delivery_job_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.delivery_assignments da
    join public.riders r on r.id = da.rider_id
    where da.delivery_job_id = p_delivery_job_id
      and r.user_id = (select auth.uid())
      and da.status in ('PROPOSED'::public.assignment_status, 'ASSIGNED'::public.assignment_status, 'ACCEPTED'::public.assignment_status)
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_delivery_rider"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."is_delivery_rider"(uuid) FROM PUBLIC;
