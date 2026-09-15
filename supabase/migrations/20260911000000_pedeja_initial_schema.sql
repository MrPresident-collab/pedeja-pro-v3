-- ============================================================================
-- PEDEJÁ — INITIAL PRODUCTION SCHEMA MIGRATION
-- Migration: 20260911000000_pedeja_initial_schema.sql
-- Description: Core schema, tables, constraints, indexes, RLS and RPCs
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. Profiles (Identities in application domain)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  phone VARCHAR(32) UNIQUE,
  name VARCHAR(255) NOT NULL DEFAULT '',
  email VARCHAR(255),
  avatar_url TEXT,
  phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. User Capabilities (IDENTITY != ROLE != CAPABILITY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  capability VARCHAR(32) NOT NULL CHECK (capability IN ('customer', 'merchant', 'delivery_partner', 'partner')),
  approval_status VARCHAR(32) NOT NULL DEFAULT 'pending' CHECK (approval_status IN ('not_requested', 'pending', 'approved', 'rejected', 'suspended')),
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(identity_id, capability)
);

-- ----------------------------------------------------------------------------
-- 3. Internal Staff (Operations Boundary — operacoes.pedeja.ao)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.internal_staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(64) NOT NULL CHECK (role IN ('president', 'operations_director', 'support_lead', 'support_agent', 'dispatcher')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 4. Customer Addresses (Angola-First Hierarchical Model)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  label VARCHAR(64) NOT NULL DEFAULT 'Casa',
  line TEXT NOT NULL,
  province VARCHAR(64) NOT NULL DEFAULT 'Luanda',
  municipality VARCHAR(64) NOT NULL DEFAULT 'Luanda',
  neighborhood VARCHAR(128) NOT NULL DEFAULT '',
  street VARCHAR(255),
  landmark TEXT,
  delivery_instructions TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 5. Businesses (Merchants / Lojas / Restaurantes)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.businesses (
  id VARCHAR(64) PRIMARY KEY,
  owner_identity_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  legal_name VARCHAR(255),
  nif VARCHAR(64),
  kind VARCHAR(64) NOT NULL DEFAULT 'restaurant',
  category VARCHAR(32) NOT NULL CHECK (category IN ('comida', 'compras', 'lojas')),
  phone VARCHAR(32) NOT NULL DEFAULT '',
  address TEXT NOT NULL DEFAULT '',
  is_open BOOLEAN NOT NULL DEFAULT TRUE,
  orders_paused BOOLEAN NOT NULL DEFAULT FALSE,
  base_prep_time_minutes INT NOT NULL DEFAULT 25,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.8,
  delivery_fee_kz INT NOT NULL DEFAULT 700,
  delivery_time_min INT NOT NULL DEFAULT 25,
  delivery_time_max INT NOT NULL DEFAULT 40,
  image_url TEXT,
  banner_url TEXT,
  promo_badge VARCHAR(64),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 6. Business Members (Team permissions)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.business_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(64) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role VARCHAR(32) NOT NULL CHECK (role IN ('owner', 'manager', 'kitchen', 'cashier')),
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(business_id, identity_id)
);

-- ----------------------------------------------------------------------------
-- 7. Product Categories
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.product_categories (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  name VARCHAR(128) NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 8. Products (Menu & Catalog items)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id VARCHAR(64) PRIMARY KEY,
  business_id VARCHAR(64) NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  category_id VARCHAR(64) REFERENCES public.product_categories(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT DEFAULT '',
  price_kz INT NOT NULL CHECK (price_kz >= 0),
  prep_time_minutes INT NOT NULL DEFAULT 15,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 9. Orders (Marketplace & Parcels)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id VARCHAR(64) PRIMARY KEY,
  customer_identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  merchant_id VARCHAR(64) REFERENCES public.businesses(id) ON DELETE SET NULL,
  kind VARCHAR(32) NOT NULL DEFAULT 'marketplace' CHECK (kind IN ('marketplace', 'parcel')),
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'multicaixa')),
  payment_status VARCHAR(32) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'pending', 'confirmed', 'failed', 'refunded')),
  fulfillment_status VARCHAR(32) NOT NULL DEFAULT 'created' CHECK (fulfillment_status IN ('created', 'accepted', 'preparing', 'ready', 'out_for_delivery', 'completed', 'cancelled')),
  delivery_status VARCHAR(32) NOT NULL DEFAULT 'none' CHECK (delivery_status IN ('none', 'matching', 'assigned', 'pickup_arrived', 'picked_up', 'in_transit', 'delivered', 'failed')),
  risk_status VARCHAR(32) NOT NULL DEFAULT 'normal' CHECK (risk_status IN ('normal', 'review', 'blocked')),
  subtotal_kz INT NOT NULL DEFAULT 0,
  delivery_fee_kz INT NOT NULL DEFAULT 0,
  discount_kz INT NOT NULL DEFAULT 0,
  tip_kz INT NOT NULL DEFAULT 0,
  total_kz INT NOT NULL DEFAULT 0,
  delivery_to TEXT NOT NULL DEFAULT '',
  delivery_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
  delivery_address_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  merchant_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT DEFAULT '',
  rejection_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 10. Order Items (Immutable Price Snapshot)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id VARCHAR(64) REFERENCES public.products(id) ON DELETE SET NULL,
  name_snapshot VARCHAR(255) NOT NULL,
  price_snapshot_kz INT NOT NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  subtotal_kz INT NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 11. Order Events (Audit Timeline)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  type VARCHAR(64) NOT NULL,
  by_kind VARCHAR(32) NOT NULL CHECK (by_kind IN ('customer', 'merchant', 'delivery_partner', 'system', 'internal_staff')),
  by_ref VARCHAR(64) NOT NULL DEFAULT '',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 12. Deliveries (Physical Transport Aggregate)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.deliveries (
  id VARCHAR(64) PRIMARY KEY,
  order_id VARCHAR(64) NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE UNIQUE,
  status VARCHAR(32) NOT NULL DEFAULT 'matching' CHECK (status IN ('none', 'matching', 'assigned', 'pickup_arrived', 'picked_up', 'in_transit', 'delivered', 'failed', 'cancelled')),
  vehicle_required VARCHAR(32) NOT NULL DEFAULT 'mota' CHECK (vehicle_required IN ('mota', 'triciclo', 'carro', 'carrinha')),
  pickup_label VARCHAR(255) NOT NULL DEFAULT '',
  pickup_address TEXT NOT NULL DEFAULT '',
  destination_label VARCHAR(255) NOT NULL DEFAULT '',
  destination_address TEXT NOT NULL DEFAULT '',
  distance_km NUMERIC(5,2) NOT NULL DEFAULT 2.5,
  estimated_duration_min INT NOT NULL DEFAULT 25,
  base_pay_kz INT NOT NULL DEFAULT 600,
  distance_pay_kz INT NOT NULL DEFAULT 200,
  tip_kz INT NOT NULL DEFAULT 0,
  bonus_kz INT NOT NULL DEFAULT 0,
  total_earnings_kz INT NOT NULL DEFAULT 800,
  cash_to_collect_kz INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 13. Delivery Partners (Estafetas)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_partners (
  identity_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_type VARCHAR(32) NOT NULL DEFAULT 'mota' CHECK (vehicle_type IN ('mota', 'triciclo', 'carro', 'carrinha')),
  is_online BOOLEAN NOT NULL DEFAULT FALSE,
  active_delivery_id VARCHAR(64) REFERENCES public.deliveries(id) ON DELETE SET NULL,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.9,
  total_deliveries INT NOT NULL DEFAULT 0,
  cash_orders_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  current_latitude DOUBLE PRECISION,
  current_longitude DOUBLE PRECISION,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 14. Partner Vehicles
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.partner_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_identity_id UUID NOT NULL REFERENCES public.delivery_partners(identity_id) ON DELETE CASCADE,
  vehicle_type VARCHAR(32) NOT NULL CHECK (vehicle_type IN ('mota', 'triciclo', 'carro', 'carrinha')),
  label VARCHAR(128) NOT NULL,
  license_plate VARCHAR(32) NOT NULL,
  color VARCHAR(64) NOT NULL DEFAULT 'Preto',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  verification_status VARCHAR(32) NOT NULL DEFAULT 'approved' CHECK (verification_status IN ('pending', 'approved', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 15. Delivery Assignments (Offers to riders with timeout)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.delivery_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id VARCHAR(64) NOT NULL REFERENCES public.deliveries(id) ON DELETE CASCADE,
  partner_identity_id UUID NOT NULL REFERENCES public.delivery_partners(identity_id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'offered' CHECK (status IN ('offered', 'accepted', 'declined', 'expired', 'cancelled')),
  offered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 seconds'),
  responded_at TIMESTAMPTZ
);

-- ----------------------------------------------------------------------------
-- 16. Wallet Movements (Transparent Estafeta Earnings Ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallet_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_identity_id UUID NOT NULL REFERENCES public.delivery_partners(identity_id) ON DELETE CASCADE,
  delivery_id VARCHAR(64) REFERENCES public.deliveries(id) ON DELETE SET NULL,
  reference VARCHAR(64) NOT NULL,
  movement_type VARCHAR(32) NOT NULL CHECK (movement_type IN ('earning', 'adjustment', 'cancellation_compensation', 'withdrawal')),
  amount_kz INT NOT NULL,
  payment_method VARCHAR(32) NOT NULL DEFAULT 'cash' CHECK (payment_method IN ('cash', 'multicaixa')),
  cash_settlement_status VARCHAR(32) NOT NULL DEFAULT 'settled' CHECK (cash_settlement_status IN ('pending', 'in_reconciliation', 'settled', 'disputed')),
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 17. Notifications
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  source VARCHAR(32) NOT NULL CHECK (source IN ('order', 'delivery', 'payment', 'security', 'support')),
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 18. Audit Logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_identity_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  action VARCHAR(128) NOT NULL,
  entity_type VARCHAR(64) NOT NULL,
  entity_id VARCHAR(64) NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_identity_id);
CREATE INDEX IF NOT EXISTS idx_orders_merchant ON public.orders(merchant_id);
CREATE INDEX IF NOT EXISTS idx_orders_fulfillment ON public.orders(fulfillment_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON public.order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_events_order ON public.order_events(order_id);
CREATE INDEX IF NOT EXISTS idx_products_business ON public.products(business_id);
CREATE INDEX IF NOT EXISTS idx_addresses_identity ON public.addresses(identity_id);
CREATE INDEX IF NOT EXISTS idx_delivery_assignments_partner ON public.delivery_assignments(partner_identity_id, status);
CREATE INDEX IF NOT EXISTS idx_wallet_movements_partner ON public.wallet_movements(partner_identity_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delivery_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. Profiles
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 2. Capabilities
CREATE POLICY "Users can read own capabilities" ON public.user_capabilities
  FOR SELECT USING (auth.uid() = identity_id);

-- 3. Addresses
CREATE POLICY "Users can view own addresses" ON public.addresses
  FOR SELECT USING (auth.uid() = identity_id);
CREATE POLICY "Users can manage own addresses" ON public.addresses
  FOR ALL USING (auth.uid() = identity_id);

-- 4. Businesses & Products (Publicly viewable, editable by merchant owners/staff)
CREATE POLICY "Businesses are viewable by all" ON public.businesses
  FOR SELECT USING (true);
CREATE POLICY "Merchants can update own business" ON public.businesses
  FOR UPDATE USING (
    auth.uid() = owner_identity_id OR
    EXISTS (SELECT 1 FROM public.business_members WHERE business_id = businesses.id AND identity_id = auth.uid())
  );

CREATE POLICY "Product categories are viewable by all" ON public.product_categories
  FOR SELECT USING (true);
CREATE POLICY "Products are viewable by all" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Merchants can modify products" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.businesses WHERE id = products.business_id AND owner_identity_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.business_members WHERE business_id = products.business_id AND identity_id = auth.uid())
  );

-- 5. Orders & Items
CREATE POLICY "Users view own orders or merchant/partner views assigned" ON public.orders
  FOR SELECT USING (
    auth.uid() = customer_identity_id OR
    EXISTS (SELECT 1 FROM public.businesses WHERE id = orders.merchant_id AND owner_identity_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.business_members WHERE business_id = orders.merchant_id AND identity_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.deliveries d JOIN public.delivery_assignments da ON da.delivery_id = d.id WHERE d.order_id = orders.id AND da.partner_identity_id = auth.uid())
  );

CREATE POLICY "Customers can create orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = customer_identity_id);

CREATE POLICY "Order items viewable by order viewers" ON public.order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id)
  );
CREATE POLICY "Order items insertable with order" ON public.order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_items.order_id AND customer_identity_id = auth.uid())
  );

CREATE POLICY "Order events viewable by order viewers" ON public.order_events
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = order_events.order_id)
  );

