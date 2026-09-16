import { useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft, ArrowRight, Bell, ChevronRight, Clock3, Compass, Home, MapPin,
  Package, Plus, Minus, Search, ShoppingBag, Store, UserRound, Utensils, ShieldCheck,
  ShoppingCart, CheckCircle2, X,
} from 'lucide-react';
import { AuthContext } from './auth/authContext';
import { supabase } from './lib/supabase';

type Tab = 'home' | 'discover' | 'orders' | 'profile';
type Category = 'food' | 'shopping' | 'stores' | 'send';
type EntryMode = 'welcome' | 'phone' | 'otp';

type Business = {
  id: string; name: string; description: string | null; marketplace_category: string | null; status: string;
};
type Product = {
  id: string; business_id: string; name: string; description: string | null; image_url: string | null;
  price: number; currency_code: string; sort_order?: number;
};
type CartLine = Product & { quantity: number };
type CustomerAddress = {
  address_id: string; label: string; recipient_name: string | null; delivery_instructions: string | null;
  is_default: boolean; line: string; neighborhood: string | null; municipality: string | null; city: string;
  province: string; address_line_1: string;
};
type Flow = 'category' | 'business' | 'product' | 'cart' | 'checkout' | 'order-success';

const categoryConfig: Record<Category, { label: string; subtitle: string; icon: typeof Utensils }> = {
  food: { label: 'Comida', subtitle: 'Restaurantes e comida local', icon: Utensils },
  shopping: { label: 'Compras', subtitle: 'O que precisas no dia a dia', icon: ShoppingBag },
  stores: { label: 'Lojas', subtitle: 'Supermercados e grandes lojas', icon: Store },
  send: { label: 'Enviar', subtitle: 'Documentos e encomendas', icon: Package },
};

function money(value: number) {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value) + ' Kz';
}

