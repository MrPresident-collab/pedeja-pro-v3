-- Customer-only tracking snapshot.
-- Apply this migration in the linked Supabase project before enabling the
-- RPC-based tracking repository in production.

create or replace function public.get_customer_enviar_tracking(p_shipment_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  select jsonb_build_object(
    'shipmentId', s.id,
    'status', s.status,
    'deliveryJobId', dj.id,
    'deliveryStatus', dj.status,
    'expectedDeliveryAt', dj.expected_delivery_at,
    'distanceKm', dj.delivery_distance_km,
    'assignmentId', da.id,
    'riderId', r.id,
    'riderName', p.full_name,
    'riderPhone', p.phone,
    'riderLocation', case
      when r.current_location is null then null
      else st_asgeojson(r.current_location)::jsonb
    end,
    'riderLocationUpdatedAt', r.last_location_at,
    'vehicleMake', v.make,
    'vehicleModel', v.model,
    'vehicleRegistration', v.registration_number
  )
  from public.enviar_shipments s
  left join public.delivery_jobs dj
    on dj.enviar_shipment_id = s.id
  left join lateral (
    select da.*
    from public.delivery_assignments da
    where da.delivery_job_id = dj.id
    order by da.accepted_at desc nulls last,
             da.assigned_at desc nulls last,
             da.created_at desc
    limit 1
  ) da on true
  left join public.riders r on r.id = da.rider_id
  left join public.profiles p on p.id = r.user_id
  left join public.vehicles v on v.id = da.vehicle_id
  where s.id = p_shipment_id
    and s.customer_id = auth.uid()
  limit 1;
$$;

grant execute on function public.get_customer_enviar_tracking(uuid) to authenticated;

create index if not exists delivery_jobs_enviar_shipment_id_idx
  on public.delivery_jobs (enviar_shipment_id);

create index if not exists delivery_assignments_delivery_job_accepted_idx
  on public.delivery_assignments (delivery_job_id, accepted_at desc);
