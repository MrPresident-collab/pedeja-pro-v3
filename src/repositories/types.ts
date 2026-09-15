import type {
  Address,
  Business,
  CartLine,
  Category,
  ID,
  Order,
  OrderEvent,
  PaymentMethod,
  Product,
  Profile,
} from '@/types';
import type {
  ParcelCancellationResult,
  ParcelOrder,
  ParcelStatus,
  ParcelVehicleClass,
  EstafetaVehicle,
} from '@/types';
import type {
  Delivery,
  DeliveryAssignment,
  Identity,
  Notification,
  Payment,
  PaymentState,
  Rating,
  SupportMessage,
  SupportTicket,
  SupportTicketState,
} from '@/types/domain';
import type {
  ExploreAboutItem,
  ExploreAccountSecurity,
  ExploreBusinessCategory,
  ExploreEstafetaFlow,
  ExploreFaqItem,
  ExploreLegalDoc,
  ExploreRegistrationFlow,
  ExploreSocialLink,
  ExploreVideoItem,
} from '@/data/explore';



export type PaymentMethodOption = {
  id: PaymentMethod;
  label: string;
  available: boolean;
};

export type AppearanceMode = 'auto' | 'light' | 'dark';

export type NotificationPreferences = {
  orders: boolean;
  security: boolean;
  promotions: boolean;
};

export type AccountDeletionRequest = {
  state: 'none' | 'pending';
  requestedAt?: string;
};

export type PhoneChangeOutcome = {
  success: boolean;
  error?: string;
};

export type PhoneVerifyOutcome = {
  success: boolean;
  error?: string;
};

export type SupportMessageAuthor = SupportMessage['author'];

export type CreateParcelOrderInput = {
  parcel: ParcelOrder;
};

export type CreateOrderInput = {
  merchant: string;
  merchantId?: ID;
  type: string;
  icon: Order['icon'];
  lines: CartLine[];
  subtotal?: number;
  discounts?: number;
  deliveryFee?: number;
  tip?: number;
  total?: number;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string;
  deliveryInstructions?: string;
  note?: string;
  deliveryTo?: string;
  deliveryAddressId?: ID;
};

export interface AuthRepository {
  getIdentity(): Identity | null;
  requestOtp(phone: string): Promise<boolean>;
  verifyOtp(phone: string, token: string): Promise<boolean>;
  signOut(): void;
}

export interface ProfileRepository {
  getProfile(): Profile;
  getIdentity(): Identity;
  updateName(name: string): Profile | Promise<Profile>;
  isPhoneVerified(): boolean;
  requestPhoneChange(phone: string): PhoneChangeOutcome | Promise<PhoneChangeOutcome>;
  verifyPhoneChange(phone: string, code: string): PhoneVerifyOutcome | Promise<PhoneVerifyOutcome>;
  setEmail(email: string): Profile | Promise<Profile>;
  getDeletionRequest(): AccountDeletionRequest;
  requestAccountDeletion(): PhoneChangeOutcome | Promise<PhoneChangeOutcome>;
}

export interface LocationRepository {
  listAddresses(): Address[];
  getDefaultAddress(): Address | null;
  addAddress(address: Address): Address | Promise<Address>;
  updateAddress(id: ID, changes: Partial<Omit<Address, 'id'>>): Address | null | Promise<Address | null>;
  removeAddress(id: ID): boolean | Promise<boolean>;
  setDefault(id: ID): boolean | Promise<boolean>;
}

export interface MerchantRepository {
  listNearby(limit?: number): Business[];
  listByCategory(category: Category): Business[];
  getById(id: string): Business | null;
}

export interface ProductRepository {
  listByBusiness(businessId: string): Product[];
  getById(id: string): Product | null;
}

export interface MarketplaceRepository {
  search(query: string): Business[];
  listPromos(): Business[];
  listPopular(limit?: number): Business[];
  listNew(): Business[];
  listPrevious(): Business[];
  listRecommended(limit?: number): Business[];
}

