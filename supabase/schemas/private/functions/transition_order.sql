CREATE OR REPLACE FUNCTION private.transition_order (
  p_order_id   uuid,
  p_action     text,
  p_actor_mode text
)
  RETURNS uuid
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_order public.orders%rowtype;
  v_user uuid;
  v_to_status public.order_status;
  v_event_type text;
  v_now timestamptz := now();
begin
  v_user := private.require_authenticated();

  if p_order_id is null then
    raise exception 'ORDER_ID_REQUIRED' using errcode = '22023';
  end if;

  select *
    into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    raise exception 'ORDER_NOT_FOUND' using errcode = 'P0002';
  end if;

  if p_actor_mode = 'BUSINESS' then
    perform private.assert_business_member(v_order.business_id, 'MANAGER'::public.business_member_role);
  elsif p_actor_mode = 'OPERATIONS' then
    perform private.require_capability(
      'operations.order.manage',
      'GLOBAL'::public.rbac_scope_type,
      null,
      null,
      null
    );
  elsif p_actor_mode = 'CUSTOMER' then
    perform private.require_active_account();
    perform private.assert_order_customer(p_order_id);
  else
    raise exception 'INVALID_ORDER_ACTOR_MODE' using errcode = '22023';
  end if;

  case p_action
    when 'ACCEPT' then
      v_to_status := 'ACCEPTED'::public.order_status;
      v_event_type := 'ORDER_ACCEPTED';
    when 'START_PREPARING' then
      v_to_status := 'PREPARING'::public.order_status;
      v_event_type := 'ORDER_PREPARING';
    when 'MARK_READY' then
      v_to_status := 'READY'::public.order_status;
      v_event_type := 'ORDER_READY';
    when 'CANCEL_CUSTOMER' then
      if p_actor_mode <> 'CUSTOMER' then
        raise exception 'INVALID_ORDER_ACTOR' using errcode = '22023';
      end if;
      v_to_status := 'CANCELLED'::public.order_status;
      v_event_type := 'ORDER_CANCELLED_BY_CUSTOMER';
    when 'CANCEL_OPERATIONS' then
      if p_actor_mode <> 'OPERATIONS' then
        raise exception 'INVALID_ORDER_ACTOR' using errcode = '22023';
      end if;
      v_to_status := 'CANCELLED'::public.order_status;
      v_event_type := 'ORDER_CANCELLED_BY_OPERATIONS';
    else
      raise exception 'UNKNOWN_ORDER_ACTION' using errcode = '22023';
  end case;

  if v_order.status = v_to_status then
    return p_order_id;
  end if;

  case p_action
    when 'ACCEPT' then
      if v_order.status <> 'PAID'::public.order_status
         or v_order.payment_status <> 'PAID'::public.order_payment_status then
        raise exception 'INVALID_STATE_TRANSITION' using errcode = 'P0001';
      end if;
    when 'START_PREPARING' then
      if v_order.status <> 'ACCEPTED'::public.order_status then
        raise exception 'INVALID_STATE_TRANSITION' using errcode = 'P0001';
      end if;
    when 'MARK_READY' then
      if v_order.status <> 'PREPARING'::public.order_status then
        raise exception 'INVALID_STATE_TRANSITION' using errcode = 'P0001';
      end if;
    when 'CANCEL_CUSTOMER' then
      if v_order.status <> 'PENDING_PAYMENT'::public.order_status then
        raise exception 'INVALID_STATE_TRANSITION' using errcode = 'P0001';
      end if;
    when 'CANCEL_OPERATIONS' then
      if v_order.status in (
        'DELIVERED'::public.order_status,
        'CANCELLED'::public.order_status,
        'FAILED'::public.order_status
      ) or v_order.payment_status = 'PAID'::public.order_payment_status then
        raise exception 'INVALID_STATE_TRANSITION' using errcode = 'P0001';
      end if;
  end case;

  update public.orders
  set status = v_to_status,
      accepted_at = case
        when v_to_status = 'ACCEPTED'::public.order_status then v_now
        else accepted_at
      end,
      cancelled_at = case
        when v_to_status = 'CANCELLED'::public.order_status then v_now
        else cancelled_at
      end,
      updated_at = v_now
  where id = p_order_id;

  insert into public.order_events(
    order_id, event_type, from_status, to_status, actor_user_id, metadata, created_at
  ) values (
    p_order_id, v_event_type, v_order.status, v_to_status, v_user,
    jsonb_build_object('command', p_action, 'actor_mode', p_actor_mode),
    v_now
  );

  return p_order_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."transition_order"(uuid, text, text) TO "postgres";

REVOKE ALL ON FUNCTION "private"."transition_order"(uuid, text, text) FROM PUBLIC;
