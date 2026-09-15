import type {
  RiderRepository,
  RiderStep,
  DriverApprovalStatus,
  DriverAvailabilityStatus,
  DriverDeliveryStage,
  DriverPreferences,
  DriverHistoryItem,
} from './riderTypes';
import type { Payout, PayoutLine } from '@/types/domain';
import {
  mockDriverProfile,
  mockDriverStats,
  mockTodayEarningLines,
  mockDriverHistory,
} from '@/data/riderMock';
import { orderDispatcher } from '@/services/backend/orderDispatcher';

// ── Module-level state ───────────────────────────────────────
let approvalStatus: DriverApprovalStatus = 'approved';
let darkTheme = false;
let cashOrders = true;
let preferences: DriverPreferences = { ...mockDriverProfile.preferences };

// ── Subscription via Unified Dispatcher ─────────────────────
export function subscribeRider(listener: () => void): () => void {
  return orderDispatcher.subscribe(listener);
}

function mapToLegacyStep(stage: DriverDeliveryStage): RiderStep {
  if (stage === 'completed') return 'delivered';
  if (
    stage === 'picked_up' ||
    stage === 'heading_to_destination' ||
    stage === 'arrived_at_destination' ||
    stage === 'confirming_delivery'
  ) {
    return 'picked_up';
  }
  return 'pickup';
}

function buildTodayPayout(): Payout {
  const lines: PayoutLine[] = mockTodayEarningLines.map((l) => ({
    component: 'base_pay' as const,
    amount: { amount: l.amount, currency: 'AOA' as const },
  }));
  const wallet = orderDispatcher.getRiderWallet();
  return {
    id: 'payout-today',
    identityId: 'drv-001',
    periodFrom: new Date(Date.now() - 1000 * 60 * 60 * 6.5).toISOString(),
    periodTo: new Date().toISOString(),
    lines,
    gross: { amount: wallet.todayEarnings, currency: 'AOA' },
    state: 'scheduled',
  };
}