-- 6. Deliveries & Assignments
CREATE POLICY "Deliveries viewable by participants" ON public.deliveries
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.orders WHERE id = deliveries.order_id AND (customer_identity_id = auth.uid() OR merchant_id IN (SELECT id FROM public.businesses WHERE owner_identity_id = auth.uid()))) OR
    EXISTS (SELECT 1 FROM public.delivery_assignments WHERE delivery_id = deliveries.id AND partner_identity_id = auth.uid())
  );

CREATE POLICY "Assignments viewable by target partner" ON public.delivery_assignments
  FOR SELECT USING (partner_identity_id = auth.uid());

CREATE POLICY "Partners can respond to assignments" ON public.delivery_assignments
  FOR UPDATE USING (partner_identity_id = auth.uid());

-- 7. Delivery Partner Profile & Vehicles
CREATE POLICY "Riders can view and manage own status" ON public.delivery_partners
  FOR ALL USING (identity_id = auth.uid());

CREATE POLICY "Riders can view and manage own vehicles" ON public.partner_vehicles
  FOR ALL USING (partner_identity_id = auth.uid());

-- 8. Wallet Movements
CREATE POLICY "Riders can view own wallet movements" ON public.wallet_movements
  FOR SELECT USING (partner_identity_id = auth.uid());

-- 9. Notifications
CREATE POLICY "Users can view and manage own notifications" ON public.notifications
  FOR ALL USING (identity_id = auth.uid());

-- ============================================================================
-- REALTIME REPLICATION
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'orders'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'deliveries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'delivery_assignments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.delivery_assignments;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'order_events'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.order_events;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Ignore if publication is managed by platform
    NULL;
END $$;
