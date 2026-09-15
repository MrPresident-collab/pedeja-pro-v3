import { getSupabase } from '@/services/supabase';
import type { Business, Category } from '@/types';

const BUSINESS_SELECT = 'id,name,description,status,address_id,phone,email,created_at,updated_at';

type DbBusiness = {
  id: string; name: string; description: string | null; status: string;
  address_id: string | null; phone: string | null; email: string | null;
  created_at: string; updated_at: string;
};

function mapBusiness(row: DbBusiness): Business {
  return {
    id: row.id,
    name: row.name,
    type: 'Negócio',
    category: undefined,
    rating: 0,
    deliveryMin: 0,
    deliveryMax: 0,
    priceFrom: 0,
    priceLabel: '',
    tone: 'purple',
    icon: 'store',
    promo: false,
    open: row.status === 'ACTIVE',
  };
}

export function createSupabaseMerchantRepository() {
  const sb = getSupabase();
  let businesses: Business[] = [];

  return {
    async initialize() {
      if (!sb) throw new Error('Supabase não configurado.');
      const { data, error } = await sb.from('businesses').select(BUSINESS_SELECT).eq('status', 'ACTIVE').order('name');
      if (error) throw error;
      businesses = ((data ?? []) as DbBusiness[]).map(mapBusiness);
    },
    listNearby(limit?: number) { return limit ? businesses.slice(0, limit) : [...businesses]; },
    listByCategory(category: Category) { return businesses.filter((b) => b.category === category); },
    getById(id: string) { return businesses.find((b) => b.id === id) ?? null; },
  };
}