export function createMockRiderRepository(): RiderRepository {
  return {
    // ── Legacy methods ────────────────────────────────────────
    getProfile: () => ({ ...mockDriverProfile, preferences }),
    getStats: () => {
      const wallet = orderDispatcher.getRiderWallet();
      return {
        ...mockDriverStats,
        todayEarnings: wallet.todayEarnings,
        todayEarningsMoney: { amount: wallet.todayEarnings, currency: 'AOA' },
      };
    },
    isOnline: () => orderDispatcher.isRiderOnline(),
    setOnline: (value) => {
      orderDispatcher.setRiderOnline(value);
    },
    isDarkTheme: () => darkTheme,
    setDarkTheme: (value) => { darkTheme = value; },
    isCashOrders: () => cashOrders,
    setCashOrders: (value) => { cashOrders = value; },

    getActiveDelivery: () => {
      const active = orderDispatcher.getActiveDelivery();
      if (!active) return null;
      return {
        id: active.id,
        orderId: active.orderId,
        business: active.pickupLabel,
        businessType: active.deliveryType === 'comida' ? 'Comida angolana' : 'Entrega',
        customer: active.customerName,
        customerPhone: active.customerPhone,
        customerAddress: active.destinationAddress,
        pickupAddress: active.pickupAddress,
        dropoffAddress: active.destinationAddress,
        distanceLabel: active.distanceLabel,
        etaLabel: active.durationLabel,
        step: mapToLegacyStep(active.stage),
        paymentMethod: active.paymentMethod,
        earnings: { amount: active.totalEarnings, currency: 'AOA' },
        tip: active.tip ? { amount: active.tip, currency: 'AOA' } : undefined,
        instructions: active.instructions,
      };
    },

    getDeliveryRequest: () => {
      const offer = orderDispatcher.getRiderOffer();
      if (!offer) return null;
      return {
        id: offer.id,
        orderId: offer.orderId,
        business: offer.pickupLabel,
        businessType: offer.deliveryLabel,
        customer: 'Cliente Pedejá',
        customerAddress: offer.destinationAddress,
        pickupAddress: offer.pickupAddress,
        distanceLabel: offer.distanceLabel,
        distanceMeters: offer.distanceMeters,
        etaLabel: offer.durationLabel,
        etaMinutes: offer.durationMinutes,
        earnings: { amount: offer.totalEarnings, currency: 'AOA' },
        instructions: offer.instructions,
      };
    },

    acceptDelivery: (requestId) => {
      orderDispatcher.acceptDeliveryOffer(requestId);
    },

    expireDelivery: () => {
      orderDispatcher.declineDeliveryOffer();
    },

    advanceStep: () => {
      orderDispatcher.advanceRiderStage();
    },

    getEarningsBreakdown: () => {
      const active = orderDispatcher.getActiveDelivery();
      const base = active ? active.baseEarnings : 600;
      const bonus = active ? active.bonus : 200;
      const tip = active?.tip || 0;
      return {
        basePay: { amount: base, currency: 'AOA' },
        distancePay: { amount: 150, currency: 'AOA' },
        waitingPay: { amount: 50, currency: 'AOA' },
        peakBonus: { amount: bonus, currency: 'AOA' },
        customerTip: { amount: tip, currency: 'AOA' },
        platformFee: { amount: 0, currency: 'AOA' },
        total: { amount: base + 200 + tip, currency: 'AOA' },
      };
    },

    getPayouts: () => [buildTodayPayout()],

    getHistory: () =>
      orderDispatcher.getRiderMovements().map((m) => ({
        id: m.id,
        orderId: m.deliveryId || 'PJD-000',
        date: m.date,
        business: m.reference,
        businessType: 'Entrega Pedejá',
        destination: 'Luanda',
        distanceLabel: '2.5 km',
        status: 'completed' as const,
        payout: { amount: m.total, currency: 'AOA' as const },
        rating: 5,
      })),

    // ── Spec methods ──────────────────────────────────────────
    getApprovalStatus: () => approvalStatus,
    isProfileComplete: () => {
      const p = mockDriverProfile;
      return p.documents.every((d) => d.status === 'approved');
    },

    getAvailabilityStatus: () => {
      if (!orderDispatcher.isRiderOnline()) return 'offline';
      if (orderDispatcher.getActiveDelivery()) return 'on_delivery';
      if (orderDispatcher.getRiderOffer()) return 'offer_received';
      return 'online_searching';
    },

    getCurrentOffer: () => orderDispatcher.getRiderOffer(),

    acceptOffer: (offerId) => {
      orderDispatcher.acceptDeliveryOffer(offerId);
    },

    declineOffer: () => {
      orderDispatcher.declineDeliveryOffer();
    },

    expireOffer: () => {
      orderDispatcher.declineDeliveryOffer();
    },

    getActiveDeliveryState: () => orderDispatcher.getActiveDelivery(),

    advanceStage: () => {
      orderDispatcher.advanceRiderStage();
    },

    getWallet: () => orderDispatcher.getRiderWallet(),
    getMovements: () => orderDispatcher.getRiderMovements(),
    getMovementDetail: (movementId) =>
      orderDispatcher.getRiderMovements().find((m) => m.id === movementId) ?? null,
    getDriverHistory: (): DriverHistoryItem[] => {
      const movements = orderDispatcher.getRiderMovements();
      if (movements.length > 0) {
        return movements.map((m) => ({
          id: m.id,
          orderId: m.deliveryId || 'PJD-000',
          reference: m.reference,
          deliveryType: 'comida',
          deliveryLabel: 'Refeição Pronta',
          pickupLabel: 'Restaurante',
          destinationLabel: 'Cliente',
          date: m.date,
          status: 'completed',
          totalEarnings: m.total,
          paymentMethod: m.paymentMethod,
          vehicleType: 'mota',
          cashSettlementStatus: m.cashSettlementStatus,
        }));
      }
      return mockDriverHistory;
    },
    updatePreferences: (prefs) => {
      preferences = { ...preferences, ...prefs };
    },
  };
}

// DEV-only
export function __devSetRiderState(patch: {
  approval?: DriverApprovalStatus;
  availability?: DriverAvailabilityStatus;
}) {
  if (patch.approval !== undefined) {
    (approvalStatus as DriverApprovalStatus) = patch.approval;
  }
  if (patch.availability !== undefined) {
    if (patch.availability === 'online_searching') {
      orderDispatcher.setRiderOnline(true);
    } else if (patch.availability === 'offline') {
      orderDispatcher.setRiderOnline(false);
    }
  }
}
