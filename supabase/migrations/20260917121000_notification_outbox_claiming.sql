create or replace function public.claim_notification_outbox(p_limit integer default 10)
returns setof public.notification_outbox
language sql
security definer
set search_path to ''
as $$
  with candidates as (
    select id
    from public.notification_outbox
    where status='QUEUED'
      and available_at <= now()
    order by created_at
    for update skip locked
    limit greatest(1, least(coalesce(p_limit,10), 50))
  )
  update public.notification_outbox o
  set status='PROCESSING',
      attempts=o.attempts+1,
      updated_at=now()
  from candidates c
  where o.id=c.id
  returning o.*;
$$;

create or replace function public.complete_notification_outbox(
  p_id uuid,
  p_status text,
  p_provider_message_id text default null,
  p_error text default null
)
returns void
language sql
security definer
set search_path to ''
as $$
  update public.notification_outbox
  set status=p_status,
      provider_message_id=coalesce(p_provider_message_id, provider_message_id),
      last_error=p_error,
      sent_at=case when p_status='SENT' then now() else sent_at end,
      updated_at=now()
  where id=p_id;
$$;

revoke all on function public.claim_notification_outbox(integer) from public, anon, authenticated;
revoke all on function public.complete_notification_outbox(uuid,text,text,text) from public, anon, authenticated;
grant execute on function public.claim_notification_outbox(integer) to service_role;
grant execute on function public.complete_notification_outbox(uuid,text,text,text) to service_role;
