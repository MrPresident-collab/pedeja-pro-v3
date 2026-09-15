-- ============================================================================
-- PEDEJÁ — INITIAL SEED DATA
-- Seed: 20260911000000_pedeja_seed.sql
-- Description: Luanda businesses, catalogs, categories, vehicles and staff
-- ============================================================================

-- 1. Businesses in Luanda
INSERT INTO public.businesses (
  id, name, legal_name, nif, kind, category, phone, address, is_open, orders_paused,
  base_prep_time_minutes, rating, delivery_fee_kz, delivery_time_min, delivery_time_max,
  image_url, banner_url, promo_badge
) VALUES
(
  'b1',
  'Cantinho da Belita',
  'Belita & Filhos Catering Lda',
  '5412893321',
  'restaurant',
  'comida',
  '+244923112233',
  'Rua das Flores, 14, Alvalade, Luanda',
  true,
  false,
  25,
  4.8,
  700,
  25,
  40,
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&auto=format&fit=crop&q=80',
  '-10%'
),
(
  'b2',
  'Tia Maria — Petiscos & Grelhados',
  'Tia Maria Gastronomia Lda',
  '5419082219',
  'restaurant',
  'comida',
  '+244924556677',
  'Avenida Comandante Valódia, Miramar, Luanda',
  true,
  false,
  30,
  4.9,
  900,
  30,
  45,
  'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200&auto=format&fit=crop&q=80',
  'Popular'
),
(
  'b3',
  'Kero Supermercado — Talatona',
  'Anseba Kero Distribuição SA',
  '5400192841',
  'supermarket',
  'compras',
  '+244931002244',
  'Estrada de Samba, Shopping Talatona, Luanda',
  true,
  false,
  45,
  4.7,
  1200,
  40,
  60,
  'https://images.unsplash.com/photo-1578916171728-46686eac8d58?w=600&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&auto=format&fit=crop&q=80',
  'Fresco'
),
(
  'b4',
  'Farmácia Popular de Luanda',
  'Rede Farmacêutica Angolana Lda',
  '5429182390',
  'pharmacy',
  'compras',
  '+244922998811',
  'Largo do Kinaxixi, Edifício Cuanza, Luanda',
  true,
  false,
  15,
  4.9,
  800,
  15,
  30,
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
  NULL,
  '24h'
),
(
  'b5',
  'Bazar Central Moda & Tech',
  'Comércio Moderno de Angola Lda',
  '5491029381',
  'retail',
  'lojas',
  '+244912334455',
  'Rua Rainha Ginga, Centro, Luanda',
  true,
  false,
  35,
  4.6,
  1500,
  45,
  70,
  'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
  NULL,
  'Novidade'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  delivery_fee_kz = EXCLUDED.delivery_fee_kz;

-- 2. Product Categories
INSERT INTO public.product_categories (id, business_id, name, sort_order) VALUES
('cat-b1-pratos', 'b1', 'Pratos Típicos', 1),
('cat-b1-bebidas', 'b1', 'Bebidas & Sumos', 2),
('cat-b2-grelhados', 'b2', 'Grelhados na Brasa', 1),
('cat-b2-acompanhamentos', 'b2', 'Acompanhamentos', 2),
('cat-b3-mercearia', 'b3', 'Mercearia Essencial', 1),
('cat-b4-saude', 'b4', 'Primeiros Socorros & Vitaminas', 1),
('cat-b5-acessorios', 'b5', 'Acessórios & Utilidades', 1)
ON CONFLICT (id) DO NOTHING;

-- 3. Products
INSERT INTO public.products (id, business_id, category_id, name, description, price_kz, prep_time_minutes, available, image_url) VALUES
(
  'p1',
  'b1',
  'cat-b1-pratos',
  'Muamba de Galinha com Funge',
  'Tradicional galinha da terra com quiabos, óleo de palma e funge de bombó.',
  4500,
  25,
  true,
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&auto=format&fit=crop&q=80'
),
(
  'p2',
  'b1',
  'cat-b1-pratos',
  'Calulu de Peixe Seco e Fresco',
  'Com folhas de rama de batata-doce, quiabos e feijão de óleo de palma.',
  5200,
  30,
  true,
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&auto=format&fit=crop&q=80'
),
(
  'p3',
  'b1',
  'cat-b1-bebidas',
  'Sumo Natural de Múcua 500ml',
  'Feito na hora com polpa fresca de embondeiro e um toque de canela.',
  1200,
  5,
  true,
  'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=400&auto=format&fit=crop&q=80'
),
(
  'p4',
  'b2',
  'cat-b2-grelhados',
  'Mufete Completo da Ilha',
  'Peixe carapau grelhado, feijão de óleo de palma, batata-doce, banana cozida e vinagrete.',
  6000,
  35,
  true,
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&auto=format&fit=crop&q=80'
),
(
  'p5',
  'b2',
  'cat-b2-grelhados',
  'Frango no Churrasco Picante',
  'Meio frango grelhado no carvão com molho de jindungo e batata frita.',
  3800,
  20,
  true,
  'https://images.unsplash.com/photo-1598515214211-89d3c73ae83b?w=400&auto=format&fit=crop&q=80'
),
(
  'p6',
  'b3',
  'cat-b3-mercearia',
  'Cesto Básico Familiar',
  '5kg Arroz tio Lucas, 1L Óleo de palma, 2kg Feijão fradinho e sal refinado.',
  14500,
  15,
  true,
  'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&auto=format&fit=crop&q=80'
),
(
  'p7',
  'b4',
  'cat-b4-saude',
  'Kit Vitamina C + Zinco Efervescente',
  'Suplemento imunitário com 20 comprimidos efervescentes.',
  3200,
  5,
  true,
  'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400&auto=format&fit=crop&q=80'
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_kz = EXCLUDED.price_kz,
  available = EXCLUDED.available;

-- 4. Operations Internal Staff (Voldi Bill Paulo Ngangu — president@pedeja.ao)
INSERT INTO public.internal_staff (
  id, email, full_name, role, permissions, is_active
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'president@pedeja.ao',
  'Voldi Bill Paulo Ngangu',
  'president',
  '["ops.all", "ops.view_dashboard", "ops.manage_orders", "ops.manage_merchants", "ops.manage_riders", "ops.financial_reconciliation", "ops.system_settings"]'::jsonb,
  true
)
ON CONFLICT (email) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions;
