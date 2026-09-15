CREATE OR REPLACE FUNCTION private.provision_profile_on_signup()
  RETURNS TRIGGER
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO ''
  AS $function$
declare
  v_full_name text;
  v_phone text;
begin
  v_full_name := nullif(trim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), '');
  v_phone := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');

  if v_full_name is not null and char_length(v_full_name) > 200 then
    v_full_name := left(v_full_name, 200);
  end if;

  if v_phone is not null and char_length(v_phone) > 32 then
    v_phone := left(v_phone, 32);
  end if;

  insert into public.profiles (id, full_name, phone)
  values (new.id, v_full_name, v_phone);

  return new;
end;
$function$;

GRANT EXECUTE ON FUNCTION "private"."provision_profile_on_signup"() TO "postgres";

REVOKE ALL ON FUNCTION "private"."provision_profile_on_signup"() FROM PUBLIC;
