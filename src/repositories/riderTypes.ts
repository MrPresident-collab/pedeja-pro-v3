import type { Money } from '@/types/common';
import type { Category } from '@/types/common';
import type { Payout } from '@/types/domain';

// ── Status enums ──────────────────────────────────────────────
export type DriverApprovalStatus =
  | 'pending_documents'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'suspended';

export type DriverAvailabilityStatus =
  | 'offline'
  | 'online_searching'
  | 'offer_received'
  | 'on_delivery'
  | 'blocked';

export type CashSettlementStatus =
  | 'pending'
  | 'in_reconciliation'
  | 'settled'
  | 'under_review'
  | 'disputed';

// ── Vehicle (driver-specific; adapts existing VehicleType) ───
export type DriverVehicleType = 'mota' | 'triciclo' | 'carro' | 'carrinha';

export type DriverVehicleVerificationStatus = 'pending' | 'approved' | 'suspended';

export type DriverVehicle = {
  id: string;
  type: DriverVehicleType;
  label: string;
  licensePlate: string;
  color: string;
  isActive: boolean;
  verificationStatus: DriverVehicleVerificationStatus;
  addedAt: string;
};

// ── Delivery type (reuses Category) ──────────────────────────
export type DeliveryType = Category;

// ── Driver delivery stages ───────────────────────────────────
export type DriverDeliveryStage =
  | 'heading_to_pickup'
  | 'arrived_at_pickup'
  | 'waiting_for_preparation'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'heading_to_destination'
  | 'arrived_at_destination'
  | 'confirming_delivery'
  | 'completed';

export const FOOD_SHOPPING_STAGES: DriverDeliveryStage[] = [
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

// ── Documents ────────────────────────────────────────────────
export type DriverDocumentKind = 'bi' | 'carta_conducao' | 'registo_criminal';

export type DriverDocumentStatus =
  | 'not_sent'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'update_required';

export type DriverDocument = {
  kind: DriverDocumentKind;
  label: string;
  status: DriverDocumentStatus;
  submittedAt?: string;
  expiresAt?: string;
};

// ── Offer ────────────────────────────────────────────────────
export type DeliveryOffer = {
  id: string;
  orderId: string;
  deliveryType: DeliveryType;
  deliveryLabel: string;
  pickupLabel: string;
  pickupAddress: string;
  destinationArea: string;
  destinationAddress: string;
  distanceLabel: string;
  distanceMeters: number;
  durationLabel: string;
  durationMinutes: number;
  baseEarnings: number;
  bonus: number;
  tip: number;
  totalEarnings: number;
  vehicleRequired: DriverVehicleType;
  packageSize?: string;
  paymentMethod: 'cash' | 'multicaixa';
  cashToCollect?: number;
  instructions?: string;
  remainingSeconds: number;
};

// ── Active delivery ──────────────────────────────────────────
export type ActiveDeliveryState = {
  id: string;
  orderId: string;
  deliveryType: DeliveryType;
  stage: DriverDeliveryStage;
  pickupLabel: string;
  pickupAddress: string;
  destinationLabel: string;
  destinationAddress: string;
  distanceLabel: string;
  durationLabel: string;
  baseEarnings: number;
  bonus: number;
  tip: number;
  totalEarnings: number;
  paymentMethod: 'cash' | 'multicaixa';
  cashToCollect?: number;
  instructions?: string;
  specialInstructions?: string;
  vehicleType: DriverVehicleType;
  packageSize?: string;
  customerName: string;
  customerPhone: string;
  startedAt: string;
};

// ── Earnings / Wallet ────────────────────────────────────────
export type EarningLine = {
  label: string;
  amount: number;
  type:
    | 'base'
    | 'distance'
    | 'time'
    | 'bonus'
    | 'tip'
    | 'adjustment'
    | 'cancellation_compensation';
};

export type DriverWallet = {
  availableBalance: number;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  pendingAmount: number;
  paidAmount: number;
  cashSettlementStatus: CashSettlementStatus;
};

export type WalletMovementType =
  | 'earning'
  | 'adjustment'
  | 'cancellation_compensation'
  | 'withdrawal';

export type WalletMovement = {
  id: string;
  deliveryId?: string;
  reference: string;
  type: WalletMovementType;
  date: string;
  lines: EarningLine[];
  total: number;
  paymentMethod: 'cash' | 'multicaixa';
  cashSettlementStatus?: CashSettlementStatus;
};

// ── History ──────────────────────────────────────────────────
export type DriverHistoryStatus =
  | 'completed'
  | 'cancelled'
  | 'failed'
  | 'returned';

export type DriverHistoryItem = {
  id: string;
  orderId: string;
  reference: string;
  deliveryType: DeliveryType;
  deliveryLabel: string;
  pickupLabel: string;
  destinationLabel: string;
  date: string;
  status: DriverHistoryStatus;
  totalEarnings: number;
  paymentMethod: 'cash' | 'multicaixa';
  vehicleType: DriverVehicleType;
  cashSettlementStatus?: CashSettlementStatus;
};

// ── Profile ──────────────────────────────────────────────────
export type DriverPreferences = {
  acceptCash: boolean;
  acceptFood: boolean;
  acceptShopping: boolean;
  acceptParcel: boolean;
  notificationsEnabled: boolean;
};

export type DriverProfile = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  email: string;
  memberSince: string;
  approvalStatus: DriverApprovalStatus;
  vehicles: DriverVehicle[];
  activeVehicleId: string;
  documents: DriverDocument[];
  preferences: DriverPreferences;
  rating: number;
  onlineHours: number;
  vehicleLabel: string;
  joinedDate: string;
  documentsState: Record<string, 'verified' | 'pending' | 'rejected'>;
};