function App() {
  const auth = useContext(AuthContext);
  const [guest, setGuest] = useState(false);
  const [entry, setEntry] = useState<EntryMode>('welcome');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [authError, setAuthError] = useState('');
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<Tab>('home');
  const [category, setCategory] = useState<Category | null>(null);
  const [flow, setFlow] = useState<Flow | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [addressError, setAddressError] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [cartBusiness, setCartBusiness] = useState<Business | null>(null);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  const authenticated = auth?.isAuthenticated ?? false;
  const canEnter = authenticated || guest;
  const defaultAddress = addresses.find((address) => address.is_default) ?? addresses[0] ?? null;
  const cartSubtotal = cart.reduce((sum, line) => sum + line.price * line.quantity, 0);

  useEffect(() => {
    if (!canEnter) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      const profileId = auth?.user?.id;
      const profileQuery = profileId
        ? supabase.from('profiles').select('full_name').eq('id', profileId).maybeSingle()
        : Promise.resolve({ data: null });
      const businessQuery = supabase
        .from('businesses')
        .select('id,name,description,marketplace_category,status')
        .eq('status', 'active').order('name').limit(48);
      const [{ data: profile }, { data: businessesData }] = await Promise.all([profileQuery, businessQuery]);
      if (!active) return;
      setUserName(profile?.full_name?.split(' ')[0] ?? '');
      setBusinesses((businessesData as Business[] | null) ?? []);
      if (authenticated) await loadAddresses();
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, [canEnter, authenticated, auth?.user?.id]);

  const loadAddresses = async () => {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('address_id,label,recipient_name,delivery_instructions,is_default,addresses!inner(address_line_1,address_line_2,neighborhood,municipality,city,province)')
      .order('is_default', { ascending: false }).order('created_at');
    if (error) { setAddressError('Não foi possível carregar os teus endereços.'); return; }
    const rows = (data ?? []) as Array<Record<string, unknown>>;
    setAddresses(rows.map((row) => {
      const a = (Array.isArray(row.addresses) ? row.addresses[0] : row.addresses) as Record<string, unknown>;
      const line = [a.address_line_1, a.neighborhood, a.city].filter(Boolean).join(', ');
      return {
        address_id: String(row.address_id), label: String(row.label), recipient_name: row.recipient_name as string | null,
        delivery_instructions: row.delivery_instructions as string | null, is_default: Boolean(row.is_default), line,
        neighborhood: a.neighborhood as string | null, municipality: a.municipality as string | null,
        city: String(a.city), province: String(a.province), address_line_1: String(a.address_line_1),
      };
    }));
  };

  const requestOtp = async () => {
    setBusy(true); setAuthError('');
    const result = await auth?.signInWithPhone(phone);
    setBusy(false);
    if (result?.success) setEntry('otp');
    else setAuthError(result?.error ?? 'Não foi possível enviar o código.');
  };

  const verify = async () => {
    setBusy(true); setAuthError('');
    const result = await auth?.verifyOtp(phone, otp);
    setBusy(false);
    if (!result?.success) setAuthError(result?.error ?? 'Código inválido.');
  };

  const filteredBusinesses = useMemo(() => {
    if (!category || category === 'send') return businesses;
    const wanted = category === 'food' ? ['food', 'restaurant', 'comida'] : category === 'shopping' ? ['shopping', 'compras'] : ['stores', 'lojas', 'retail'];
    return businesses.filter((business) => wanted.includes((business.marketplace_category ?? '').toLowerCase()));
  }, [businesses, category]);

  const openCategory = (next: Category) => {
    if (next === 'send') { setCategory('send'); setFlow('category'); return; }
    setCategory(next); setFlow('category');
  };
  const nav = (next: Tab) => { setCategory(null); setFlow(null); setSelectedBusiness(null); setTab(next); };

  const openBusiness = async (business: Business) => {
    setSelectedBusiness(business); setSelectedProduct(null); setFlow('business'); setProducts([]);
    const { data, error } = await supabase.from('products')
      .select('id,business_id,name,description,image_url,price,currency_code,sort_order')
      .eq('business_id', business.id).eq('status', 'active').order('sort_order');
    if (error) { setNotice('Não foi possível carregar o catálogo.'); return; }
    setProducts((data as Product[] | null) ?? []);
  };

  const addToCart = (product: Product, quantity = 1) => {
    if (cartBusiness && selectedBusiness && cartBusiness.id !== selectedBusiness.id) {
      setNotice(`O carrinho já pertence a ${cartBusiness.name}. Finaliza-o antes de mudar de negócio.`);
      return;
    }
    setCartBusiness(selectedBusiness);
    setCart((current) => {
      const existing = current.find((line) => line.id === product.id);
      if (existing) return current.map((line) => line.id === product.id ? { ...line, quantity: line.quantity + quantity } : line);
      return [...current, { ...product, quantity }];
    });
    setSelectedProduct(null); setNotice('Adicionado ao carrinho.');
  };

  const updateCart = (productId: string, delta: number) => {
    setCart((current) => current.flatMap((line) => {
      if (line.id !== productId) return [line];
      const quantity = line.quantity + delta;
      return quantity > 0 ? [{ ...line, quantity }] : [];
    }));
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!canEnter) {
    if (entry === 'phone') return <AuthPhone onBack={() => { setEntry('welcome'); setAuthError(''); }} phone={phone} setPhone={setPhone} onContinue={() => void requestOtp()} busy={busy} error={authError} />;
    if (entry === 'otp') return <AuthOtp onBack={() => { setEntry('phone'); setAuthError(''); }} phone={phone} otp={otp} setOtp={setOtp} onVerify={() => void verify()} busy={busy} error={authError} />;
    return <WelcomeScreen onLogin={() => setEntry('phone')} onGuest={() => setGuest(true)} />;
  }

  if (authenticated && !defaultAddress && !loading) {
    return <AddressOnboarding error={addressError} onSaved={async () => { setAddressError(''); await loadAddresses(); }} />;
  }

  if (flow === 'order-success' && orderId) {
    return <AppShell tab={tab} onNavigate={nav}><OrderSuccess orderId={orderId} onDone={() => { setFlow(null); setOrderId(null); setCart([]); setCartBusiness(null); setTab('orders'); }} /></AppShell>;
  }

  if (flow === 'checkout') {
    return <AppShell tab={tab} onNavigate={nav}><CheckoutView authenticated={authenticated} address={defaultAddress} cart={cart} subtotal={cartSubtotal} business={cartBusiness} onBack={() => setFlow('cart')} onLogin={() => { setGuest(false); setEntry('phone'); setFlow(null); }} onPlaced={(id) => { setOrderId(id); setFlow('order-success'); }} /></AppShell>;
  }

  if (flow === 'cart') {
    return <AppShell tab={tab} onNavigate={nav}><CartView cart={cart} subtotal={cartSubtotal} business={cartBusiness} onBack={() => setFlow(selectedBusiness ? 'business' : null)} onUpdate={updateCart} onCheckout={() => authenticated ? setFlow('checkout') : setNotice('Entra na tua conta para finalizar o pedido.')} /></AppShell>;
  }

  if (flow === 'product' && selectedProduct) {
    return <AppShell tab={tab} onNavigate={nav}><ProductView product={selectedProduct} onBack={() => setFlow('business')} onAdd={(qty) => addToCart(selectedProduct, qty)} /></AppShell>;
  }

  if (flow === 'business' && selectedBusiness) {
    return <AppShell tab={tab} onNavigate={nav}><BusinessView business={selectedBusiness} products={products} onBack={() => { setSelectedBusiness(null); setFlow('category'); }} onProduct={(product) => { setSelectedProduct(product); setFlow('product'); }} onCart={() => setFlow('cart')} cartCount={cart.reduce((sum, line) => sum + line.quantity, 0)} /></AppShell>;
  }

  if (flow === 'category' && category) {
    return <AppShell tab={tab} onNavigate={nav}><CategoryView category={category} businesses={filteredBusinesses} loading={loading} onBack={() => { setCategory(null); setFlow(null); }} onOpenBusiness={openBusiness} /></AppShell>;
  }

  return <AppShell tab={tab} onNavigate={nav}>
    {tab === 'home' && <HomeView name={userName} businesses={businesses} loading={loading} address={defaultAddress} onCategory={openCategory} onOpenBusiness={openBusiness} />}
    {tab === 'discover' && <DiscoverView />}
    {tab === 'orders' && <OrdersView userId={auth?.user?.id} />}
    {tab === 'profile' && <ProfileView name={userName} authenticated={authenticated} address={defaultAddress} onSignOut={async () => { setGuest(false); await auth?.signOut(); }} />}
    {cart.length > 0 && <CartBar count={cart.reduce((sum, line) => sum + line.quantity, 0)} subtotal={cartSubtotal} onClick={() => setCartOpen(true)} />}
    {cartOpen && <MiniCart cart={cart} subtotal={cartSubtotal} onClose={() => setCartOpen(false)} onUpdate={updateCart} onCheckout={() => { setCartOpen(false); setFlow('cart'); }} />}
    {notice && <div className="flow-notice">{notice}</div>}
  </AppShell>;
}

function WelcomeScreen({ onLogin, onGuest }: { onLogin: () => void; onGuest: () => void }) {
  return <div className="onboarding splash-screen"><div className="splash-center"><div className="splash-wordmark">Pedejá<span className="brand-dot">.</span></div><p className="splash-tagline visible">A promessa que se move</p></div><div className="welcome-actions"><button className="btn-primary" onClick={onLogin}>Entrar <ArrowRight size={18} /></button><button className="btn-secondary" onClick={onLogin}>Criar conta</button><button className="guest-link" onClick={onGuest}>Continuar como convidado</button></div></div>;
}

function AuthPhone({ onBack, phone, setPhone, onContinue, busy, error }: { onBack: () => void; phone: string; setPhone: (v: string) => void; onContinue: () => void; busy: boolean; error: string }) {
  return <div className="onboarding welcome-screen"><div className="welcome-top"><button className="icon-button" onClick={onBack}><ArrowLeft size={19} /></button><span className="eyebrow">Entrar</span><span /></div><div className="welcome-copy"><div className="session-brand-mark"><ShieldCheck size={30} color="#8a2be2" /></div><h1>O teu número.<br /><span>A tua conta.</span></h1><p>Usamos o teu número de Angola para proteger a tua conta e enviar o código de acesso.</p></div><div className="welcome-actions"><label className="auth-field"><span>Número de telefone</span><input autoFocus inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+244 9XX XXX XXX" /></label>{error && <p className="auth-error">{error}</p>}<button className="btn-primary" disabled={busy || phone.trim().length < 9} onClick={onContinue}>{busy ? 'A enviar…' : 'Receber código'} <ArrowRight size={18} /></button></div></div>;
}

function AuthOtp({ onBack, phone, otp, setOtp, onVerify, busy, error }: { onBack: () => void; phone: string; otp: string; setOtp: (v: string) => void; onVerify: () => void; busy: boolean; error: string }) {
  return <div className="onboarding welcome-screen"><div className="welcome-top"><button className="icon-button" onClick={onBack}><ArrowLeft size={19} /></button><span className="eyebrow">Verificação</span><span /></div><div className="welcome-copy"><div className="session-brand-mark"><ShieldCheck size={30} color="#8a2be2" /></div><h1>Confirma o<br /><span>teu código.</span></h1><p>Enviámos um código para <strong>{phone}</strong>.</p></div><div className="welcome-actions"><label className="auth-field"><span>Código de verificação</span><input autoFocus inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="000000" /></label>{error && <p className="auth-error">{error}</p>}<button className="btn-primary" disabled={busy || otp.length < 4} onClick={onVerify}>{busy ? 'A verificar…' : 'Entrar'} <ArrowRight size={18} /></button></div></div>;
}

function AddressOnboarding({ error, onSaved }: { error: string; onSaved: () => Promise<void> }) {
  const [line, setLine] = useState(''); const [neighborhood, setNeighborhood] = useState(''); const [city, setCity] = useState('Luanda');
  const [province, setProvince] = useState('Luanda'); const [instructions, setInstructions] = useState(''); const [busy, setBusy] = useState(false); const [localError, setLocalError] = useState(error);
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const locate = () => {
    if (!navigator.geolocation) { setLocalError('Este dispositivo não disponibiliza localização.'); return; }
    navigator.geolocation.getCurrentPosition((position) => { setCoords({ latitude: position.coords.latitude, longitude: position.coords.longitude }); setLocalError(''); }, () => setLocalError('Permite a localização para guardarmos um endereço de entrega preciso.'));
  };
  const save = async () => {
    if (!line.trim() || !coords) { setLocalError('Indica o endereço e permite a localização antes de continuar.'); return; }
    setBusy(true); setLocalError('');
    const { error: rpcError } = await supabase.rpc('create_customer_address', {
      p_label: 'Casa', p_address_line_1: line.trim(), p_neighborhood: neighborhood.trim() || null,
      p_municipality: null, p_city: city.trim() || 'Luanda', p_province: province.trim() || 'Luanda',
      p_latitude: coords.latitude, p_longitude: coords.longitude, p_delivery_instructions: instructions.trim() || null,
    });
    setBusy(false);
    if (rpcError) { setLocalError('Não foi possível guardar o endereço. Tenta novamente.'); return; }
    await onSaved();
  };
  return <div className="onboarding address-onboarding"><div className="welcome-copy"><div className="session-brand-mark"><MapPin size={30} color="#8a2be2" /></div><p className="eyebrow">Primeiro passo</p><h1>Onde devemos<br /><span>entregar?</span></h1><p>Precisamos do teu endereço de Casa para calcular entregas e mostrar o que está perto de ti.</p></div><div className="address-form"><label className="auth-field"><span>Endereço</span><input value={line} onChange={(e) => setLine(e.target.value)} placeholder="Rua, número, edifício..." /></label><label className="auth-field"><span>Bairro</span><input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="Ex.: Talatona" /></label><div className="two-fields"><label className="auth-field"><span>Cidade</span><input value={city} onChange={(e) => setCity(e.target.value)} /></label><label className="auth-field"><span>Província</span><input value={province} onChange={(e) => setProvince(e.target.value)} /></label></div><button className={`location-permission ${coords ? 'ready' : ''}`} onClick={locate}><MapPin size={18} />{coords ? 'Localização confirmada' : 'Usar a minha localização'}<span>{coords ? '✓' : 'Obrigatório'}</span></button><label className="auth-field"><span>Instruções de entrega <small>(opcional)</small></span><input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Porta, andar, ponto de referência..." /></label>{(localError || error) && <p className="auth-error">{localError || error}</p>}<button className="btn-primary" disabled={busy} onClick={() => void save()}>{busy ? 'A guardar…' : 'Guardar Casa'} <ArrowRight size={18} /></button></div></div>;
}

function AppShell({ children, tab, onNavigate }: { children: ReactNode; tab: Tab; onNavigate: (tab: Tab) => void }) {
  return <div className="app-frame"><main className="app-content">{children}</main><nav className="bottom-nav" aria-label="Navegação principal"><NavItem active={tab === 'home'} label="Início" icon={Home} onClick={() => onNavigate('home')} /><NavItem active={tab === 'discover'} label="Descobrir" icon={Compass} onClick={() => onNavigate('discover')} /><NavItem active={tab === 'orders'} label="Pedidos" icon={Clock3} onClick={() => onNavigate('orders')} /><NavItem active={tab === 'profile'} label="Perfil" icon={UserRound} onClick={() => onNavigate('profile')} /></nav></div>;
}
function NavItem({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Home; onClick: () => void }) { return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon size={21} strokeWidth={active ? 2.4 : 2} /><span>{label}</span></button>; }

function HomeView({ name, businesses, loading, address, onCategory, onOpenBusiness }: { name: string; businesses: Business[]; loading: boolean; address: CustomerAddress | null; onCategory: (category: Category) => void; onOpenBusiness: (business: Business) => void }) {
  return <div className="screen home-screen"><header className="topbar"><div className="location-button"><MapPin size={17} /><div><span>Entregar em</span><strong>{address?.label ?? 'Casa'}</strong></div><ChevronRight size={16} /></div><button className="icon-button" aria-label="Notificações"><Bell size={20} /></button></header><section className="hero-copy"><p className="eyebrow">{name ? `Olá, ${name}` : 'Olá 👋'}</p><h1>O que precisas<br /><em>hoje?</em></h1><div className="search-bar"><Search size={19} /><span>Procurar comida, lojas ou produtos</span></div></section><section className="category-grid"><CategoryCard category="food" onClick={() => onCategory('food')} /><CategoryCard category="shopping" onClick={() => onCategory('shopping')} /><CategoryCard category="send" onClick={() => onCategory('send')} /><CategoryCard category="stores" onClick={() => onCategory('stores')} /></section><section className="quick-strip">{['Perto de ti', 'Mais pedidos', 'Promo', 'Aberto', '<20 min'].map((label, index) => <button key={label} className={index === 0 ? 'selected' : ''}>{label}</button>)}</section><section className="section-block"><SectionHeading title="Perto de ti" action="Ver tudo" />{loading ? <LoadingRows /> : businesses.length === 0 ? <EmptyState title="Estamos a preparar a rede" text="Os negócios disponíveis aparecerão aqui assim que estiverem activos." /> : <BusinessRail businesses={businesses.slice(0, 8)} onOpen={onOpenBusiness} />}</section><section className="promise-banner"><div><span>PEDEJÁ</span><strong>Uma promessa que se move.</strong><p>Comida, compras, lojas e entregas num só lugar.</p></div><ArrowRight size={20} /></section></div>;
}
function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) { const config = categoryConfig[category]; const Icon = config.icon; return <button className={`category-card ${category}`} onClick={onClick}><div className="category-icon"><Icon size={23} /></div><div><strong>{config.label}</strong><span>{config.subtitle}</span></div><ArrowRight size={17} /></button>; }
function CategoryView({ category, businesses, loading, onBack, onOpenBusiness }: { category: Category; businesses: Business[]; loading: boolean; onBack: () => void; onOpenBusiness: (business: Business) => void }) { const config = categoryConfig[category]; if (category === 'send') return <SendView onBack={onBack} />; return <div className="screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>Descobrir</span><h2>{config.label}</h2></div><button className="icon-button"><Search size={20} /></button></header><div className="category-intro"><p>{config.subtitle}</p><div className="search-bar compact"><Search size={18} /><span>Procurar {config.label.toLowerCase()}</span></div></div><section className="section-block category-results">{loading ? <LoadingRows /> : businesses.length === 0 ? <EmptyState title="Ainda não há negócios aqui" text="Estamos a expandir a rede Pedejá." /> : businesses.map((business) => <button className="business-row" key={business.id} onClick={() => onOpenBusiness(business)}><div className="business-avatar">{business.name.slice(0, 1).toUpperCase()}</div><div className="business-main"><strong>{business.name}</strong><span>{business.description || 'Negócio Pedejá'}</span><small>{categoryConfig[category].label} · Ver catálogo</small></div><ChevronRight size={19} /></button>)}</section></div>; }
function BusinessRail({ businesses, onOpen }: { businesses: Business[]; onOpen: (business: Business) => void }) { return <div className="business-rail">{businesses.map((business) => <button className="business-tile" key={business.id} onClick={() => onOpen(business)}><div className="tile-image">{business.name.slice(0, 1)}</div><strong>{business.name}</strong><span>{business.marketplace_category || 'Pedejá'}</span><small>Aberto · consultar catálogo</small></button>)}</div>; }

function BusinessView({ business, products, onBack, onProduct, onCart, cartCount }: { business: Business; products: Product[]; onBack: () => void; onProduct: (product: Product) => void; onCart: () => void; cartCount: number }) {
  return <div className="screen business-screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>{business.marketplace_category || 'Pedejá'}</span><h2>{business.name}</h2></div>{cartCount > 0 ? <button className="icon-button cart-icon" onClick={onCart}><ShoppingCart size={20} /><b>{cartCount}</b></button> : <span />}</header><div className="business-hero"><div className="business-hero-mark">{business.name.slice(0, 1).toUpperCase()}</div><h1>{business.name}</h1><p>{business.description || 'Produtos disponíveis para entrega.'}</p><span><Clock3 size={14} /> Consulte o tempo no checkout</span></div><section className="menu-section"><div className="section-heading"><h2>Catálogo</h2><span>{products.length} produtos</span></div>{products.length === 0 ? <EmptyState title="Catálogo vazio" text="Este negócio ainda não tem produtos disponíveis." /> : products.map((product) => <button className="product-row" key={product.id} onClick={() => onProduct(product)}><div className="product-thumb">{product.image_url ? <img src={product.image_url} alt="" /> : <span>{product.name.slice(0, 1)}</span>}</div><div className="product-main"><strong>{product.name}</strong><span>{product.description || 'Produto Pedejá'}</span><b>{money(Number(product.price))}</b></div><span className="add-circle"><Plus size={18} /></span></button>)}</section>{cartCount > 0 && <button className="floating-cart" onClick={onCart}><ShoppingCart size={18} /><span>Ver carrinho</span><strong>{cartCount} · {money(products.length ? 0 : 0)}</strong></button>}</div>;
}

function ProductView({ product, onBack, onAdd }: { product: Product; onBack: () => void; onAdd: (quantity: number) => void }) {
  const [quantity, setQuantity] = useState(1);
  return <div className="screen product-screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>Produto</span><h2>Detalhes</h2></div><span /></header><div className="product-hero-image">{product.image_url ? <img src={product.image_url} alt="" /> : <span>{product.name.slice(0, 1)}</span>}</div><div className="product-detail"><span className="eyebrow">{product.currency_code}</span><h1>{product.name}</h1><strong>{money(Number(product.price))}</strong><p>{product.description || 'Um produto disponível através da rede Pedejá.'}</p></div><div className="quantity-control"><button onClick={() => setQuantity((q) => Math.max(1, q - 1))}><Minus size={18} /></button><strong>{quantity}</strong><button onClick={() => setQuantity((q) => q + 1)}><Plus size={18} /></button></div><button className="primary-action sticky-action" onClick={() => onAdd(quantity)}>Adicionar · {money(Number(product.price) * quantity)} <ShoppingCart size={18} /></button></div>;
}

function CartView({ cart, subtotal, business, onBack, onUpdate, onCheckout }: { cart: CartLine[]; subtotal: number; business: Business | null; onBack: () => void; onUpdate: (id: string, delta: number) => void; onCheckout: () => void }) {
  return <div className="screen cart-screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>{business?.name || 'Pedejá'}</span><h2>Carrinho</h2></div><span /></header>{cart.length === 0 ? <EmptyState title="O teu carrinho está vazio" text="Escolhe um produto para começar." /> : <><section className="cart-lines">{cart.map((line) => <div className="cart-line" key={line.id}><div><strong>{line.name}</strong><span>{money(Number(line.price))} cada</span></div><div className="line-controls"><button onClick={() => onUpdate(line.id, -1)}><Minus size={15} /></button><b>{line.quantity}</b><button onClick={() => onUpdate(line.id, 1)}><Plus size={15} /></button></div><strong>{money(Number(line.price) * line.quantity)}</strong></div>)}</section><div className="checkout-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><div><span>Entrega</span><span>Calculada no servidor</span></div><div><span>Taxa de serviço</span><span>Calculada no servidor</span></div><p>O valor final é calculado pelo Pedejá no momento do pedido.</p></div><button className="primary-action sticky-action" onClick={onCheckout}>Continuar <ArrowRight size={18} /></button></>}</div>;
}

