import { getSupabase } from '@/services/supabase';
import type { Order, CartLine } from '@/types';
import type { MerchantOrder, MerchantOrderStatus } from '@/repositories/merchantTypes';
import type {
  DeliveryOffer,
  ActiveDeliveryState,
  DriverDeliveryStage,
  WalletMovement,
  DriverWallet,
} from '@/repositories/riderTypes';
import { mockOrders, mockBusinesses } from '@/data/mock';
import { mockMerchantOrders } from '@/data/merchantMock';
import {
  mockDriverWallet,
  mockDriverMovements,
  mockDriverProfile,
} from '@/data/riderMock';

// ── Storage Keys ──────────────────────────────────────────────
const STORAGE_ORDERS_KEY = 'pedeja:orders:store:v2';
const STORAGE_WALLET_KEY = 'pedeja:rider:wallet:v2';
const STORAGE_MOVEMENTS_KEY = 'pedeja:rider:movements:v2';
const STORAGE_OFFER_KEY = 'pedeja:rider:offer:v2';
const STORAGE_ACTIVE_DELIVERY_KEY = 'pedeja:rider:active_delivery:v2';
const STORAGE_ONLINE_KEY = 'pedeja:rider:online:v2';

function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function save<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or SSR
  }
}

// ── In-Memory Reactive State ──────────────────────────────────
type StateListener = () => void;
const listeners = new Set<StateListener>();

function notify(): void {
  listeners.forEach((l) => {
    try {
      l();
    } catch {
      // safe listener execution
    }
  });
}

// Initialize persistent orders
let orders: Order[] = load<Order[]>(STORAGE_ORDERS_KEY, [...mockOrders]);
let wallet: DriverWallet = load<DriverWallet>(STORAGE_WALLET_KEY, { ...mockDriverWallet });
let movements: WalletMovement[] = load<WalletMovement[]>(STORAGE_MOVEMENTS_KEY, [...mockDriverMovements]);
let currentOffer: DeliveryOffer | null = load<DeliveryOffer | null>(STORAGE_OFFER_KEY, null);
let activeDelivery: ActiveDeliveryState | null = load<ActiveDeliveryState | null>(STORAGE_ACTIVE_DELIVERY_KEY, null);
let isRiderOnline: boolean = load<boolean>(STORAGE_ONLINE_KEY, false);

// ── Supabase Realtime Channel Setup ────────────────────────────
let realtimeSetupDone = false;

function initRealtimeSync(): void {
  if (realtimeSetupDone) return;
  const sb = getSupabase();
  if (!sb) return;
  realtimeSetupDone = true;

  try {
    const channel = sb.channel('pedeja-live-orders');
    channel
      .on('broadcast', { event: 'order_update' }, ({ payload }) => {
        if (payload && typeof payload === 'object' && 'id' in payload) {
          syncOrderFromRemote(payload as Order);
        }
      })
      .on('broadcast', { event: 'delivery_offer' }, ({ payload }) => {
        if (payload) {
          currentOffer = payload as DeliveryOffer;
          save(STORAGE_OFFER_KEY, currentOffer);
          notify();
        }
      })
      .subscribe();
  } catch {
    // Best-effort realtime
  }
}

function broadcastRemote(event: string, payload: unknown): void {
  const sb = getSupabase();
  if (!sb) return;
  try {
    const channel = sb.channel('pedeja-live-orders');
    channel.send({
      type: 'broadcast',
      event,
      payload,
    }).then(() => {}, () => {});
  } catch {
    // Best-effort broadcast
  }
}

function syncOrderFromRemote(incoming: Order): void {
  const idx = orders.findIndex((o) => o.id === incoming.id);
  if (idx >= 0) {
    orders[idx] = incoming;
  } else {
    orders.unshift(incoming);
  }
  save(STORAGE_ORDERS_KEY, orders);
  notify();
}

