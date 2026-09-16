import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Bell,
  ChevronRight,
  Clock3,
  Compass,
  Home,
  MapPin,
  Package,
  Search,
  ShoppingBag,
  Store,
  UserRound,
  Utensils,
} from 'lucide-react';
import { supabase } from './lib/supabase';
import './index.css';

type Tab = 'home' | 'discover' | 'orders' | 'profile';
type Category = 'food' | 'shopping' | 'stores' | 'send';

type Business = {
  id: string;
  name: string;
  description: string | null;
  marketplace_category: string | null;
  status: string;
};

type Product = {
  id: string;
  business_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  currency_code: string;
};

const money = (value: number) => `${new Intl.NumberFormat('pt-AO').format(value)} Kz`;

const categoryConfig: Record<Category, { label: string; subtitle: string; icon: typeof Utensils }> = {
  food: { label: 'Comida', subtitle: 'Restaurantes e comida local', icon: Utensils },
  shopping: { label: 'Compras', subtitle: 'O que precisas no dia a dia', icon: ShoppingBag },
  stores: { label: 'Lojas', subtitle: 'Supermercados e grandes lojas', icon: Store },
  send: { label: 'Enviar', subtitle: 'Documentos e encomendas', icon: Package },
};

function App() {
  const [tab, setTab] = useState<Tab>('home');
  const [category, setCategory] = useState<Category | null>(null);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const [{ data: profile }, { data: businessesData }] = await Promise.all([
        supabase.from('profiles').select('full_name').maybeSingle(),
        supabase
          .from('businesses')
          .select('id,name,description,marketplace_category,status')
          .eq('status', 'active')
          .order('name')
          .limit(24),
      ]);
      if (!active) return;
      setUserName(profile?.full_name?.split(' ')[0] ?? '');
      setBusinesses((businessesData as Business[] | null) ?? []);
      setLoading(false);
    };
    void load();
    return () => { active = false; };
  }, []);

  const filteredBusinesses = useMemo(() => {
    if (!category || category === 'send') return businesses;
    const wanted = category === 'food' ? ['food', 'restaurant', 'comida'] : category === 'shopping' ? ['shopping', 'compras'] : ['stores', 'lojas', 'retail'];
    return businesses.filter((business) => wanted.includes((business.marketplace_category ?? '').toLowerCase()));
  }, [businesses, category]);

  const openCategory = (next: Category) => {
    setCategory(next);
    if (next === 'send') setTab('home');
  };

  const nav = (next: Tab) => {
    setCategory(null);
    setTab(next);
  };

  if (category) {
    return (
      <AppShell tab={tab} onNavigate={nav}>
        <CategoryView
          category={category}
          businesses={filteredBusinesses}
          products={products}
          loading={loading}
          onBack={() => setCategory(null)}
          onLoadProducts={async (businessId) => {
            const { data } = await supabase.from('products').select('id,business_id,name,description,image_url,price,currency_code').eq('business_id', businessId).eq('status', 'active').order('sort_order');
            setProducts((data as Product[] | null) ?? []);
          }}
        />
      </AppShell>
    );
  }

  return (
    <AppShell tab={tab} onNavigate={nav}>
      {tab === 'home' && <HomeView name={userName} businesses={businesses} loading={loading} onCategory={openCategory} />}
      {tab === 'discover' && <DiscoverView />}
      {tab === 'orders' && <OrdersView />}
      {tab === 'profile' && <ProfileView name={userName} />}
    </AppShell>
  );
}

function AppShell({ children, tab, onNavigate }: { children: React.ReactNode; tab: Tab; onNavigate: (tab: Tab) => void }) {
  return (
    <div className="app-frame">
      <main className="app-content">{children}</main>
      <nav className="bottom-nav" aria-label="Navegação principal">
        <NavItem active={tab === 'home'} label="Início" icon={Home} onClick={() => onNavigate('home')} />
        <NavItem active={tab === 'discover'} label="Descobrir" icon={Compass} onClick={() => onNavigate('discover')} />
        <NavItem active={tab === 'orders'} label="Pedidos" icon={Clock3} onClick={() => onNavigate('orders')} />
        <NavItem active={tab === 'profile'} label="Perfil" icon={UserRound} onClick={() => onNavigate('profile')} />
      </nav>
    </div>
  );
}