function CheckoutView({ authenticated, address, cart, subtotal, business, onBack, onLogin, onPlaced }: { authenticated: boolean; address: CustomerAddress | null; cart: CartLine[]; subtotal: number; business: Business | null; onBack: () => void; onLogin: () => void; onPlaced: (id: string) => void }) {
  const [note, setNote] = useState(''); const [instructions, setInstructions] = useState(''); const [busy, setBusy] = useState(false); const [error, setError] = useState('');
  const place = async () => {
    if (!authenticated) { onLogin(); return; }
    if (!address || !business || cart.length === 0) { setError('Falta um endereço, negócio ou produto.'); return; }
    setBusy(true); setError('');
    const idempotencyKey = crypto.randomUUID();
    const { data, error: rpcError } = await supabase.rpc('create_customer_order', {
      p_business_id: business.id, p_delivery_address_id: address.address_id,
      p_items: cart.map((line) => ({ product_id: line.id, quantity: line.quantity })),
      p_customer_note: note.trim() || null, p_delivery_instructions: instructions.trim() || null, p_idempotency_key: idempotencyKey,
    });
    setBusy(false);
    if (rpcError || !data) { setError('Não foi possível criar o pedido. Verifica os dados e tenta novamente.'); return; }
    onPlaced(String(data));
  };
  return <div className="screen checkout-screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>{business?.name || 'Pedejá'}</span><h2>Confirmar pedido</h2></div><span /></header><section className="checkout-block"><h3>Entregar em</h3><div className="selected-address"><MapPin size={18} /><div><strong>{address?.label || 'Endereço'}</strong><span>{address?.line || 'Entra para escolher um endereço.'}</span></div></div></section><section className="checkout-block"><h3>Pagamento</h3><button className="payment-choice selected"><span className="payment-dot" /><div><strong>Dinheiro</strong><span>Pagamento na entrega</span></div><CheckCircle2 size={18} /></button><button className="payment-choice disabled"><span className="payment-dot" /><div><strong>Multicaixa</strong><span>Pagamento electrónico será disponibilizado conforme o provedor configurado.</span></div></button></section><section className="checkout-block"><h3>Observações</h3><label className="auth-field"><span>Para o negócio <small>(opcional)</small></span><input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ex.: sem cebola" /></label><label className="auth-field"><span>Para o estafeta <small>(opcional)</small></span><input value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Ex.: ligar ao chegar" /></label></section><div className="checkout-summary"><div><span>Subtotal</span><strong>{money(subtotal)}</strong></div><p>Entrega, taxa de serviço e total final serão calculados no servidor.</p></div>{error && <p className="auth-error">{error}</p>}<button className="primary-action sticky-action" disabled={busy} onClick={() => void place()}>{busy ? 'A criar pedido…' : 'Fazer pedido'} <ArrowRight size={18} /></button></div>;
}

