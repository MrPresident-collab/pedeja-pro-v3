CREATE OR REPLACE FUNCTION private.create_customer_order (
  p_business_id           uuid,
  p_delivery_address_id   uuid,
  p_items                 jsonb,
  p_customer_note         text,
  p_delivery_instructions text,
  p_idempotency_key       text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid;
  v_order_id uuid := extensions.gen_random_uuid();
  v_customer_address record;
  v_product record;
  v_item jsonb;
  v_quantity integer;
  v_subtotal numeric(14,2) := 0;
  v_delivery_fee numeric(14,2) := 0;
  v_service_fee numeric(14,2) := 0;
  v_discount numeric(14,2) := 0;
  v_total numeric(14,2);
  v_request jsonb;
  v_request_fingerprint text;
  v_existing_order public.orders%rowtype;
begin
  v_user_id := private.require_active_account();
  perform private.assert_customer_resource_owner(v_user_id);

  if p_idempotency_key is null or char_length(btrim(p_idempotency_key)) not between 1 and 200 then
    raise exception 'VALIDATION_FAILED' using errcode = '22023';
  end if;
  p_idempotency_key := btrim(p_idempotency_key);

  if p_items is null or jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'ORDER_ITEMS_REQUIRED' using errcode = '22023';
  end if;

  v_request := jsonb_build_object(
    'business_id', p_business_id,
    'delivery_address_id', p_delivery_address_id,
    'items', (
      select jsonb_agg(
        jsonb_build_object(
          'product_id', item.value ->> 'product_id',
          'quantity', item.value ->> 'quantity'
        )
        order by item.value ->> 'product_id', item.value ->> 'quantity'
      )
      from jsonb_array_elements(p_items) as item(value)
    ),
    'customer_note', coalesce(p_customer_note, ''),
    'delivery_instructions', coalesce(p_delivery_instructions, '')
  );
  v_request_fingerprint := encode(extensions.digest(v_request::text, 'sha256'), 'hex');

  select *
    into v_existing_order
  from public.orders o
  where o.customer_id = v_user_id
    and o.idempotency_key = p_idempotency_key
  for update;

  if found then
    if v_existing_order.idempotency_request_fingerprint <> v_request_fingerprint then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing_order.id;
  end if;

  select ca.customer_id, a.*, ca.recipient_name, ca.recipient_phone, ca.delivery_instructions
    into v_customer_address
  from public.customer_addresses ca
  join public.addresses a on a.id = ca.address_id
  where ca.customer_id = v_user_id
    and ca.address_id = p_delivery_address_id;

  if not found then
    raise exception 'DELIVERY_ADDRESS_NOT_OWNED' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.businesses b
    where b.id = p_business_id
      and b.status <> 'ACTIVE'::public.business_status
  ) then
    raise exception 'BUSINESS_NOT_ACTIVE' using errcode = 'P0001';
  end if;
  if not exists (select 1 from public.businesses b where b.id = p_business_id) then
    raise exception 'BUSINESS_NOT_FOUND' using errcode = 'P0002';
  end if;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    if not (v_item ? 'product_id') or not (v_item ? 'quantity') then
      raise exception 'INVALID_ORDER_ITEM' using errcode = '22023';
    end if;

    begin
      v_quantity := (v_item ->> 'quantity')::integer;
    exception when invalid_text_representation then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end;

    if v_quantity <= 0 or v_quantity > 100 then
      raise exception 'INVALID_QUANTITY' using errcode = '22023';
    end if;

    select p.id, p.name, p.sku, p.price, p.currency_code, p.status
      into v_product
    from public.products p
    where p.id = (v_item ->> 'product_id')::uuid
      and p.business_id = p_business_id
    for share;

    if not found then
      raise exception 'PRODUCT_NOT_FOUND_FOR_BUSINESS' using errcode = 'P0002';
    end if;
    if v_product.status <> 'ACTIVE'::public.product_status then
      raise exception 'PRODUCT_NOT_AVAILABLE' using errcode = 'P0001';
    end if;
    if v_product.currency_code <> 'AOA' then
      raise exception 'UNSUPPORTED_CURRENCY' using errcode = '22023';
    end if;

    v_subtotal := v_subtotal + round(v_product.price * v_quantity, 2);
  end loop;

  if v_subtotal <= 0 then
    raise exception 'ORDER_TOTAL_INVALID' using errcode = '22023';
  end if;

  v_total := v_subtotal + v_delivery_fee + v_service_fee - v_discount;

  begin
    insert into public.orders(
      id, customer_id, business_id, status, payment_status, currency_code,
      subtotal, delivery_fee, service_fee, discount_amount, total_amount,
      delivery_address_id, delivery_address_line_1, delivery_address_line_2,
      delivery_neighborhood, delivery_municipality, delivery_city, delivery_province,
      delivery_country_code, delivery_location, recipient_name, recipient_phone,
      delivery_instructions, customer_note, idempotency_key, idempotency_request_fingerprint
    ) values (
      v_order_id, v_user_id, p_business_id,
      'PENDING_PAYMENT'::public.order_status,
      'UNPAID'::public.order_payment_status,
      'AOA',
      v_subtotal, v_delivery_fee, v_service_fee, v_discount, v_total,
      p_delivery_address_id,
      v_customer_address.address_line_1,
      v_customer_address.address_line_2,
      v_customer_address.neighborhood,
      v_customer_address.municipality,
      v_customer_address.city,
      v_customer_address.province,
      v_customer_address.country_code,
      v_customer_address.location,
      v_customer_address.recipient_name,
      v_customer_address.recipient_phone,
      coalesce(p_delivery_instructions, v_customer_address.delivery_instructions),
      p_customer_note,
      p_idempotency_key,
      v_request_fingerprint
    );
  exception when unique_violation then
    select *
      into v_existing_order
    from public.orders o
    where o.customer_id = v_user_id
      and o.idempotency_key = p_idempotency_key
    for update;

    if not found then
      raise;
    end if;
    if v_existing_order.idempotency_request_fingerprint <> v_request_fingerprint then
      raise exception 'IDEMPOTENCY_CONFLICT' using errcode = '23505';
    end if;
    return v_existing_order.id;
  end;

  for v_item in select value from jsonb_array_elements(p_items)
  loop
    select p.id, p.name, p.sku, p.price, p.currency_code, p.status
      into v_product
    from public.products p
    where p.id = (v_item ->> 'product_id')::uuid
      and p.business_id = p_business_id
    for share;

    v_quantity := (v_item ->> 'quantity')::integer;

    insert into public.order_items(
      order_id, product_id, product_name_snapshot, sku_snapshot,
      unit_price_snapshot, quantity, line_total
    ) values (
      v_order_id, v_product.id, v_product.name, v_product.sku,
      v_product.price, v_quantity, round(v_product.price * v_quantity, 2)
    );
  end loop;

  insert into public.order_events(
    order_id, event_type, from_status, to_status, actor_user_id, metadata
  ) values (
    v_order_id, 'ORDER_CREATED', 'DRAFT', 'PENDING_PAYMENT', v_user_id,
    jsonb_build_object(
      'source', 'trusted_rpc',
      'item_count', jsonb_array_length(p_items),
      'idempotency_key_present', true
    )
  );

  return v_order_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."create_customer_order"(uuid, uuid, jsonb, text, text, text) TO "postgres";

REVOKE ALL ON FUNCTION "private"."create_customer_order"(uuid, uuid, jsonb, text, text, text) FROM PUBLIC;