function NavItem({ active, label, icon: Icon, onClick }: { active: boolean; label: string; icon: typeof Home; onClick: () => void }) {
  return <button className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}><Icon size={21} strokeWidth={active ? 2.4 : 2} /><span>{label}</span></button>;
}

function HomeView({ name, businesses, loading, onCategory }: { name: string; businesses: Business[]; loading: boolean; onCategory: (category: Category) => void }) {
  return (
    <div className="screen home-screen">
      <header className="topbar">
        <div className="location-button"><MapPin size={17} /><div><span>Entregar em</span><strong>Casa</strong></div><ChevronRight size={16} /></div>
        <button className="icon-button" aria-label="Notificações"><Bell size={20} /></button>
      </header>

      <section className="hero-copy">
        <p className="eyebrow">{name ? `Olá, ${name}` : 'Olá 👋'}</p>
        <h1>O que precisas<br /><em>hoje?</em></h1>
        <div className="search-bar"><Search size={19} /><span>Procurar comida, lojas ou produtos</span></div>
      </section>

      <section className="category-grid">
        <CategoryCard category="food" onClick={() => onCategory('food')} />
        <CategoryCard category="shopping" onClick={() => onCategory('shopping')} />
        <CategoryCard category="send" onClick={() => onCategory('send')} />
        <CategoryCard category="stores" onClick={() => onCategory('stores')} />
      </section>

      <section className="quick-strip">
        {['Perto de ti', 'Mais pedidos', 'Promo', 'Aberto', '<20 min'].map((label, index) => <button key={label} className={index === 0 ? 'selected' : ''}>{label}</button>)}
      </section>

      <section className="section-block">
        <SectionHeading title="Perto de ti" action="Ver tudo" />
        {loading ? <LoadingRows /> : businesses.length === 0 ? <EmptyState title="Estamos a preparar a rede" text="Os negócios disponíveis aparecerão aqui assim que estiverem activos." /> : <BusinessRail businesses={businesses.slice(0, 8)} />}
      </section>

      <section className="promise-banner">
        <div><span>PEDEJÁ</span><strong>Uma promessa que se move.</strong><p>Comida, compras, lojas e entregas num só lugar.</p></div>
        <ArrowRight size={20} />
      </section>
    </div>
  );
}

function CategoryCard({ category, onClick }: { category: Category; onClick: () => void }) {
  const config = categoryConfig[category];
  const Icon = config.icon;
  return <button className={`category-card ${category}`} onClick={onClick}><div className="category-icon"><Icon size={23} /></div><div><strong>{config.label}</strong><span>{config.subtitle}</span></div><ArrowRight size={17} /></button>;
}

function CategoryView({ category, businesses, products, loading, onBack, onLoadProducts }: { category: Category; businesses: Business[]; products: Product[]; loading: boolean; onBack: () => void; onLoadProducts: (id: string) => Promise<void> }) {
  const config = categoryConfig[category];
  if (category === 'send') return <SendView onBack={onBack} />;
  return <div className="screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>Explorar</span><h2>{config.label}</h2></div><button className="icon-button"><Search size={20} /></button></header><div className="category-intro"><p>{config.subtitle}</p><div className="search-bar compact"><Search size={18} /><span>Procurar {config.label.toLowerCase()}</span></div></div><section className="section-block category-results">{loading ? <LoadingRows /> : businesses.length === 0 ? <EmptyState title="Ainda não há negócios aqui" text="Estamos a expandir a rede Pedejá." /> : businesses.map((business) => <BusinessRow key={business.id} business={business} products={products} onOpen={() => void onLoadProducts(business.id)} />)}</section></div>;
}

function BusinessRow({ business, products, onOpen }: { business: Business; products: Product[]; onOpen: () => void }) {
  const ownProducts = products.filter((product) => product.business_id === business.id);
  return <button className="business-row" onClick={onOpen}><div className="business-avatar">{business.name.slice(0, 1).toUpperCase()}</div><div className="business-main"><strong>{business.name}</strong><span>{business.description || 'Negócio Pedejá'}</span><small>{ownProducts.length ? `${ownProducts.length} produtos` : 'Ver catálogo'} · Aberto</small></div><ChevronRight size={19} /></button>;
}

