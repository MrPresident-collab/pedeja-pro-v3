CREATE OR REPLACE FUNCTION private.has_capability (
  p_capability_key text,
  p_scope_type     public.rbac_scope_type DEFAULT 'GLOBAL'::public.rbac_scope_type,
  p_business_id    uuid                   DEFAULT NULL::uuid,
  p_department     text                   DEFAULT NULL::text,
  p_target_user_id uuid                   DEFAULT NULL::uuid
)
  RETURNS boolean
  LANGUAGE plpgsql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid := auth.uid();
  v_staff_role public.staff_role;
  v_capability_id uuid;
  v_role_effect public.capability_effect;
  v_override_effect public.capability_effect;
  v_has_scope boolean := false;
begin
  if v_user_id is null then
    return false;
  end if;

  select sp.staff_role
    into v_staff_role
  from public.staff_profiles sp
  where sp.user_id = v_user_id
    and sp.staff_status = 'ACTIVE';

  if v_staff_role is null then
    return false;
  end if;

  select c.id
    into v_capability_id
  from public.capabilities c
  where c.capability_key = lower(btrim(p_capability_key))
    and c.active = true;

  if v_capability_id is null then
    return false;
  end if;

  if p_scope_type = 'BUSINESS' then
    if p_business_id is null then
      return false;
    end if;
    select exists (
      select 1
      from public.business_members bm
      where bm.business_id = p_business_id
        and bm.user_id = v_user_id
    ) into v_has_scope;
  elsif p_scope_type = 'DEPARTMENT' then
    if p_department is null then
      return false;
    end if;
    select exists (
      select 1
      from public.staff_profiles sp
      where sp.user_id = v_user_id
        and sp.department = p_department
    ) into v_has_scope;
  elsif p_scope_type = 'SELF' then
    if p_target_user_id is null then
      return false;
    end if;
    v_has_scope := p_target_user_id = v_user_id;
  elsif p_scope_type = 'DELIVERY' then
    v_has_scope := p_target_user_id is not null;
  else
    v_has_scope := true;
  end if;

  if not v_has_scope then
    return false;
  end if;

  select rc.effect
    into v_role_effect
  from public.role_capabilities rc
  where rc.staff_role = v_staff_role
    and rc.capability_id = v_capability_id
    and rc.scope_type = p_scope_type;

  select uco.effect
    into v_override_effect
  from public.user_capability_overrides uco
  where uco.user_id = v_user_id
    and uco.capability_id = v_capability_id
    and uco.scope_type = p_scope_type
    and (uco.expires_at is null or uco.expires_at > now())
    and (
      (p_scope_type = 'GLOBAL' and uco.business_id is null and uco.department is null)
      or (p_scope_type = 'BUSINESS' and uco.business_id = p_business_id)
      or (p_scope_type = 'DEPARTMENT' and uco.department = p_department)
      or (p_scope_type in ('DELIVERY','SELF') and uco.business_id is null and uco.department is null)
    )
  order by uco.created_at desc
  limit 1;

  if v_override_effect is not null then
    return v_override_effect = 'ALLOW';
  end if;

  return coalesce(v_role_effect = 'ALLOW', false);
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."has_capability"(text, public.rbac_scope_type, uuid, text, uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."has_capability"(text, public.rbac_scope_type, uuid, text, uuid) FROM PUBLIC;
