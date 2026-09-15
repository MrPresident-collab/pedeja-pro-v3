import type { Repositories } from './types';
import { createMockRepositories } from './mock';
import { createSupabaseMerchantRepository } from './supabaseMerchantRepository';
import { createSupabaseProductRepository } from './supabaseProductRepository';
import { createSupabaseProfileRepository } from './supabaseProfileRepository';
import { createSupabaseLocationRepository } from './supabaseLocationRepository';
import { createSupabaseOrderRepository } from './supabaseOrderRepository';
import { isDemoModeEnabled, isSupabaseConfigured } from '@/services/supabase';

function createProductionRepositories(): Repositories {
  const mock = createMockRepositories();
  const merchant = createSupabaseMerchantRepository();
  const product = createSupabaseProductRepository();
  const profile = createSupabaseProfileRepository();
  const location = createSupabaseLocationRepository();
  const order = createSupabaseOrderRepository();
  let cartBusiness: import('@/types').Business | null = null;
  let cartLines: import('@/types').CartLine[] = [];
  let cartTip = 0;

  const cart: Repositories['cart'] = {
    getBusiness: () => cartBusiness ? { ...cartBusiness } : null,
    getLines: () => cartLines.map((line) => ({ ...line })),
    getTip: () => cartTip,
    getDeliveryFee: () => 0,
    setBusiness: (business) => {
      if (business && cartBusiness && cartBusiness.id !== business.id && cartLines.length > 0) {
        cartLines = [];
        cartTip = 0;
      }
      cartBusiness = business ? { ...business } : null;
    },
    addProduct: (product) => {
      const line = cartLines.find((item) => item.productId === product.id);
      if (line) line.quantity = Math.min(line.quantity + 1, 99);
      else cartLines.push({ productId: product.id, name: product.name, unitPrice: product.price, quantity: 1 });
    },
    setQuantity: (productId, quantity) => {
      const line = cartLines.find((item) => item.productId === productId);
      if (!line) return;
      const next = Math.max(0, Math.floor(quantity));
      if (next === 0) cartLines = cartLines.filter((item) => item.productId !== productId);
      else line.quantity = Math.min(next, 99);
      if (cartLines.length === 0) cartBusiness = null;
    },
    removeProduct: (productId) => {
      cartLines = cartLines.filter((item) => item.productId !== productId);
      if (cartLines.length === 0) cartBusiness = null;
    },
    setTip: (amount) => { cartTip = Math.max(0, amount); },
    clear: () => { cartLines = []; cartBusiness = null; cartTip = 0; },
  };

  return {
    ...mock,
    profile,
    location,
    merchant,
    product,
    order,
    cart,
    marketplace: {
      search: (query) => {
        const q = query.trim().toLocaleLowerCase();
        if (!q) return [];
        return merchant.listNearby().filter((b) =>
          [b.name, b.type].some((value) => value.toLocaleLowerCase().includes(q)),
        );
      },
      listPromos: () => [],
      listPopular: (limit = 3) => merchant.listNearby(limit),
      listNew: () => merchant.listNearby().slice(0, 3),
      listPrevious: () => [],
      listRecommended: (limit = 3) => merchant.listNearby(limit),
    },
    initialize: async () => {
      await Promise.all([profile.initialize(), location.initialize(), merchant.initialize(), product.initialize(), order.initialize()]);
    },
  };
}

const demoMode = isDemoModeEnabled();

if (!isSupabaseConfigured() && !demoMode) {
  console.warn('[Pedejá] Supabase is not configured. Production data access is disabled. Set VITE_ENABLE_DEMO_MODE=true only for explicit local demo mode.');
}

export const repositories: Repositories = isSupabaseConfigured()
  ? createProductionRepositories()
  : createMockRepositories();

export type { Repositories } from './types';
