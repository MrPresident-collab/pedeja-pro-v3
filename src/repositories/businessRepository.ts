import { supabase } from '../lib/supabase';
import type { Business, Product } from '../app/app-types';

const BUSINESS_FIELDS = 'id,name,description,marketplace_category';
const PRODUCT_FIELDS = 'id,name,description,price,currency_code';

export async function listActiveBusinesses(limit = 30): Promise<Business[]> {
  const { data, error } = await supabase
    .from('businesses')
    .select(BUSINESS_FIELDS)
    .eq('status', 'active')
    .order('name')
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Business[];
}

export async function listBusinessProducts(businessId: string): Promise<Product[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_FIELDS)
    .eq('business_id', businessId)
    .eq('status', 'active')
    .order('sort_order');

  if (error) throw error;
  return (data ?? []) as Product[];
}
