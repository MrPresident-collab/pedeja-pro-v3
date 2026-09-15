import type {
  DriverProfile,
  DriverStats,
  DriverWallet,
  DriverHistoryItem,
  DeliveryOffer,
  ActiveDeliveryState,
  WalletMovement,
  EarningLine,
  DriverVehicle,
  DriverDocument,
} from '@/repositories/riderTypes';

// ── Vehicles ─────────────────────────────────────────────────
export const mockDriverVehicles: DriverVehicle[] = [
  {
    id: 'v-001',
    type: 'mota',
    label: 'Mota Honda CB 150',
    licensePlate: 'LD-3421-AO',
    color: 'Preta',
    isActive: true,
    verificationStatus: 'approved',
    addedAt: 'Jun 2026',
  },
  {
    id: 'v-002',
    type: 'triciclo',
    label: 'Triciclo Yamaha Neol',
    licensePlate: 'LD-7782-BB',
    color: 'Azul',
    isActive: false,
    verificationStatus: 'pending',
    addedAt: 'Ago 2026',
  },
];

// ── Documents ────────────────────────────────────────────────
export const mockDriverDocuments: DriverDocument[] = [
  { kind: 'bi', label: 'Bilhete de Identidade', status: 'approved', submittedAt: 'Jun 2026' },
  { kind: 'carta_conducao', label: 'Carta de Condução', status: 'approved', submittedAt: 'Jun 2026' },
  { kind: 'registo_criminal', label: 'Registo Criminal', status: 'under_review', submittedAt: 'Ago 2026' },
];

// ── Profile ──────────────────────────────────────────────────
export const mockDriverProfile: DriverProfile = {
  id: 'drv-001',
  name: 'Nelson Kiala',
  phone: '+244 933 000 402',
  initials: 'NK',
  email: 'nelson.kiala@email.ao',
  memberSince: 'Jun 2026',
  approvalStatus: 'approved',
  vehicles: mockDriverVehicles,
  activeVehicleId: 'v-001',
  documents: mockDriverDocuments,
  preferences: {
    acceptCash: true,
    acceptFood: true,
    acceptShopping: true,
    acceptParcel: false,
    notificationsEnabled: true,
  },
  rating: 4.9,
  onlineHours: 6.5,
  vehicleLabel: 'Mota Honda CB 150',
  joinedDate: 'Jun 2026',
  documentsState: {
    'Bilhete de Identidade': 'verified',
    'Carta de Condução': 'verified',
    'Registo Criminal': 'pending',
  },
};

// ── Stats ────────────────────────────────────────────────────
export const mockDriverStats: DriverStats = {
  todayEarnings: 1850,
  deliveriesCompleted: 4,
  totalDeliveries: 287,
  avgPerDelivery: 463,
  onTimePct: 96,
  rating: 4.9,
  onlineHours: 6.5,
  monthDeliveries: 42,
  todayEarningsMoney: { amount: 1850, currency: 'AOA' },
  avgPerDeliveryMoney: { amount: 463, currency: 'AOA' },
};

// ── Wallet ───────────────────────────────────────────────────
export const mockDriverWallet: DriverWallet = {
  availableBalance: 8200,
  todayEarnings: 1850,
  weekEarnings: 8200,
  monthEarnings: 32500,
  pendingAmount: 1500,
  paidAmount: 28000,
  cashSettlementStatus: 'in_reconciliation',
};

// ── Earning lines (today) ────────────────────────────────────
export const mockTodayEarningLines: EarningLine[] = [
  { label: 'Base', amount: 350, type: 'base' },
  { label: 'Distância', amount: 120, type: 'distance' },
  { label: 'Tempo de espera', amount: 80, type: 'time' },
  { label: 'Bónus de pico', amount: 200, type: 'bonus' },
  { label: 'Gorjeta', amount: 100, type: 'tip' },
  { label: 'Taxas/descontos da plataforma', amount: -100, type: 'adjustment' },
];

