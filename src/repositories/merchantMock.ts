import type {
  MerchantRepository,
} from './merchantTypes';
import {
  mockMerchantProfile,
  mockMerchantSettings,
  mockMerchantProducts,
  mockMerchantCategories,
  mockMerchantReport,
} from '@/data/merchantMock';
import { orderDispatcher } from '@/services/backend/orderDispatcher';

let settings = { ...mockMerchantSettings };
let products = [...mockMerchantProducts];

export function createMockMerchantRepository(): MerchantRepository {
  return {
    getProfile: () => mockMerchantProfile,
    getSettings: () => settings,
    updateSettings: (partial) => { settings = { ...settings, ...partial }; },
    isOpen: () => settings.open,
    setOpen: (value) => { settings = { ...settings, open: value }; },
    listOrders: () => orderDispatcher.getMerchantOrders(),
    getOrder: (id) => orderDispatcher.getMerchantOrders().find((o) => o.id === id) ?? null,
    updateOrderStatus: (id, status) => {
      orderDispatcher.advanceMerchantOrderStatus(id, status);
    },
    listProducts: () => products,
    listCategories: () => mockMerchantCategories,
    addProduct: (input) => {
      const id = `mp-${Date.now()}`;
      const product = { ...input, id };
      products = [...products, product];
      return product;
    },
    updateProduct: (id, partial) => {
      products = products.map((p) => (p.id === id ? { ...p, ...partial } : p));
    },
    toggleProductAvailability: (id) => {
      products = products.map((p) => (p.id === id ? { ...p, available: !p.available } : p));
    },
    setProductAvailability: (id, available) => {
      products = products.map((p) => (p.id === id ? { ...p, available } : p));
    },
    getReport: () => mockMerchantReport,
    isOrdersPaused: () => settings.ordersPaused,
    setOrdersPaused: (value) => { settings = { ...settings, ordersPaused: value }; },
    pauseOrders: () => { settings = { ...settings, ordersPaused: true }; },
    resumeOrders: () => { settings = { ...settings, ordersPaused: false }; },
    signOut: () => { window.location.href = '/'; },
  };
}
