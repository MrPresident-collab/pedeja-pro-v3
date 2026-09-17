create or replace function public.get_customer_order_detail(p_order_id uuid)
returns jsonb
language sql
security definer
set search_path = pg_catalog, public, auth
as $$
  select jsonb_build_object(
    'orderId', o.id,
    'orderReference', o.order_reference,
    'status', o.status,
    'paymentStatus', o.payment_status,
    'businessId', o.business_id,
    'businessName', b.name,
    'businessCategory', b.marketplace_category,
    'subtotal', o.subtotal,
    'deliveryFee', o.delivery_fee,
    'serviceFee', o.service_fee,
    'discountAmount', o.discount_amount,
    'totalAmount', o.total_amount,
    'currencyCode', o.currency_code,
    'paymentMethod', o.payment_method,
    'placedAt', o.placed_at,
    'acceptedAt', o.accepted_at,
    'deliveredAt', o.delivered_at,
    'cancelledAt', o.cancelled_at,
    'deliveryAddress', jsonb_build_object(
      'line1', o.delivery_address_line_1,
      'line2', o.delivery_address_line_2,
      'neighborhood', o.delivery_neighborhood,
      'municipality', o.delivery_municipality,
      'city', o.delivery_city,
      'province', o.delivery_province,
      'countryCode', o.delivery_country_code
    ),
    'recipientName', o.recipient_name,
    'recipientPhone', o.recipient_phone,
    'deliveryInstructions', o.delivery_instructions,
    'customerNote', o.customer_note,
    'items', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', oi.id,
          'productId', oi.product_id,
          'name', oi.product_name_snapshot,
          'sku', oi.sku_snapshot,
          'unitPrice', oi.unit_price_snapshot,
          'quantity', oi.quantity,
          'lineTotal', oi.line_total
        ) order by oi.created_at asc
      )
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb),
    'delivery', (
      select jsonb_build_object(
        'jobId', dj.id,
        'status', dj.status,
        'riderId', r.id,
        'riderName', p.full_name,
        'riderPhone', p.phone,
        'vehicleType', v.vehicle_type,
        'vehicleMake', v.make,
        'vehicleModel', v.model,
        'vehicleRegistration', v.registration_number
      )
      from public.delivery_jobs dj
      left join lateral (
        select da.rider_id, da.vehicle_id
        from public.delivery_assignments da
        where da.delivery_job_id = dj.id
          and da.status in ('ACCEPTED'::public.assignment_status, 'ASSIGNED'::public.assignment_status)
        order by coalesce(da.accepted_at, da.assigned_at, da.created_at) desc
        limit 1
      ) da on true
      left join public.riders r on r.id = da.rider_id
      left join public.profiles p on p.id = r.user_id
      left join public.vehicles v on v.id = da.vehicle_id
      where dj.order_id = o.id
      order by dj.created_at desc
      limit 1
    )
  )
  from public.orders o
  join public.businesses b on b.id = o.business_id
  where o.id = p_order_id
    and o.customer_id = (select auth.uid());
$$;

revoke all on function public.get_customer_order_detail(uuid) from public, anon;
grant execute on function public.get_customer_order_detail(uuid) to authenticated;