function BusinessRail({ businesses }: { businesses: Business[] }) {
  return <div className="business-rail">{businesses.map((business) => <article className="business-tile" key={business.id}><div className="tile-image">{business.name.slice(0, 1)}</div><strong>{business.name}</strong><span>{business.marketplace_category || 'Pedejá'}</span><small>Aberto · 20–35 min</small></article>)}</div>;
}

function SendView({ onBack }: { onBack: () => void }) {
  return <div className="screen send-screen"><header className="inner-header"><button className="back-button" onClick={onBack}><ArrowLeft size={20} /></button><div><span>Pedejá</span><h2>Enviar</h2></div></header><div className="send-hero"><div className="send-icon"><Package size={30} /></div><h1>Fazemos chegar.</h1><p>Envia documentos, pequenas encomendas e pacotes para onde precisam de ir.</p></div><div className="form-stack"><label>Recolher em<button className="field"><MapPin size={18} /><span>Escolher local de recolha</span><ChevronRight size={17} /></button></label><label>Entregar em<button className="field"><MapPin size={18} /><span>Escolher destino</span><ChevronRight size={17} /></button></label><label>O que vais enviar?<button className="field"><Package size={18} /><span>Documento ou encomenda</span><ChevronRight size={17} /></button></label></div><button className="primary-action">Continuar <ArrowRight size={18} /></button></div>;
}

function DiscoverView() {
  return <div className="screen discover-screen"><div className="page-heading"><span>PEDEJÁ</span><h1>Descobrir</h1><p>Conhece a rede que faz as coisas moverem-se.</p></div><div className="link-groups"><LinkGroup title="Sobre nós" links={['O que é Pedejá', 'A promessa que se move']} /><LinkGroup title="Como funciona" links={['Como pedir', 'Como enviar', 'Acompanhar pedido']} /><LinkGroup title="Faz parte da rede" links={['Tornar-se Estafeta', 'Tornar-se Parceiro', 'Registar negócio']} /><LinkGroup title="Ajuda" links={['Perguntas frequentes', 'Contactar suporte']} /></div></div>;
}

function LinkGroup({ title, links }: { title: string; links: string[] }) { return <section className="link-group"><h3>{title}</h3>{links.map((link) => <button key={link}>{link}<ChevronRight size={17} /></button>)}</section>; }

function OrdersView() {
  return <div className="screen"><div className="page-heading"><span>OS TEUS PEDIDOS</span><h1>Acompanhar</h1><p>Todos os teus pedidos num só lugar.</p></div><div className="order-tabs"><button className="selected">Ativos</button><button>Histórico</button></div><EmptyState title="Ainda não tens pedidos" text="Quando fizeres o teu primeiro pedido, poderás acompanhá-lo aqui em tempo real." action="Começar a pedir" /></div>;
}

function ProfileView({ name }: { name: string }) {
  return <div className="screen"><div className="profile-head"><div className="avatar">{name ? name.slice(0, 1).toUpperCase() : 'P'}</div><div><span>Conta Pedejá</span><h1>{name || 'A tua conta'}</h1></div></div><div className="profile-list"><ProfileItem icon={MapPin} title="Endereços" detail="Casa e outros locais" /><ProfileItem icon={ShoppingBag} title="Pagamentos" detail="Gerir métodos de pagamento" /><ProfileItem icon={Bell} title="Notificações" detail="Preferências e alertas" /><ProfileItem icon={UserRound} title="Ajuda e suporte" detail="Estamos aqui para ajudar" /></div><button className="logout">Terminar sessão</button><p className="version">Pedejá · A promessa que se move</p></div>;
}

function ProfileItem({ icon: Icon, title, detail }: { icon: typeof MapPin; title: string; detail: string }) { return <button className="profile-item"><div className="profile-item-icon"><Icon size={19} /></div><div><strong>{title}</strong><span>{detail}</span></div><ChevronRight size={18} /></button>; }

function SectionHeading({ title, action }: { title: string; action: string }) { return <div className="section-heading"><h2>{title}</h2><button>{action}<ChevronRight size={15} /></button></div>; }
function LoadingRows() { return <div className="loading-list"><div /><div /><div /></div>; }
function EmptyState({ title, text, action }: { title: string; text: string; action?: string }) { return <div className="empty-state"><div className="empty-dot" /><h2>{title}</h2><p>{text}</p>{action && <button className="primary-action">{action}</button>}</div>; }

export default App;