// ── Helpers ───────────────────────────────────────────────────
function nowClock(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function toMerchantOrder(order: Order): MerchantOrder {
  const merchantStatusMap: Record<string, MerchantOrderStatus> = {
    novo: 'novo',
    aceite: 'em_preparacao',
    preparando: 'em_preparacao',
    pronto: 'pronto',
    recolhido: 'em_entrega',
    entregue: 'concluido',
    cancelado: 'cancelado',
  };

  const status: MerchantOrderStatus = merchantStatusMap[order.status] ?? 'novo';

  const items = (order.lines || []).map((l: CartLine) => ({
    name: l.name,
    quantity: l.quantity,
    unitPrice: l.unitPrice,
  }));

  const customerName = 'Cliente Pedejá';
  const customerPhone = '+244 923 000 000';
  const paymentMethod: 'cash' | 'multicaixa' = order.paymentMethod === 'multicaixa' ? 'multicaixa' : 'cash';

  return {
    id: order.id,
    customer: customerName,
    customerPhone,
    items,
    subtotal: order.subtotal ?? order.total,
    discount: order.discount ?? 0,
    deliveryFee: order.deliveryFee ?? 0,
    tip: order.tip ?? 0,
    total: order.total,
    status,
    paymentMethod,
    createdAt: order.createdAt || new Date().toISOString(),
    preparationTime: 25,
    assignedRider: order.status === 'recolhido' || order.status === 'entregue' ? mockDriverProfile.name : undefined,
    instructions: order.deliveryTo ? `Entregar em: ${order.deliveryTo}` : undefined,
    timeline: (order.timeline || []).map((t) => ({
      status: t.status,
      label: t.label,
      time: t.timestamp || nowClock(),
      done: Boolean(t.done),
    })),
  };
}

// ── Public Dispatcher API ─────────────────────────────────────
export const orderDispatcher = {
  subscribe(listener: StateListener): () => void {
    listeners.add(listener);
    initRealtimeSync();
    return () => {
      listeners.delete(listener);
    };
  },

  // ── Customer Order Operations ─────────────────────────────
  getOrders(): Order[] {
    return orders;
  },

  getOrderById(id: string): Order | null {
    return orders.find((o) => o.id === id) ?? null;
  },

  createOrder(order: Order): Order {
    orders = [order, ...orders.filter((o) => o.id !== order.id)];
    save(STORAGE_ORDERS_KEY, orders);
    notify();
    broadcastRemote('order_update', order);

    // Background push to Supabase if connected
    const sb = getSupabase();
    if (sb) {
      void Promise.resolve().then(async () => {
        try {
          await sb.from('orders').insert({
            id: order.id,
            merchant_id: order.merchant,
            kind: order.kind || 'marketplace',
            payment_method: order.paymentMethod === 'multicaixa' ? 'multicaixa' : 'cash',
            payment_status: 'pending',
            fulfillment_status: 'created',
            delivery_status: 'none',
            subtotal_kz: order.subtotal || order.total,
            delivery_fee_kz: order.deliveryFee || 0,
            discount_kz: order.discount || 0,
            tip_kz: order.tip || 0,
            total_kz: order.total,
            delivery_to: order.deliveryTo || '',
          });
        } catch {
          // resilient ignore
        }
      });
    }

    return order;
  },

  cancelOrder(id: string): Order | null {
    const order = orders.find((o) => o.id === id);
    if (!order) return null;
    order.status = 'cancelado';
    order.active = false;
    save(STORAGE_ORDERS_KEY, orders);
    notify();
    broadcastRemote('order_update', order);
    return order;
  },

  // ── Merchant Order Operations ─────────────────────────────
  getMerchantOrders(): MerchantOrder[] {
    const realMerchantOrders = orders
      .filter((o) => o.kind !== 'parcel')
      .map(toMerchantOrder);

    const existingIds = new Set(realMerchantOrders.map((o) => o.id));
    const fallbackOrders = mockMerchantOrders.filter((o) => !existingIds.has(o.id));
    return [...realMerchantOrders, ...fallbackOrders];
  },

  advanceMerchantOrderStatus(orderId: string, nextStatus: MerchantOrderStatus): void {
    const order = orders.find((o) => o.id === orderId);
    const time = nowClock();

    if (order) {
      if (nextStatus === 'em_preparacao') {
        order.status = 'preparando';
      } else if (nextStatus === 'pronto') {
        order.status = 'pronto';
        orderDispatcher.createDeliveryOfferForOrder(order);
      } else if (nextStatus === 'em_entrega') {
        order.status = 'recolhido';
      } else if (nextStatus === 'concluido') {
        order.status = 'entregue';
        order.active = false;
      } else if (nextStatus === 'cancelado') {
        order.status = 'cancelado';
        order.active = false;
      }

      if (order.timeline) {
        order.timeline = order.timeline.map((step) => {
          if (step.status === order.status) {
            return { ...step, done: true, timestamp: time };
          }
          return step;
        });
      }

      save(STORAGE_ORDERS_KEY, orders);
      notify();
      broadcastRemote('order_update', order);
    }
  },

  // ── Estafeta & Delivery Lifecycle ─────────────────────────
  isRiderOnline(): boolean {
    return isRiderOnline;
  },

  setRiderOnline(online: boolean): void {
    isRiderOnline = online;
    save(STORAGE_ONLINE_KEY, isRiderOnline);
    if (!online && currentOffer) {
      currentOffer = null;
      save(STORAGE_OFFER_KEY, null);
    }
    notify();
  },

  getRiderOffer(): DeliveryOffer | null {
    if (!isRiderOnline) return null;
    return currentOffer;
  },

  createDeliveryOfferForOrder(order: Order): void {
    const business = mockBusinesses.find((b) => b.name === order.merchant) || mockBusinesses[0];
    const baseEarnings = 750;
    const bonus = 250;
    const tip = order.tip || 0;
    const totalEarnings = baseEarnings + bonus + tip;
    const paymentMethod: 'cash' | 'multicaixa' = order.paymentMethod === 'multicaixa' ? 'multicaixa' : 'cash';

    const offer: DeliveryOffer = {
      id: `off-${Date.now()}`,
      orderId: order.id,
      deliveryType: 'comida',
      deliveryLabel: 'Refeição Pronta',
      pickupLabel: business.name,
      pickupAddress: 'Rua das Flores, Alvalade, Luanda',
      destinationArea: order.deliveryTo ? order.deliveryTo.split(',')[0] : 'Maianga',
      destinationAddress: order.deliveryTo || 'Rua Rainha Ginga, Luanda',
      distanceLabel: order.distance || '2.4 km',
      distanceMeters: 2400,
      durationLabel: '18 min',
      durationMinutes: 18,
      baseEarnings,
      bonus,
      tip,
      totalEarnings,
      vehicleRequired: 'mota',
      paymentMethod,
      cashToCollect: paymentMethod === 'cash' ? order.total : undefined,
      instructions: order.deliveryTo ? `Entregar em: ${order.deliveryTo}` : undefined,
      remainingSeconds: 25,
    };

    currentOffer = offer;
    save(STORAGE_OFFER_KEY, currentOffer);
    notify();
    broadcastRemote('delivery_offer', offer);
  },

  acceptDeliveryOffer(offerId: string): void {
    if (!currentOffer || currentOffer.id !== offerId) return;

    const offer = currentOffer;
    const active: ActiveDeliveryState = {
      id: `del-${Date.now()}`,
      orderId: offer.orderId,
      deliveryType: offer.deliveryType,
      stage: 'heading_to_pickup',
      pickupLabel: offer.pickupLabel,
      pickupAddress: offer.pickupAddress,
      destinationLabel: offer.destinationArea,
      destinationAddress: offer.destinationAddress,
      distanceLabel: offer.distanceLabel,
      durationLabel: offer.durationLabel,
      baseEarnings: offer.baseEarnings,
      bonus: offer.bonus,
      tip: offer.tip,
      totalEarnings: offer.totalEarnings,
      paymentMethod: offer.paymentMethod,
      cashToCollect: offer.cashToCollect,
      instructions: offer.instructions,
      vehicleType: 'mota',
      customerName: 'Cliente Pedejá',
      customerPhone: '+244 923 000 000',
      startedAt: new Date().toISOString(),
    };

    activeDelivery = active;
    currentOffer = null;
    save(STORAGE_ACTIVE_DELIVERY_KEY, activeDelivery);
    save(STORAGE_OFFER_KEY, null);

    const order = orders.find((o) => o.id === active.orderId);
    if (order) {
      order.status = 'pronto';
      save(STORAGE_ORDERS_KEY, orders);
    }

    notify();
  },

  declineDeliveryOffer(): void {
    currentOffer = null;
    save(STORAGE_OFFER_KEY, null);
    notify();
  },

  getActiveDelivery(): ActiveDeliveryState | null {
    return activeDelivery;
  },

  advanceRiderStage(): void {
    if (!activeDelivery) return;

    const stages: DriverDeliveryStage[] = [
      'heading_to_pickup',
      'arrived_at_pickup',
      'waiting_for_preparation',
      'ready_for_pickup',
      'picked_up',
      'heading_to_destination',
      'arrived_at_destination',
      'confirming_delivery',
      'completed',
    ];

    const currentIdx = stages.indexOf(activeDelivery.stage);
    if (currentIdx === -1 || currentIdx >= stages.length - 1) return;

    const nextStage = stages[currentIdx + 1];
    activeDelivery.stage = nextStage;

    const order = orders.find((o) => o.id === activeDelivery!.orderId);
    const time = nowClock();

    if (nextStage === 'picked_up' && order) {
      order.status = 'recolhido';
      if (order.timeline) {
        order.timeline = order.timeline.map((s) =>
          s.status === 'recolhido' || s.status === 'pronto'
            ? { ...s, done: true, timestamp: time }
            : s,
        );
      }
      save(STORAGE_ORDERS_KEY, orders);
    } else if (nextStage === 'completed') {
      if (order) {
        order.status = 'entregue';
        order.active = false;
        if (order.timeline) {
          order.timeline = order.timeline.map((s) => ({ ...s, done: true, timestamp: time }));
        }
        save(STORAGE_ORDERS_KEY, orders);
      }

      const earnings = activeDelivery.totalEarnings;
      wallet = {
        ...wallet,
        availableBalance: wallet.availableBalance + earnings,
        todayEarnings: wallet.todayEarnings + earnings,
        weekEarnings: wallet.weekEarnings + earnings,
        monthEarnings: wallet.monthEarnings + earnings,
      };
      save(STORAGE_WALLET_KEY, wallet);

      const movement: WalletMovement = {
        id: `mov-${Date.now()}`,
        deliveryId: activeDelivery.id,
        reference: `Corrida ${activeDelivery.orderId}`,
        type: 'earning',
        date: 'Hoje, ' + time,
        total: earnings,
        paymentMethod: activeDelivery.paymentMethod,
        cashSettlementStatus: 'settled',
        lines: [
          { label: 'Tarifa Base', amount: activeDelivery.baseEarnings, type: 'base' },
          { label: 'Bónus de Turno', amount: activeDelivery.bonus, type: 'bonus' },
          ...(activeDelivery.tip ? [{ label: 'Gorjeta do Cliente', amount: activeDelivery.tip, type: 'tip' as const }] : []),
        ],
      };
      movements = [movement, ...movements];
      save(STORAGE_MOVEMENTS_KEY, movements);

      activeDelivery = null;
      save(STORAGE_ACTIVE_DELIVERY_KEY, null);
    }

    save(STORAGE_ACTIVE_DELIVERY_KEY, activeDelivery);
    notify();
  },

  getRiderWallet(): DriverWallet {
    return wallet;
  },

  getRiderMovements(): WalletMovement[] {
    return movements;
  },
};
