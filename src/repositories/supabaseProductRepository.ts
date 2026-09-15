import { getSupabase } from '@/services/supabase';
import type { Product } from '@/types';

const PRODUCT_SELECT = 'id,business_id,name,description,image_url,price,currency_code,status,sort_order,created_at,updated_at';
type DbProduct = { id:string; business_id:string; name:string; description:string|null; image_url:string|null; price:number|string; currency_code:string; status:string; sort_order:number; created_at:string; updated_at:string };

function mapProduct(row: DbProduct): Product {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    price: Number(row.price),
    prepTime: 0,
    available: row.status === 'ACTIVE',
    category: 'Geral',
  };
}

export function createSupabaseProductRepository() {
  const sb = getSupabase();
  const cache = new Map<string, Product[]>();
  const byId = new Map<string, Product>();
  return {
    async initialize() {
      if (!sb) throw new Error('Supabase não configurado.');
      const { data, error } = await sb.from('products').select(PRODUCT_SELECT).eq('status', 'ACTIVE').order('sort_order').order('created_at');
      if (error) throw error;
      cache.clear(); byId.clear();
      for (const row of (data ?? []) as DbProduct[]) {
        const p = mapProduct(row); byId.set(p.id, p);
        const list = cache.get(row.business_id) ?? []; list.push(p); cache.set(row.business_id, list);
      }
    },
    listByBusiness(businessId: string) { return [...(cache.get(businessId) ?? [])]; },
    getById(id: string) { return byId.get(id) ?? null; },
  };
}