export interface OrderRepository {
  listActive(): Order[];
  listHistory(): Order[];
  getById(id: string): Order | null;
  create(input: CreateOrderInput): Order | Promise<Order>;
  repeat(orderId: string): Order | null | Promise<Order | null>;
  cancelOrder(orderId: string): Order | null | Promise<Order | null>;
  getOrderEvents(orderId: string): OrderEvent[] | Promise<OrderEvent[]>;
  subscribe?(listener: () => void): () => void;
}

export interface CartRepository {
  getBusiness(): Business | null;
  getLines(): CartLine[];
  getTip(): number;
  getDeliveryFee(): number;
  setBusiness(business: Business | null, deliveryFee: number): void;
  addProduct(product: Product): void;
  setQuantity(productId: string, quantity: number): void;
  removeProduct(productId: string): void;
  setTip(amount: number): void;
  clear(): void;
}

export interface RatingRepository {
  getForOrder(orderId: string): Rating | null;
  submitFor(orderId: string, score: number, comment?: string): void;
}

export interface DeliveryRepository {
  getForOrder(orderId: string): Delivery | null;
  listAssignments(deliveryId: string): DeliveryAssignment[];
  getActiveAssignment(deliveryId: string): DeliveryAssignment | null;
}

export interface PaymentRepository {
  listMethods(): PaymentMethodOption[];
  getDefaultMethod(): PaymentMethod;
  setDefaultMethod(method: PaymentMethod): void;
  getOrderPayment(orderId: string): Payment | null;
  updatePaymentStatus(orderId: string, state: PaymentState): void;
}

export interface ParcelRepository {
  getVehicleCatalog(): ParcelVehicleClass[];
  getEstafetaVehicles(): EstafetaVehicle[];
  estimateDistanceKm(pickup: Address, destination: Address): number;
  createParcelOrder(input: CreateParcelOrderInput): Order;
  getParcelOrder(orderId: string): Order | null;
  cancelParcelOrder(orderId: string, reason: string): ParcelCancellationResult;
  advanceParcelStatus(orderId: string, next: ParcelStatus): boolean;
}

export interface ExploreRepository {
  getAbout(): ExploreAboutItem[];
  getVideos(): ExploreVideoItem[];
  getBusinessCategories(): ExploreBusinessCategory[];
  getBusinessRegistration(): ExploreRegistrationFlow;
  getEstafetaRegistration(): ExploreEstafetaFlow;
  getFaq(): ExploreFaqItem[];
  getAccountSecurity(): ExploreAccountSecurity;
  getLegal(): ExploreLegalDoc[];
  getSocial(): ExploreSocialLink[];
}

export interface NotificationRepository {
  list(): Notification[];
  listUnread(): Notification[];
  markRead(id: string): void;
  markAllAsRead(): void;
  getPreferences(): NotificationPreferences;
  setPromotionsEnabled(enabled: boolean): void;
}

export interface SettingsRepository {
  getAppearance(): AppearanceMode;
  setAppearance(mode: AppearanceMode): void;
}

export interface SupportRepository {
  listTickets(): SupportTicket[];
  createTicket(ticket: SupportTicket): SupportTicket;
  getTicket(id: string): SupportTicket | null;
  addMessage(ticketId: string, author: SupportMessageAuthor, body: string): SupportTicket;
  updateStatus(ticketId: string, state: SupportTicketState): void;
}

export interface Repositories {
  initialize(): Promise<void>;
  auth: AuthRepository;
  profile: ProfileRepository;
  location: LocationRepository;
  merchant: MerchantRepository;
  product: ProductRepository;
  marketplace: MarketplaceRepository;
  cart: CartRepository;
  order: OrderRepository;
  delivery: DeliveryRepository;
  payment: PaymentRepository;
  parcel: ParcelRepository;
  explore: ExploreRepository;
  notification: NotificationRepository;
  support: SupportRepository;
  rating: RatingRepository;
  settings: SettingsRepository;
}