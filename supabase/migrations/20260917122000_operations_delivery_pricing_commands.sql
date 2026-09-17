-- Operations owns delivery pricing. No customer/client can read or write the table directly.

insert into public.capabilities(capability_key, description, active)
select 'operations.pricing.manage', 'Manage customer delivery pricing configuration', true
where not exists (
  select 1 from public.capabilities where capability_key='operations.pricing.manage'
);

insert into public.role_capabilities(staff_role, capability_id, effect, scope_type)
select r.staff_role, c.id, 'ALLOW'::public.capability_effect, 'GLOBAL'::public.rbac_scope_type
from (values ('OPERATIONS'::public.staff_role), ('ADMIN'::public.staff_role), ('SUPER_ADMIN'::public.staff_role)) as r(staff_role)
cross join public.capabilities c
where c.capability_key='operations.pricing.manage'
on conflict (staff_role, capability_id, scope_type) do nothing;

create or replace function public.operations_list_delivery_pricing()
returns setof public.delivery_pricing_config
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform private.require_active_account();
  perform private.require_capability(
    'operations.pricing.manage',
    'GLOBAL'::public.rbac_scope_type,
    null,
    null,
    null
  );
  return query
    select * from public.delivery_pricing_config
    order by active desc, updated_at desc;
end;
$$;

create or replace function public.operations_set_delivery_pricing(
  p_code text,
  p_currency_code text,
  p_base_fee numeric,
  p_per_km_fee numeric,
  p_service_fee_rate numeric,
  p_active boolean
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare v_id uuid;
begin
  perform private.require_active_account();
  perform private.require_capability(
    'operations.pricing.manage',
    'GLOBAL'::public.rbac_scope_type,
    null,
    null,
    null
  );

  if p_code is null or char_length(btrim(p_code)) < 2 then
    raise exception 'INVALID_PRICING_CODE' using errcode='22023';
  end if;
  if p_currency_code <> 'AOA' then
    raise exception 'INVALID_PRICING_CURRENCY' using errcode='22023';
  end if;
  if p_base_fee < 0 or p_per_km_fee < 0 or p_service_fee_rate < 0 then
    raise exception 'INVALID_PRICING_VALUE' using errcode='22023';
  end if;

  if p_active then
    update public.delivery_pricing_config
    set active=false, updated_at=now()
    where active=true;
  end if;

  insert into public.delivery_pricing_config(
    code, currency_code, base_fee, per_km_fee, service_fee_rate, active, updated_at
  )
  values(
    btrim(p_code), 'AOA', p_base_fee, p_per_km_fee, p_service_fee_rate, p_active, now()
  )
  on conflict (code) do update
  set currency_code=excluded.currency_code,
      base_fee=excluded.base_fee,
      per_km_fee=excluded.per_km_fee,
      service_fee_rate=excluded.service_fee_rate,
      active=excluded.active,
      updated_at=now()
  returning id into v_id;

  perform private.append_audit_log(
    'DELIVERY_PRICING_UPDATED',
    'DELIVERY_PRICING_CONFIG',
    v_id,
    jsonb_build_object('code',p_code,'active',p_active,'actor_user_id',auth.uid())
  );

  return v_id;
end;
$$;

revoke all on function public.operations_list_delivery_pricing() from public, anon;
revoke all on function public.operations_set_delivery_pricing(text,text,numeric,numeric,numeric,boolean) from public, anon;
grant execute on function public.operations_list_delivery_pricing() to authenticated;
grant execute on function public.operations_set_delivery_pricing(text,text,numeric,numeric,numeric,boolean) to authenticated;
