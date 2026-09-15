import type { Category } from '@/types';

export type MarketplaceNeed = {
  key: string;
  label: string;
  icon: 'utensils' | 'pill' | 'basket' | 'house' | 'quick' | 'send' | 'office' | 'today';
  category?: Exclude<Category, 'enviar'>;
  keyword?: string;
};

export const marketplaceNeeds: MarketplaceNeed[] = [
  { key: 'fome', label: 'Tenho fome', icon: 'utensils', category: 'comida' },
  { key: 'medicamentos', label: 'Preciso de medicamentos', icon: 'pill', category: 'compras', keyword: 'farmácia' },
  { key: 'compras-dia', label: 'Quero fazer compras', icon: 'basket', category: 'compras' },
  { key: 'casa', label: 'Produtos para casa', icon: 'house', category: 'lojas' },
  { key: 'compra-rapida', label: 'Compra rápida', icon: 'quick', category: 'compras' },
  { key: 'enviar', label: 'Quero enviar algo', icon: 'send' },
  { key: 'escritorio', label: 'Para o escritório', icon: 'office', category: 'compras' },
  { key: 'hoje', label: 'Para hoje', icon: 'today', category: 'comida' },
];

export const marketplaceFilters: readonly string[] = [
  'Perto de ti',
  'Promoções',
  'Aberto agora',
  'Melhor avaliados',
];