// ── Movements ────────────────────────────────────────────────
export const mockDriverMovements: WalletMovement[] = [
  {
    id: 'mov-001',
    deliveryId: 'del-h1',
    reference: 'PJD-2051',
    type: 'earning',
    date: 'Hoje, 11:45',
    lines: [
      { label: 'Base', amount: 250, type: 'base' },
      { label: 'Distância', amount: 100, type: 'distance' },
      { label: 'Tempo', amount: 50, type: 'time' },
      { label: 'Gorjeta', amount: 20, type: 'tip' },
    ],
    total: 420,
    paymentMethod: 'multicaixa',
  },
  {
    id: 'mov-002',
    deliveryId: 'del-h2',
    reference: 'PJD-2049',
    type: 'earning',
    date: 'Hoje, 10:20',
    lines: [
      { label: 'Base', amount: 300, type: 'base' },
      { label: 'Distância', amount: 150, type: 'distance' },
      { label: 'Bónus', amount: 80, type: 'bonus' },
    ],
    total: 580,
    paymentMethod: 'cash',
    cashSettlementStatus: 'pending',
  },
  {
    id: 'mov-003',
    deliveryId: 'del-h4',
    reference: 'PJD-2045',
    type: 'earning',
    date: 'Hoje, 08:12',
    lines: [
      { label: 'Base', amount: 250, type: 'base' },
      { label: 'Distância', amount: 100, type: 'distance' },
      { label: 'Tempo', amount: 50, type: 'time' },
    ],
    total: 400,
    paymentMethod: 'cash',
    cashSettlementStatus: 'in_reconciliation',
  },
  {
    id: 'mov-004',
    deliveryId: 'del-h6',
    reference: 'PJD-2038',
    type: 'cancellation_compensation',
    date: 'Ontem, 17:15',
    lines: [
      { label: 'Compensação por cancelamento', amount: 200, type: 'cancellation_compensation' },
    ],
    total: 200,
    paymentMethod: 'multicaixa',
  },
  {
    id: 'mov-005',
    deliveryId: 'del-h3',
    reference: 'PJD-2047',
    type: 'earning',
    date: 'Hoje, 09:05',
    lines: [
      { label: 'Base', amount: 280, type: 'base' },
      { label: 'Distância', amount: 120, type: 'distance' },
      { label: 'Gorjeta', amount: 50, type: 'tip' },
    ],
    total: 450,
    paymentMethod: 'multicaixa',
  },
];

