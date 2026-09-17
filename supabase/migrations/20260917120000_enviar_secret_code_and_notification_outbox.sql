-- ENVIAR secret-code lifecycle.
-- Kupapata remains represented by the existing vehicle_type infrastructure.
-- No new vehicle category is introduced.

alter table public.enviar_shipments
  add column if not exists delivery_secret_code_hash bytea,
  add column if not exists delivery_secret_code_salt bytea,
  add column if not exists delivery_secret_code_version integer not null default 0,
  add column if not exists delivery_secret_code_created_at timestamptz,
  add column if not exists delivery_secret_code_expires_at timestamptz,
  add column if not exists delivery_secret_code_verified_at timestamptz,
  add column if not exists delivery_secret_code_attempts integer not null default 0;

alter table public.enviar_shipments
  add constraint enviar_secret_code_version_check
  check (delivery_secret_code_version >= 0),
  add constraint enviar_secret_code_attempts_check
  check (delivery_secret_code_attempts >= 0);

create table if not exists public.notification_outbox (
  id uuid primary key default extensions.gen_random_uuid(),
  shipment_id uuid references public.enviar_shipments(id) on delete cascade,
  notification_type text not null,
  channel text not null check (channel in ('SMS','WHATSAPP')),
  recipient_phone text not null,
  message_body text not null,
  status text not null default 'QUEUED' check (status in ('QUEUED','PROCESSING','SENT','FAILED')),
  attempts integer not null default 0 check (attempts >= 0),
  available_at timestamptz not null default now(),
  last_error text,
  provider_message_id text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_outbox_status_idx
  on public.notification_outbox(status, available_at);
create index if not exists notification_outbox_shipment_idx
  on public.notification_outbox(shipment_id, created_at desc);

alter table public.notification_outbox enable row level security;
create policy notification_outbox_no_direct_access
  on public.notification_outbox
  for all to public
  using (false)
  with check (false);
revoke all on public.notification_outbox from anon, authenticated;

-- Disable the old MVP pricing row. Operations must explicitly configure the active
-- delivery pricing before a shipment can become payable.
update public.delivery_pricing_config
set active = false, updated_at = now();

-- The existing delivery_pricing_config remains the Operations-owned source of
-- truth. It is deliberately not exposed directly to customer clients.
revoke all on public.delivery_pricing_config from anon, authenticated;

create or replace function private.issue_enviar_secret_code(p_shipment_id uuid, p_reason text)
returns text
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_shipment public.enviar_shipments%rowtype;
  v_code text := '';
  v_salt bytea := extensions.gen_random_bytes(16);
  v_version integer;
  v_message text;
  v_i integer;
begin
  select * into v_shipment
  from public.enviar_shipments
  where id = p_shipment_id
  for update;

  if not found then raise exception 'ENVIAR_SHIPMENT_NOT_FOUND' using errcode='P0002'; end if;
  if v_shipment.status in ('DELIVERED','CANCELLED','FAILED','RETURNED') then
    raise exception 'SECRET_CODE_NOT_AVAILABLE_FOR_SHIPMENT' using errcode='55000';
  end if;

  -- pgcrypto provides cryptographically strong random bytes.
  for v_i in 1..5 loop
    v_code := v_code || (get_byte(extensions.gen_random_bytes(1), 0) % 10)::text;
  end loop;

  v_version := v_shipment.delivery_secret_code_version + 1;
  v_message := format(
    'Pedejá: o código secreto da sua entrega é %s. Partilhe-o com quem vai receber a encomenda. O destinatário deverá fornecê-lo ao estafeta quando ele chegar.',
    v_code
  );

  update public.enviar_shipments
  set delivery_secret_code_hash = extensions.digest(v_salt || convert_to(v_code, 'UTF8'), 'sha256'),
      delivery_secret_code_salt = v_salt,
      delivery_secret_code_version = v_version,
      delivery_secret_code_created_at = now(),
      delivery_secret_code_expires_at = now() + interval '24 hours',
      delivery_secret_code_verified_at = null,
      delivery_secret_code_attempts = 0,
      updated_at = now()
  where id = p_shipment_id;

  -- The sender receives the code. The sender shares it with the receiver.
  -- The receiver then shares it with the rider at the destination.
  insert into public.notification_outbox(
    shipment_id, notification_type, channel, recipient_phone, message_body
  )
  values
    (p_shipment_id, 'ENVIAR_SECRET_CODE', 'SMS', v_shipment.sender_phone, v_message),
    (p_shipment_id, 'ENVIAR_SECRET_CODE', 'WHATSAPP', v_shipment.sender_phone, v_message);

  insert into public.enviar_events(
    shipment_id, event_type, from_status, to_status, actor_user_id, metadata
  )
  values (
    p_shipment_id,
    'SECRET_CODE_ISSUED',
    v_shipment.status,
    v_shipment.status,
    auth.uid(),
    jsonb_build_object(
      'version', v_version,
      'reason', coalesce(p_reason, 'unspecified'),
      'expires_at', now() + interval '24 hours'
    )
  );

  return v_code;
end;
$$;

create or replace function private.verify_enviar_secret_code(
  p_delivery_job_id uuid,
  p_code text
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
declare
  v_job public.delivery_jobs%rowtype;
  v_shipment public.enviar_shipments%rowtype;
  v_rider public.riders%rowtype;
  v_assignment public.delivery_assignments%rowtype;
  v_hash bytea;
  v_user uuid := auth.uid();
begin
  perform private.require_active_account();

  if p_code is null or p_code !~ '^[0-9]{5}$' then
    raise exception 'INVALID_SECRET_CODE_FORMAT' using errcode='22023';
  end if;

  select * into v_job from public.delivery_jobs where id=p_delivery_job_id for update;
  if not found or v_job.enviar_shipment_id is null then
    raise exception 'ENVIAR_DELIVERY_NOT_FOUND' using errcode='P0002';
  end if;
  if v_job.status <> 'ARRIVED_DESTINATION' then
    raise exception 'DELIVERY_NOT_AT_DESTINATION' using errcode='55000';
  end if;

  select * into v_rider from public.riders where user_id=v_user for update;
  if not found then raise exception 'RIDER_NOT_FOUND' using errcode='42501'; end if;

  select * into v_assignment
  from public.delivery_assignments
  where delivery_job_id=p_delivery_job_id
    and rider_id=v_rider.id
    and status='ACCEPTED'
  order by accepted_at desc
  limit 1;
  if not found then raise exception 'ACTIVE_ASSIGNMENT_NOT_FOUND' using errcode='42501'; end if;

  select * into v_shipment
  from public.enviar_shipments
  where id=v_job.enviar_shipment_id
  for update;

  if v_shipment.delivery_secret_code_hash is null
     or v_shipment.delivery_secret_code_salt is null then
    raise exception 'SECRET_CODE_NOT_ISSUED' using errcode='55000';
  end if;
  if v_shipment.delivery_secret_code_expires_at is not null
     and v_shipment.delivery_secret_code_expires_at <= now() then
    raise exception 'SECRET_CODE_EXPIRED' using errcode='55000';
  end if;
  if v_shipment.delivery_secret_code_attempts >= 5 then
    raise exception 'SECRET_CODE_ATTEMPTS_EXCEEDED' using errcode='55000';
  end if;

  v_hash := extensions.digest(
    v_shipment.delivery_secret_code_salt || convert_to(p_code, 'UTF8'),
    'sha256'
  );

  if v_hash <> v_shipment.delivery_secret_code_hash then
    update public.enviar_shipments
    set delivery_secret_code_attempts = delivery_secret_code_attempts + 1,
        updated_at = now()
    where id=v_shipment.id;
    raise exception 'INVALID_SECRET_CODE' using errcode='22023';
  end if;

  update public.enviar_shipments
  set delivery_secret_code_verified_at = now(), updated_at = now()
  where id=v_shipment.id;

  insert into public.enviar_events(
    shipment_id, event_type, from_status, to_status, actor_user_id, metadata
  )
  values (
    v_shipment.id,
    'SECRET_CODE_VERIFIED',
    v_shipment.status,
    v_shipment.status,
    v_user,
    jsonb_build_object('delivery_job_id', p_delivery_job_id, 'code_version', v_shipment.delivery_secret_code_version)
  );

  return p_delivery_job_id;
end;
$$;

create or replace function private.issue_enviar_secret_code_on_assignment_accepted()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare v_shipment_id uuid;
begin
  if old.status is distinct from new.status and new.status='ACCEPTED' then
    select enviar_shipment_id into v_shipment_id
    from public.delivery_jobs
    where id=new.delivery_job_id;

    if v_shipment_id is not null then
      perform private.issue_enviar_secret_code(v_shipment_id, 'rider_accepted');
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enviar_issue_secret_code_on_assignment_accepted
  on public.delivery_assignments;
create trigger enviar_issue_secret_code_on_assignment_accepted
after update of status on public.delivery_assignments
for each row
execute function private.issue_enviar_secret_code_on_assignment_accepted();

create or replace function public.rider_verify_enviar_secret_code(
  p_delivery_job_id uuid,
  p_code text
)
returns uuid
language sql
security definer
set search_path to ''
as $$
  select private.verify_enviar_secret_code(p_delivery_job_id, p_code);
$$;

create or replace function public.operations_regenerate_enviar_secret_code(
  p_shipment_id uuid
)
returns uuid
language plpgsql
security definer
set search_path to ''
as $$
begin
  perform private.require_active_account();
  perform private.require_capability(
    'operations.enviar.manage',
    'GLOBAL'::public.rbac_scope_type,
    null,
    null,
    null
  );
  perform private.issue_enviar_secret_code(p_shipment_id, 'operations_regeneration');
  perform private.append_audit_log(
    'ENVIAR_SECRET_CODE_REGENERATED',
    'ENVIAR_SHIPMENT',
    p_shipment_id,
    jsonb_build_object('actor_user_id', auth.uid())
  );
  return p_shipment_id;
end;
$$;

revoke all on function public.rider_verify_enviar_secret_code(uuid,text) from public, anon;
grant execute on function public.rider_verify_enviar_secret_code(uuid,text) to authenticated;
revoke all on function public.operations_regenerate_enviar_secret_code(uuid) from public, anon;
grant execute on function public.operations_regenerate_enviar_secret_code(uuid) to authenticated;

-- Block direct completion of an ENVIAR delivery unless the secret code was verified.
create or replace function private.guard_enviar_delivery_code()
returns trigger
language plpgsql
security definer
set search_path to ''
as $$
declare v_verified_at timestamptz;
begin
  if new.status='DELIVERED' and old.status is distinct from new.status and new.enviar_shipment_id is not null then
    select delivery_secret_code_verified_at into v_verified_at
    from public.enviar_shipments
    where id=new.enviar_shipment_id;
    if v_verified_at is null then
      raise exception 'SECRET_CODE_REQUIRED' using errcode='55000';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists enviar_guard_delivery_code on public.delivery_jobs;
create trigger enviar_guard_delivery_code
before update of status on public.delivery_jobs
for each row
execute function private.guard_enviar_delivery_code();
