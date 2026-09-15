-- Customer address command boundary.
-- Keeps address mutations behind SECURITY DEFINER functions while public tables remain deny-by-default.

create or replace function private.create_customer_address(
  p_label text, p_address_line_1 text, p_neighborhood text, p_municipality text,
  p_city text, p_province text, p_latitude double precision, p_longitude double precision,
  p_delivery_instructions text
)
returns uuid
language plpgsql security definer set search_path to ''
as $$
declare
  v_user_id uuid;
  v_address_id uuid := extensions.gen_random_uuid();
  v_name text;
  v_phone text;
  v_is_default boolean;
begin
  v_user_id := private.require_active_account();
  perform private.assert_customer_resource_owner(v_user_id);
  if p_label is null or char_length(btrim(p_label)) not between 1 and 80 then raise exception 'INVALID_ADDRESS_LABEL' using errcode='22023'; end if;
  if p_address_line_1 is null or char_length(btrim(p_address_line_1)) not between 2 and 300 then raise exception 'INVALID_ADDRESS_LINE' using errcode='22023'; end if;
  if p_city is null or char_length(btrim(p_city)) not between 2 and 100 then raise exception 'INVALID_ADDRESS_CITY' using errcode='22023'; end if;
  if p_province is null or char_length(btrim(p_province)) not between 2 and 100 then raise exception 'INVALID_ADDRESS_PROVINCE' using errcode='22023'; end if;
  if p_latitude is null or p_longitude is null or p_latitude not between -90 and 90 or p_longitude not between -180 and 180 then raise exception 'INVALID_ADDRESS_LOCATION' using errcode='22023'; end if;
  select full_name, phone into v_name, v_phone from public.profiles where id=v_user_id;
  if nullif(btrim(coalesce(v_name,'')),'') is null or nullif(btrim(coalesce(v_phone,'')),'') is null then raise exception 'PROFILE_CONTACT_REQUIRED' using errcode='22023'; end if;
  select not exists(select 1 from public.customer_addresses where customer_id=v_user_id) into v_is_default;
  insert into public.addresses(id,address_line_1,neighborhood,municipality,city,province,country_code,location)
  values(v_address_id,btrim(p_address_line_1),nullif(btrim(p_neighborhood),''),nullif(btrim(p_municipality),''),btrim(p_city),btrim(p_province),'AO',extensions.ST_SetSRID(extensions.ST_MakePoint(p_longitude,p_latitude),4326)::extensions.geography);
  insert into public.customer_addresses(customer_id,address_id,label,recipient_name,recipient_phone,delivery_instructions,is_default)
  values(v_user_id,v_address_id,btrim(p_label),v_name,v_phone,nullif(btrim(p_delivery_instructions),''),v_is_default);
  return v_address_id;
end; $$;
grant execute on function private.create_customer_address(text,text,text,text,text,text,double precision,double precision,text) to postgres;
revoke all on function private.create_customer_address(text,text,text,text,text,text,double precision,double precision,text) from public, authenticated;

create or replace function public.create_customer_address(
  p_label text, p_address_line_1 text, p_neighborhood text, p_municipality text,
  p_city text, p_province text, p_latitude double precision, p_longitude double precision,
  p_delivery_instructions text
)
returns uuid language sql security definer set search_path to '' as $$
select private.create_customer_address(p_label,p_address_line_1,p_neighborhood,p_municipality,p_city,p_province,p_latitude,p_longitude,p_delivery_instructions); $$;
grant execute on function public.create_customer_address(text,text,text,text,text,text,double precision,double precision,text) to authenticated, postgres;
revoke all on function public.create_customer_address(text,text,text,text,text,text,double precision,double precision,text) from public;

create or replace function private.set_default_customer_address(p_address_id uuid)
returns boolean language plpgsql security definer set search_path to '' as $$
declare v_user_id uuid;
begin
  v_user_id:=private.require_active_account();
  if not exists(select 1 from public.customer_addresses where customer_id=v_user_id and address_id=p_address_id) then raise exception 'ADDRESS_NOT_OWNED' using errcode='42501'; end if;
  update public.customer_addresses set is_default=false where customer_id=v_user_id;
  update public.customer_addresses set is_default=true where customer_id=v_user_id and address_id=p_address_id;
  return true;