function OrderSuccess({ orderId, onDone }: { orderId: string; onDone: () => void }) {
  return <div className="screen success-screen"><div className="success-icon"><CheckCircle2 size={42} /></div><p className="eyebrow">Pedido criado</p><h1>A tua promessa<br /><em>está em movimento.</em></h1><p>O pedido foi registado com sucesso. O valor e o estado oficial vêm do Pedejá.</p><div className="success-ref"><span>Referência interna</span><strong>{orderId.slice(0, 8).toUpperCase()}</strong></div><button className="primary-action" onClick={onDone}>Ver pedidos <ArrowRight size={18} /></button></div>;
}

function CartBar({ count, subtotal, onClick }: { count: number; subtotal: number; onClick: () => void }) { return <button className="cart-bar" onClick={onClick}><ShoppingCart size={18} /><span>{count} {count === 1 ? 'item' : 'itens'}</span><strong>{money(subtotal)}</strong><ChevronRight size={18} /></button>; }
function MiniCart({ cart, subtotal, onClose, onUpdate, onCheckout }: { cart: CartLine[]; subtotal: number; onClose: () => void; onUpdate: (id: string, delta: number) => void; onCheckout: () => void }) { return <div className="sheet-backdrop" onClick={onClose}><div className="mini-sheet" onClick={(e) => e.stopPropagation()}><header><div><span>O teu pedido</span><h2>Carrinho</h2></div><button className="icon-button" onClick={onClose}><X size={18} /></button></header>{cart.map((line) => <div className="mini-line" key={line.id}><div><strong>{line.name}</strong><span>{money(Number(line.price))}</span></div><div className="line-controls"><button onClick={() => onUpdate(line.id, -1)}><Minus size={14} /></button><b>{line.quantity}</b><button onClick={() => onUpdate(line.id, 1)}><Plus size={14} /></button></div></div>)}<div className="mini-total"><span>Subtotal</span><strong>{money(subtotal)}</strong></div><button className="primary-action" onClick={onCheckout}>Continuar <ArrowRight size={18} /></button></div></div>; }

