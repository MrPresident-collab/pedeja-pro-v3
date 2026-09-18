import { supabase } from '../lib/supabase';

export type CustomerAddress = {
  addressId: string;
  label: string;
  addressLine1: string;
  neighborhood: string | null;
  municipality: string | null;
  city: string;
  province: string;
  recipientName: string;
  recipientPhone: string;
  deliveryInstructions: string | null;
  isDefault: boolean;
};

export async function getDefaultCustomerAddress(): Promise<CustomerAddress | null> {
  const { data, error } = await supabase
    .from('customer_addresses')
    .select('address_id,label,recipient_name,recipient_phone,delivery_instructions,is_default,addresses(address_line_1,neighborhood,municipality,city,province)')
    .eq('customer_id', (await supabase.auth.getUser()).data.user?.id ?? '')
    .eq('is_default', true)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const address = Array.isArray(data.addresses) ? data.addresses[0] : data.addresses;
  if (!address) return null;

  return {
    addressId: String(data.address_id),
    label: String(data.label),
    addressLine1: String(address.address_line_1),
    neighborhood: address.neighborhood ?? null,
    municipality: address.municipality ?? null,
    city: String(address.city),
    province: String(address.province),
    recipientName: String(data.recipient_name),
    recipientPhone: String(data.recipient_phone),
    deliveryInstructions: data.delivery_instructions ?? null,
    isDefault: Boolean(data.is_default),
  };
}

export async function createCustomerAddress(input: {
  label: string;
  addressLine1: string;
  neighborhood?: string;
  municipality?: string;
  city: string;
  province: string;
  latitude: number;
  longitude: number;
  deliveryInstructions?: string;
}): Promise<string> {
  const { data, error } = await supabase.rpc('create_customer_address', {
    p_label: input.label,
    p_address_line_1: input.addressLine1,
    p_neighborhood: input.neighborhood ?? '',
    p_municipality: input.municipality ?? '',
    p_city: input.city,
    p_province: input.province,
    p_latitude: input.latitude,
    p_longitude: input.longitude,
    p_delivery_instructions: input.deliveryInstructions ?? '',
  });

  if (error) throw error;
  if (!data) throw new Error('ADDRESS_CREATION_FAILED');
  return String(data);
}