// ── History ──────────────────────────────────────────────────
export const mockDriverHistory: DriverHistoryItem[] = [
  { id: 'del-h1', orderId: 'PJD-2051', reference: 'PJD-2051', deliveryType: 'comida', deliveryLabel: 'Comida caseira', pickupLabel: 'Sabores da Vila, Miramar', destinationLabel: 'Marginal, Luanda', date: 'Hoje, 11:45', status: 'completed', totalEarnings: 420, paymentMethod: 'multicaixa', vehicleType: 'mota' },
  { id: 'del-h2', orderId: 'PJD-2049', reference: 'PJD-2049', deliveryType: 'compras', deliveryLabel: 'Compras do dia a dia', pickupLabel: 'Meu Super, Talatona', destinationLabel: 'Talatona, Luanda', date: 'Hoje, 10:20', status: 'completed', totalEarnings: 580, paymentMethod: 'cash', vehicleType: 'mota', cashSettlementStatus: 'pending' },
  { id: 'del-h3', orderId: 'PJD-2047', reference: 'PJD-2047', deliveryType: 'compras', deliveryLabel: 'Farmácia', pickupLabel: 'Farmácia Vitalidade, Ingombota', destinationLabel: 'Ingombota, Luanda', date: 'Hoje, 09:05', status: 'completed', totalEarnings: 450, paymentMethod: 'multicaixa', vehicleType: 'mota' },
  { id: 'del-h4', orderId: 'PJD-2045', reference: 'PJD-2045', deliveryType: 'enviar', deliveryLabel: 'Envio', pickupLabel: 'Cantinho da Belita, Miramar', destinationLabel: 'Kilamba, Luanda', date: 'Hoje, 08:12', status: 'completed', totalEarnings: 400, paymentMethod: 'cash', vehicleType: 'mota', cashSettlementStatus: 'in_reconciliation' },
  { id: 'del-h5', orderId: 'PJD-2040', reference: 'PJD-2040', deliveryType: 'comida', deliveryLabel: 'Comida caseira', pickupLabel: 'Sabores da Vila, Marginal', destinationLabel: 'Samba, Luanda', date: 'Ontem, 19:30', status: 'completed', totalEarnings: 390, paymentMethod: 'multicaixa', vehicleType: 'mota' },
  { id: 'del-h6', orderId: 'PJD-2038', reference: 'PJD-2038', deliveryType: 'compras', deliveryLabel: 'Supermercado', pickupLabel: 'Kero Supermercado, Talatona', destinationLabel: 'Talatona, Luanda', date: 'Ontem, 17:15', status: 'cancelled', totalEarnings: 200, paymentMethod: 'multicaixa', vehicleType: 'mota' },
  { id: 'del-h7', orderId: 'PJD-2035', reference: 'PJD-2035', deliveryType: 'lojas', deliveryLabel: 'Centro comercial', pickupLabel: 'Game Shopping, Luanda', destinationLabel: 'Miramar, Luanda', date: 'Ontem, 14:40', status: 'failed', totalEarnings: 0, paymentMethod: 'cash', vehicleType: 'mota' },
  { id: 'del-h8', orderId: 'PJD-2032', reference: 'PJD-2032', deliveryType: 'comida', deliveryLabel: 'Comida angolana', pickupLabel: 'Cantinho da Belita, Miramar', destinationLabel: 'Ingombota, Luanda', date: '08 Set, 12:10', status: 'completed', totalEarnings: 520, paymentMethod: 'multicaixa', vehicleType: 'mota' },
  { id: 'del-h9', orderId: 'PJD-2030', reference: 'PJD-2030', deliveryType: 'enviar', deliveryLabel: 'Envio', pickupLabel: 'Marginal, Luanda', destinationLabel: 'Viana, Luanda', date: '08 Set, 09:10', status: 'returned', totalEarnings: 0, paymentMethod: 'cash', vehicleType: 'mota', cashSettlementStatus: 'pending' },
];

// ── Incoming offer ───────────────────────────────────────────
export const mockDriverOffer: DeliveryOffer = {
  id: 'offer-001',
  orderId: 'PJD-2053',
  deliveryType: 'comida',
  deliveryLabel: 'Comida angolana',
  pickupLabel: 'Cantinho da Belita',
  pickupAddress: 'Cantinho da Belita, Miramar, Luanda',
  destinationArea: 'Talatona',
  destinationAddress: 'Rua 5, Talatona, Luanda',
  distanceLabel: '2,3 km',
  distanceMeters: 2300,
  durationLabel: '~12 min',
  durationMinutes: 12,
  baseEarnings: 350,
  bonus: 0,
  tip: 0,
  totalEarnings: 350,
  vehicleRequired: 'mota',
  paymentMethod: 'cash',
  cashToCollect: 5400,
  instructions: 'Portão azul, 2º andar.',
  remainingSeconds: 20,
};

// ── Active delivery ──────────────────────────────────────────
export const mockActiveDeliveryState: ActiveDeliveryState = {
  id: 'del-2052',
  orderId: 'PJD-2052',
  deliveryType: 'comida',
  stage: 'heading_to_pickup',
  pickupLabel: 'Cantinho da Belita',
  pickupAddress: 'Cantinho da Belita, Miramar, Luanda',
  destinationLabel: 'Rua 5, Talatona',
  destinationAddress: 'Rua 5, Talatona, Luanda',
  distanceLabel: '2,3 km',
  durationLabel: '~12 min',
  baseEarnings: 350,
  bonus: 100,
  tip: 50,
  totalEarnings: 500,
  paymentMethod: 'cash',
  cashToCollect: 5400,
  instructions: 'Portão azul, 2º andar.',
  vehicleType: 'mota',
  packageSize: undefined,
  customerName: 'Joana S.',
  customerPhone: '+244 923 111 222',
  startedAt: '2026-09-10T11:30:00Z',
};