function SendView({ onBack }: { onBack: () => void }) { return <div className="screen send-screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>Pedejá</span><h2>Enviar</h2></div></header><div className="send-hero"><div className="send-icon"><Package size={30} /></div><h1>Fazemos chegar.</h1><p>Envia documentos, pequenas encomendas e pacotes para onde precisam de ir.</p></div><div className="form-stack"><label>Recolher em<button className="field"><MapPin size={18} /><span>Escolher local de recolha</span><ChevronRight size={17} /></button></label><label>Entregar em<button className="field"><MapPin size={18} /><span>Escolher destino</span><ChevronRight size={17} /></button></label><label>O que vais enviar?<button className="field"><Package size={18} /><span>Documento ou encomenda</span><ChevronRight size={17} /></button></label></div><button className="primary-action">Continuar <ArrowRight size={18} /></button></div>; }
function DiscoverView() { return <div className="screen discover-screen"><div className="page-heading"><span>PEDEJÁ</span><h1>Descobrir</h1><p>Conhece a rede que faz as coisas moverem-se.</p></div><div className="link-groups"><LinkGroup title="Sobre nós" links={['O que é Pedejá', 'A promessa que se move']} /><LinkGroup title="Como funciona" links={['Como pedir', 'Como enviar', 'Acompanhar pedido']} /><LinkGroup title="Faz parte da rede" links={['Tornar-se Estafeta', 'Tornar-se Parceiro', 'Registar negócio']} /><LinkGroup title="Ajuda" links={['Perguntas frequentes', 'Contactar suporte']} /></div></div>; }
function LinkGroup({ title, links }: { title: string; links: string[] }) { return <section className="link-group"><h3>{title}</h3>{links.map((link) => <button key={link}>{link}<ChevronRight size={17} /></button>)}</section>; }
function OrdersView({ userId }: { userId?: string }) { const [orders, setOrders] = useState<Array<{ id: string; order_reference: string; status: string; total_amount: number; created_at: string }>>([]); const [loading, setLoading] = useState(true); useEffect(() => { if (!userId) { setLoading(false); return; } let active = true; const load = async () => { const { data } = await supabase.from('orders').select('id,order_reference,status,total_amount,created_at').eq('customer_id', userId).order('created_at', { ascending: false }).limit(20); if (active) { setOrders((data as typeof orders) ?? []); setLoading(false); } }; void load(); return () => { active = false; }; }, [userId]); return <div className="screen"><div className="page-heading"><span>OS TEUS PEDIDOS</span><h1>Acompanhar</h1><p>Todos os teus pedidos num só lugar.</p></div><div className="order-tabs"><button className="selected">Ativos</button><button>Histórico</button></div>{loading ? <LoadingRows /> : orders.length === 0 ? <EmptyState title="Ainda não tens pedidos" text="Quando fizeres o teu primeiro pedido, poderás acompanhá-lo aqui." action="Começar a pedir" /> : <div className="order-list">{orders.map((order) => <article className="order-card" key={order.id}><div><span>{order.order_reference}</span><strong>{order.status}</strong><small>{new Date(order.created_at).toLocaleString('pt-AO')}</small></div><b>{money(Number(order.total_amount))}</b></article>)}</div>}</div>; }
function ProfileView({ name, authenticated, address, onSignOut }: { name: string; authenticated: boolean; address: CustomerAddress | null; onSignOut: () => Promise<void> }) { return <div className="screen"><div className="profile-head"><div className="avatar">{name ? name.slice(0, 1).toUpperCase() : 'P'}</div><div><span>Conta Pedejá</span><h1>{name || 'A tua conta'}</h1></div></div><div className="profile-list"><ProfileItem icon={MapPin} title="Endereços" detail={address?.line || 'Casa e outros locais'} /><ProfileItem icon={ShoppingBag} title="Pagamentos" detail="Dinheiro · Multicaixa" /><ProfileItem icon={Bell} title="Notificações" detail="Preferências e alertas" /><ProfileItem icon={UserRound} title="Ajuda e suporte" detail="Estamos aqui para ajudar" /></div>{authenticated && <button className="logout" onClick={() => void onSignOut()}>Terminar sessão</button>}<p className="version">Pedejá · A promessa que se move</p></div>; }
function ProfileItem({ icon: Icon, title, detail }: { icon: typeof MapPin; title: string; detail: string }) { return <button className="profile-item"><div className="profile-item-icon"><Icon size={19} /></div><div><strong>{title}</strong><span>{detail}</span></div><ChevronRight size={18} /></button>; }
function SectionHeading({ title, action }: { title: string; action: string }) { return <div className="section-heading"><h2>{title}</h2><button>{action}<ChevronRight size={15} /></button></div>; }
function LoadingRows() { return <div className="loading-list"><div /><div /><div /></div>; }
function EmptyState({ title, text, action }: { title: string; text: string; action?: string }) { return <div className="empty-state"><div className="empty-dot" /><h2>{title}</h2><p>{text}</p>{action && <button className="primary-action">{action}</button>}</div>; }

export default App;