end; $$;
grant execute on function private.set_default_customer_address(uuid) to postgres;
revoke all on function private.set_default_customer_address(uuid) from public, authenticated;
create or replace function public.set_default_customer_address(p_address_id uuid) returns boolean language sql security definer set search_path to '' as $$ select private.set_default_customer_address(p_address_id); $$;
grant execute on function public.set_default_customer_address(uuid) to authenticated, postgres;
revoke all on function public.set_default_customer_address(uuid) from public;

create or replace function private.remove_customer_address(p_address_id uuid)
returns boolean language plpgsql security definer set search_path to '' as $$
declare v_user_id uuid; v_was_default boolean;
begin
  v_user_id:=private.require_active_account();
  select is_default into v_was_default from public.customer_addresses where customer_id=v_user_id and address_id=p_address_id;
  if not found then raise exception 'ADDRESS_NOT_OWNED' using errcode='42501'; end if;
  delete from public.customer_addresses where customer_id=v_user_id and address_id=p_address_id;
  delete from public.addresses a where a.id=p_address_id and not exists(select 1 from public.customer_addresses ca where ca.address_id=a.id) and not exists(select 1 from public.businesses b where b.address_id=a.id);
  if v_was_default then update public.customer_addresses set is_default=true where customer_id=v_user_id and address_id=(select address_id from public.customer_addresses where customer_id=v_user_id order by created_at limit 1); end if;
  return true;
end; $$;
grant execute on function private.remove_customer_address(uuid) to postgres;
revoke all on function private.remove_customer_address(uuid) from public, authenticated;
create or replace function public.remove_customer_address(p_address_id uuid) returns boolean language sql security definer set search_path to '' as $$ select private.remove_customer_address(p_address_id); $$;
grant execute on function public.remove_customer_address(uuid) to authenticated, postgres;
revoke all on function public.remove_customer_address(uuid) from public;

create or replace function private.update_customer_address(p_address_id uuid,p_label text,p_address_line_1 text,p_neighborhood text,p_delivery_instructions text)
returns uuid language plpgsql security definer set search_path to '' as $$
declare v_user_id uuid;
begin
  v_user_id:=private.require_active_account();
  if not exists(select 1 from public.customer_addresses where customer_id=v_user_id and address_id=p_address_id) then raise exception 'ADDRESS_NOT_OWNED' using errcode='42501'; end if;
  if p_label is not null and char_length(btrim(p_label)) not between 1 and 80 then raise exception 'INVALID_ADDRESS_LABEL' using errcode='22023'; end if;
  if p_address_line_1 is not null and char_length(btrim(p_address_line_1)) not between 2 and 300 then raise exception 'INVALID_ADDRESS_LINE' using errcode='22023'; end if;
  update public.customer_addresses set label=coalesce(btrim(p_label),label),delivery_instructions=case when p_delivery_instructions is null then delivery_instructions else nullif(btrim(p_delivery_instructions),'') end where customer_id=v_user_id and address_id=p_address_id;
  update public.addresses set address_line_1=coalesce(btrim(p_address_line_1),address_line_1),neighborhood=case when p_neighborhood is null then neighborhood else nullif(btrim(p_neighborhood),'') end where id=p_address_id;
  return p_address_id;
end; $$;
grant execute on function private.update_customer_address(uuid,text,text,text,text) to postgres;
revoke all on function private.update_customer_address(uuid,text,text,text,text) from public, authenticated;
create or replace function public.update_customer_address(p_address_id uuid,p_label text,p_address_line_1 text,p_neighborhood text,p_delivery_instructions text) returns uuid language sql security definer set search_path to '' as $$ select private.update_customer_address(p_address_id,p_label,p_address_line_1,p_neighborhood,p_delivery_instructions); $$;
grant execute on function public.update_customer_address(uuid,text,text,text,text) to authenticated, postgres;
revoke all on function public.update_customer_address(uuid,text,text,text,text) from public;
