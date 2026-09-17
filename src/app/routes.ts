import type { AppScreen, CustomerSection, CustomerTab } from './app-types';

export const CUSTOMER_TABS: ReadonlyArray<{ id: CustomerTab; label: string }> = [
  { id: 'inicio', label: 'Início' },
  { id: 'descobrir', label: 'Descobrir' },
  { id: 'pedidos', label: 'Pedidos' },
  { id: 'perfil', label: 'Perfil' },
];

export const CUSTOMER_SECTIONS: ReadonlyArray<{ id: CustomerSection; label: string }> = [
  { id: 'comida', label: 'Comida' },
  { id: 'compras', label: 'Compras' },
  { id: 'lojas', label: 'Lojas' },
  { id: 'enviar', label: 'Enviar' },
];

export const ENTRY_SCREENS: ReadonlyArray<AppScreen> = [
  'splash',
  'welcome',
  'auth',
  'address',
];