export type DriverStats = {
  todayEarnings: number;
  deliveriesCompleted: number;
  totalDeliveries: number;
  avgPerDelivery: number;
  onTimePct: number;
  rating: number;
  onlineHours: number;
  monthDeliveries: number;
  todayEarningsMoney: Money;
  avgPerDeliveryMoney: Money;
};

// ── Legacy types (backward compat for existing views) ────────
export type RiderStep = 'pickup' | 'picked_up' | 'delivered';

export type RiderDeliveryRequest = {
  id: string;
  orderId: string;
  business: string;
  businessType: string;
  customer: string;
  customerAddress: string;
  pickupAddress: string;
  distanceLabel: string;
  distanceMeters: number;
  etaLabel: string;
  etaMinutes: number;
  earnings: Money;
  instructions?: string;
};

export type ActiveDelivery = {
  id: string;
  orderId: string;
  business: string;
  businessType: string;
  customer: string;
  customerPhone: string;
  customerAddress: string;
  pickupAddress: string;
  dropoffAddress: string;
  distanceLabel: string;
  etaLabel: string;
  step: RiderStep;
  paymentMethod: 'cash' | 'multicaixa';
  earnings: Money;
  tip?: Money;
  instructions?: string;
};

export type DeliveryHistoryItem = {
  id: string;
  orderId: string;
  date: string;
  business: string;
  businessType: string;
  destination: string;
  distanceLabel: string;
  status: 'completed' | 'cancelled';
  payout: Money;
  rating?: number;
};

export type EarningsBreakdown = {
  basePay: Money;
  distancePay: Money;
  waitingPay: Money;
  peakBonus: Money;
  customerTip: Money;
  platformFee: Money;
  total: Money;
};

// ── Repository interface ─────────────────────────────────────
export interface RiderRepository {
  // Legacy (removed once all views use spec methods)
  getProfile(): DriverProfile;
  getStats(): DriverStats;
  isOnline(): boolean;
  setOnline(value: boolean): void;
  isDarkTheme(): boolean;
  setDarkTheme(value: boolean): void;
  isCashOrders(): boolean;
  setCashOrders(value: boolean): void;
  getActiveDelivery(): ActiveDelivery | null;
  getDeliveryRequest(): RiderDeliveryRequest | null;
  acceptDelivery(requestId: string): void;
  expireDelivery(requestId: string): void;
  advanceStep(): void;
  getEarningsBreakdown(): EarningsBreakdown;
  getPayouts(): Payout[];
  getHistory(): DeliveryHistoryItem[];

  // Approval + eligibility
  getApprovalStatus(): DriverApprovalStatus;
  isProfileComplete(): boolean;

  // Availability
  getAvailabilityStatus(): DriverAvailabilityStatus;

  // Offer
  getCurrentOffer(): DeliveryOffer | null;
  acceptOffer(offerId: string): void;
  declineOffer(offerId: string): void;
  expireOffer(offerId: string): void;

  // Active delivery (spec)
  getActiveDeliveryState(): ActiveDeliveryState | null;
  advanceStage(): void;

  // Wallet
  getWallet(): DriverWallet;
  getMovements(): WalletMovement[];
  getMovementDetail(movementId: string): WalletMovement | null;

  // History (spec)
  getDriverHistory(): DriverHistoryItem[];

  // Profile / preferences
  updatePreferences(prefs: Partial<DriverPreferences>): void;
}
