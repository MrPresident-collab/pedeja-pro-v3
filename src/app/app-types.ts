export type AppScreen = 'splash' | 'welcome' | 'auth' | 'address' | 'customer';

export type CustomerTab = 'inicio' | 'descobrir' | 'pedidos' | 'perfil';

export type CustomerSection = 'home' | 'comida' | 'compras' | 'lojas' | 'enviar';

export type AuthStep = 'phone' | 'otp';

export type Business = {
  id: string;
  name: string;
  description: string | null;
  marketplace_category: string | null;
};

export type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  currency_code: string | null;
};

export type Cart = Record<string, number>;

export const formatKz = (value: number) =>
  `${new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value)} Kz`;
