CREATE OR REPLACE FUNCTION public.create_customer_order (
  p_business_id           uuid,
  p_delivery_address_id   uuid,
  p_items                 jsonb,
  p_customer_note         text,
  p_delivery_instructions text,
  p_idempotency_key       text
)
  RETURNS uuid
  LANGUAGE sql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
  select private.create_customer_order(
    p_business_id,
    p_delivery_address_id,
    p_items,
    p_customer_note,
    p_delivery_instructions,
    p_idempotency_key
  );
$function$;

GRANT EXECUTE ON FUNCTION "public"."create_customer_order"(uuid, uuid, jsonb, text, text, text) TO "authenticated", "postgres";

REVOKE ALL ON FUNCTION "public"."create_customer_order"(uuid, uuid, jsonb, text, text, text) FROM PUBLIC;
