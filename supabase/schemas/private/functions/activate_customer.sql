CREATE OR REPLACE FUNCTION private.activate_customer()
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_user_id uuid;
begin
  v_user_id := private.require_active_account();

  insert into public.customer_profiles (user_id)
  values (v_user_id)
  on conflict (user_id) do nothing;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."activate_customer"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."activate_customer"() FROM PUBLIC;
