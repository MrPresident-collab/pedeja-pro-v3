CREATE OR REPLACE FUNCTION private.is_delivery_customer (
  p_delivery_job_id uuid
)
  RETURNS boolean
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select exists (
    select 1
    from public.delivery_jobs dj
    left join public.orders o on o.id = dj.order_id
    left join public.enviar_shipments es on es.id = dj.enviar_shipment_id
    where dj.id = p_delivery_job_id
      and (o.customer_id = (select auth.uid()) or es.customer_id = (select auth.uid()))
  );
$function$;

GRANT EXECUTE ON FUNCTION "private"."is_delivery_customer"(uuid) TO "postgres";

REVOKE ALL ON FUNCTION "private"."is_delivery_customer"(uuid) FROM PUBLIC;
