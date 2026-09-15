CREATE OR REPLACE FUNCTION private.require_capability (
  p_capability_key text,
  p_scope_type     public.rbac_scope_type DEFAULT 'GLOBAL'::public.rbac_scope_type,
  p_business_id    uuid                   DEFAULT NULL::uuid,
  p_department     text                   DEFAULT NULL::text,
  p_target_user_id uuid                   DEFAULT NULL::uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED' using errcode = '28000';
  end if;

  if not private.has_capability(
    p_capability_key,
    p_scope_type,
    p_business_id,
    p_department,
    p_target_user_id
  ) then
    raise exception 'INSUFFICIENT_AUTHORITY' using errcode = '42501';
  end if;

  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."require_capability"(text, public.rbac_scope_type, uuid, text, uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."require_capability"(text, public.rbac_scope_type, uuid, text, uuid) FROM PUBLIC;
