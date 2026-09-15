-- Pedejá production hardening: public order references, proof RPC exposure,
-- and live Operations offer policy for manual dispatch.
begin;

revoke execute on function public.rider_submit_delivery_proof(uuid,text,text,jsonb) from public, anon;
revoke execute on function public.rider_submit_delivery_proof(uuid,text,jsonb) from public, anon;
grant execute on function public.rider_submit_delivery_proof(uuid,text,text,jsonb) to authenticated;
grant execute on function public.rider_submit_delivery_proof(uuid,text,jsonb) to authenticated;

create sequence if not exists public.pedeja_order_reference_seq start with 10000;
alter table public.orders add column if not exists order_reference text;
update public.orders
set order_reference = 'P-' || nextval('public.pedeja_order_reference_seq')
where order_reference is null;
alter table public.orders alter column order_reference set default ('P-' || nextval('public.pedeja_order_reference_seq'));
alter table public.orders alter column order_reference set not null;
create unique index if not exists orders_order_reference_uq on public.orders(order_reference);

create or replace function private.dispatch_assign_delivery(
  p_delivery_job_id uuid,
  p_rider_id uuid,
  p_vehicle_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job public.delivery_jobs%rowtype;
  v_rider public.riders%rowtype;
  v_vehicle public.vehicles%rowtype;
  v_assignment uuid;
  v_attempt integer;
  v_actor uuid := auth.uid();
  v_offer_seconds integer;
begin
  perform private.require_active_account();
  perform private.require_capability('dispatch.delivery.assign','GLOBAL'::public.rbac_scope_type,null,null,null);

  select rider_offer_seconds into v_offer_seconds
  from public.operational_policy_settings
  where id=true;
  v_offer_seconds := greatest(coalesce(v_offer_seconds,35),1);

  select * into v_job from public.delivery_jobs where id=p_delivery_job_id for update;
  if not found then raise exception 'DELIVERY_NOT_FOUND' using errcode='P0002'; end if;
  if v_job.status not in ('AVAILABLE','REASSIGNMENT_REQUIRED') then raise exception 'DELIVERY_NOT_ASSIGNABLE' using errcode='55000'; end if;

  select * into v_rider from public.riders where id=p_rider_id for update;
  if not found then raise exception 'RIDER_NOT_FOUND' using errcode='P0002'; end if;
  if v_rider.availability_status <> 'AVAILABLE' then raise exception 'RIDER_NOT_AVAILABLE' using errcode='55000'; end if;
  if not exists(select 1 from public.rider_profiles rp where rp.user_id=v_rider.user_id and rp.verification_status='VERIFIED') then raise exception 'RIDER_NOT_VERIFIED' using errcode='55000'; end if;

  if p_vehicle_id is not null then
    select * into v_vehicle from public.vehicles where id=p_vehicle_id for update;
    if not found or v_vehicle.status <> 'ACTIVE' or v_vehicle.rider_id is distinct from p_rider_id then raise exception 'INVALID_RIDER_VEHICLE' using errcode='22023'; end if;
  end if;

  if exists(select 1 from public.delivery_assignments da where da.delivery_job_id=p_delivery_job_id and da.status in ('PROPOSED','ASSIGNED','ACCEPTED')) then raise exception 'DELIVERY_ALREADY_ASSIGNED'; end if;

  select coalesce(max(attempt_number),0)+1 into v_attempt from public.delivery_assignments where delivery_job_id=p_delivery_job_id;
  insert into public.delivery_assignments(delivery_job_id,rider_id,vehicle_id,status,proposed_at,assigned_at,offer_expires_at,attempt_number)
  values(p_delivery_job_id,p_rider_id,p_vehicle_id,'PROPOSED',now(),now(),now()+make_interval(secs=>v_offer_seconds),v_attempt)
  returning id into v_assignment;

  update public.delivery_jobs set status='ASSIGNED',updated_at=now() where id=p_delivery_job_id;
  insert into public.delivery_events(delivery_job_id,event_type,from_status,to_status,rider_id,actor_user_id,metadata)
  values(p_delivery_job_id,'RIDER_OFFERED','AVAILABLE','ASSIGNED',p_rider_id,v_actor,jsonb_build_object('assignment_id',v_assignment,'attempt_number',v_attempt,'offer_expires_at',now()+make_interval(secs=>v_offer_seconds),'manual_dispatch',true));
  return v_assignment;
end;
$$;

commit;
