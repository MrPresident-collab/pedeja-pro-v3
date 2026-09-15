CREATE OR REPLACE FUNCTION private.is_staff_user (
  p_user_id uuid DEFAULT auth.uid()
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.staff_profiles sp
    where sp.user_id = p_user_id
      and sp.staff_status = 'ACTIVE'
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_staff_user"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."is_staff_user"(uuid) FROM PUBLIC;
