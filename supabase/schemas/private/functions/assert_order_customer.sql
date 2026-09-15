CREATE OR REPLACE FUNCTION private.assert_order_customer (
  p_order_id uuid
)
  RETURNS uuid
  LANGUAGE plpgsql
  STABLE
  SET search_path TO ''
  AS $function$
declare v_user_id uuid := auth.uid(); v_customer_id uuid;
begin
  if v_user_id is null then raise exception 'AUTHENTICATION_REQUIRED' using errcode='28000'; end if;
  select o.customer_id into v_customer_id from public.orders o where o.id=p_order_id;
  if v_customer_id is null then raise exception 'RESOURCE_NOT_FOUND' using errcode='P0002'; end if;
  if v_customer_id <> v_user_id then raise exception 'RESOURCE_ACCESS_DENIED' using errcode='42501'; end if;
  return v_user_id;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."assert_order_customer"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."assert_order_customer"(uuid) FROM PUBLIC;
