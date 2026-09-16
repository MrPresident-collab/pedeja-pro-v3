import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Clock3, Compass, Home, MapPin, Package, Search, ShoppingBag, Store, UserRound, UtensilsCrossed } from 'lucide-react';
import { supabase } from './lib/supabase';

type Tab = 'inicio' | 'descobrir' | 'pedidos' | 'perfil';
type Screen = 'splash' | 'welcome' | 'auth' | 'address' | 'app';
type Section = 'home' | 'comida' | 'compras' | 'lojas' | 'enviar';

type Business = { id: string; name: string; description?: string | null; marketplace_category?: string | null };
type Product = { id: string; name: string; description?: string | null; price: number; currency_code?: string | null };

const money = (value: number) => `${new Intl.NumberFormat('pt-AO').format(value)} Kz`;

export default function App() {
  const [screen, setScreen] = useState<Screen>('splash');
  const [tab, setTab] = useState<Tab>('inicio');
  const [section, setSection] = useState<Section>('home');
  const [phone, setPhone] = useState('+244 ');
  const [otp, setOtp] = useState('');
  const [authStep, setAuthStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [name, setName] = useState('');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [address, setAddress] = useState('Definir endereço');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) { setScreen('app'); void loadCustomer(data.session.user.id); }
    });
  }, []);

  async function loadCustomer(userId: string) {
    const [{ data: profile }, { data: shops }] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', userId).maybeSingle(),
      supabase.from('businesses').select('id,name,description,marketplace_category').eq('status', 'active').order('name').limit(30),
    ]);
    if (profile?.full_name) setName(profile.full_name.split(' ')[0]);
    setBusinesses((shops ?? []) as Business[]);
  }

  async function sendCode() {
    setBusy(true); setNotice('');
    const normalized = phone.replace(/\s+/g, '');
    const { error } = await supabase.auth.signInWithOtp({ phone: normalized });
    setBusy(false);
    if (error) { setNotice(error.message); return; }
    setAuthStep('otp'); setNotice('Enviámos um código para o teu número.');
  }

  async function verifyCode() {
    setBusy(true); setNotice('');
    const { data, error } = await supabase.auth.verifyOtp({ phone: phone.replace(/\s+/g, ''), token: otp.trim(), type: 'sms' });
    setBusy(false);
    if (error || !data.user) { setNotice(error?.message ?? 'Código inválido.'); return; }
    await loadCustomer(data.user.id); setScreen('address');
  }

  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0);
  const cartTotal = useMemo(() => products.reduce((sum, p) => sum + p.price * (cart[p.id] ?? 0), 0), [products, cart]);

  async function openBusiness(business: Business) {
    setSelectedBusiness(business); setNotice('');
    const { data, error } = await supabase.from('products').select('id,name,description,price,currency_code').eq('business_id', business.id).eq('status', 'active').order('sort_order');
    if (error) setNotice(error.message);
    setProducts((data ?? []) as Product[]); setSection('comida');
  }

  function addProduct(id: string) { setCart(c => ({ ...c, [id]: (c[id] ?? 0) + 1 })); }

  if (screen === 'splash') return <Splash onNext={() => setScreen('welcome')} />;
  if (screen === 'welcome') return <Welcome onEnter={() => setScreen('auth')} onGuest={() => setScreen('address')} />;
  if (screen === 'auth') return <Auth phone={phone} setPhone={setPhone} otp={otp} setOtp={setOtp} step={authStep} busy={busy} notice={notice} onSend={sendCode} onVerify={verifyCode} onBack={() => setAuthStep('phone')} />;
  if (screen === 'address') return <Address address={address} setAddress={setAddress} onContinue={() => setScreen('app')} />;

  return (
    <div className="app-shell">
      {section !== 'home' && section !== 'enviar' && selectedBusiness ? (
        <BusinessDetail business={selectedBusiness} products={products} cart={cart} cartCount={cartCount} cartTotal={cartTotal} onBack={() => { setSelectedBusiness(null); setSection('comida'); }} onAdd={addProduct} />
      ) : (
        <>
          {tab === 'inicio' && <HomeScreen name={name} address={address} businesses={businesses} onSection={setSection} onBusiness={openBusiness} />}
          {tab === 'descobrir' && <Discover />}
          {tab === 'pedidos' && <Orders />}
          {tab === 'perfil' && <Profile name={name} address={address} onLogout={async () => { await supabase.auth.signOut(); setScreen('welcome'); }} />}
          {section === 'enviar' && <Send onBack={() => setSection('home')} />}
          <BottomNav tab={tab} setTab={t => { setTab(t); setSection('home'); }} />
        </>
      )}
    </div>
  );
}

function Splash({ onNext }: { onNext: () => void }) { return <main className="splash"><div className="splash-center"><div><div className="splash-brand">Pedejá<span className="brand-purple-dot">.</span></div><p>A promessa que se move</p></div></div><button className="splash-next" onClick={onNext}>Próximo <ChevronRight size={19} /></button></main>; }
function Welcome({ onEnter, onGuest }: { onEnter: () => void; onGuest: () => void }) { return <main className="welcome"><div className="brand-lockup"><strong>Pedejá<span className="brand-purple-dot">.</span></strong><small>A promessa que se move</small></div><div className="welcome-copy"><span>ENTRE NO ECOSSISTEMA</span><h1>Tudo o que precisas,<br />a caminho de ti.</h1><p>Comida, compras, lojas e envios — numa só experiência.</p></div><div className="welcome-actions"><button className="primary" onClick={onEnter}>Entrar</button><button className="secondary" onClick={onEnter}>Criar conta</button><button className="text-button" onClick={onGuest}>Continuar como convidado</button></div></main>; }
function Auth({ phone, setPhone, otp, setOtp, step, busy, notice, onSend, onVerify, onBack }: { phone:string; setPhone:(v:string)=>void; otp:string; setOtp:(v:string)=>void; step:'phone'|'otp'; busy:boolean; notice:string; onSend:()=>void; onVerify:()=>void; onBack:()=>void }) { return <main className="auth-page"><button className="icon-button" onClick={onBack}><ArrowLeft /></button><div className="auth-copy"><span>PEDEJÁ</span><h1>{step === 'phone' ? 'Entra na tua conta.' : 'Confirma o teu número.'}</h1><p>{step === 'phone' ? 'Usa o teu número de Angola para continuar.' : `Código enviado para ${phone}`}</p></div>{step === 'phone' ? <input autoFocus value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+244 9xx xxx xxx" inputMode="tel" /> : <input autoFocus value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Código de 6 dígitos" inputMode="numeric" maxLength={6} />}{notice && <div className="notice">{notice}</div>}<button className="primary" disabled={busy} onClick={step === 'phone' ? onSend : onVerify}>{busy ? 'A processar…' : step === 'phone' ? 'Enviar código' : 'Confirmar'}</button></main>; }
function Address({ address, setAddress, onContinue }: { address:string; setAddress:(v:string)=>void; onContinue:()=>void }) { return <main className="address-page"><div className="address-icon"><MapPin /></div><span>ONDE ENTREGAMOS?</span><h1>Primeiro, diz-nos onde estás.</h1><p>A tua casa será o endereço principal. Podes adicionar outros depois.</p><label>Casa<input value={address === 'Definir endereço' ? '' : address} onChange={e=>setAddress(e.target.value)} placeholder="Ex.: Talatona, Luanda" /></label><button className="primary" onClick={onContinue}>Continuar</button><button className="text-button" onClick={onContinue}>Definir mais tarde</button></main>; }

function HomeScreen({ name, address, businesses, onSection, onBusiness }: { name:string; address:string; businesses:Business[]; onSection:(s:Section)=>void; onBusiness:(b:Business)=>void }) { const categories = [{id:'comida' as Section,label:'Comida',icon:UtensilsCrossed},{id:'compras' as Section,label:'Compras',icon:ShoppingBag},{id:'enviar' as Section,label:'Enviar',icon:Package},{id:'lojas' as Section,label:'Lojas',icon:Store}]; return <main className="screen home-screen"><header className="topbar"><div><small>ENTREGAR EM</small><button className="location"><MapPin size={15}/> {address}</button></div><div className="avatar">{name?.[0] ?? 'P'}</div></header><section className="home-heading"><p>Olá{name ? `, ${name}` : ''}.</p><h1>O que precisas hoje?</h1></section><div className="search"><Search size={19}/><span>Pesquisar comida, lojas ou produtos</span></div><section className="category-grid">{categories.map(c=>{const Icon=c.icon; return <button key={c.id} className="category" onClick={()=>onSection(c.id)}><span><Icon /></span><strong>{c.label}</strong></button>})}</section><div className="section-row"><h2>Perto de ti</h2><button>Ver tudo</button></div><div className="filter-row"><span className="filter active">Perto de ti</span><span className="filter">Mais pedidos</span><span className="filter">Promo</span><span className="filter">Aberto</span></div><section className="business-list">{businesses.slice(0,6).map(b=><button className="business-row" key={b.id} onClick={()=>onBusiness(b)}><div className="business-image"><UtensilsCrossed /></div><div><strong>{b.name}</strong><p>{b.description || 'Comida e entrega Pedejá'}</p><small><Clock3 size={13}/> 20–35 min · {b.marketplace_category || 'Comida'}</small></div><ChevronRight /></button>)}</section></main>; }

function BusinessDetail({ business, products, cart, cartCount, cartTotal, onBack, onAdd }: { business:Business; products:Product[]; cart:Record<string,number>; cartCount:number; cartTotal:number; onBack:()=>void; onAdd:(id:string)=>void }) { return <main className="screen detail-screen"><div className="detail-hero"><button className="icon-button light" onClick={onBack}><ArrowLeft /></button><div className="detail-image"><UtensilsCrossed size={42}/></div></div><section className="detail-content"><span className="eyebrow">{business.marketplace_category || 'COMIDA'}</span><h1>{business.name}</h1><p>{business.description || 'Escolhe os teus favoritos e recebe onde estiveres.'}</p><div className="detail-meta"><span>★ 4.8</span><span>20–35 min</span><span>Luanda</span></div><div className="menu-tabs"><b>Mais pedidos</b><span>Menu</span><span>Bebidas</span></div>{products.length === 0 ? <div className="empty"><h3>Catálogo em preparação</h3><p>Este parceiro ainda não tem produtos publicados.</p></div> : <div className="product-list">{products.map(p=><div className="product-row" key={p.id}><div><strong>{p.name}</strong><p>{p.description || 'Uma opção preparada com cuidado.'}</p><b>{money(p.price)}</b></div><button onClick={()=>onAdd(p.id)}>+</button></div>)}</div>}</section>{cartCount>0 && <button className="cart-bar"><span>{cartCount} {cartCount===1?'item':'itens'}</span><strong>Ver carrinho · {money(cartTotal)}</strong></button>}</main>; }
function Discover() { return <main className="screen simple-screen"><span className="eyebrow">DESCOBRIR</span><h1>Conhece a rede Pedejá.</h1><p>Um só lugar para pedir, enviar e fazer parte do ecossistema.</p>{[['Sobre o Pedejá','O que é Pedejá','A promessa que se move'],['Como funciona','Como pedir','Como enviar','Acompanhar pedido'],['Faz parte da rede','Tornar-se Estafeta','Tornar-se Parceiro','Registar negócio'],['Ajuda','Perguntas frequentes','Contactar suporte']].map(([title,...links])=><section className="link-section" key={title}><h2>{title}</h2>{links.map(l=><button key={l}>{l}<ChevronRight size={18}/></button>)}</section>)}</main>; }
function Orders() { return <main className="screen simple-screen"><span className="eyebrow">PEDIDOS</span><h1>Os teus pedidos.</h1><div className="segmented"><b>Ativos</b><span>Histórico</span></div><div className="empty large"><Package size={30}/><h3>Nenhum pedido ativo</h3><p>Quando fizeres um pedido, vais acompanhá-lo aqui em tempo real.</p></div></main>; }
function Profile({ name, address, onLogout }: { name:string; address:string; onLogout:()=>void }) { return <main className="screen simple-screen"><span className="eyebrow">PERFIL</span><div className="profile-head"><div className="profile-avatar">{name?.[0] ?? 'P'}</div><div><h1>{name || 'Cliente Pedejá'}</h1><p>+244 · Conta Pedejá</p></div></div>{[['Casa',address],['Pagamento','Numerário'],['Suporte','Falar com Pedejá'],['Sobre','Versão 1.0.0']].map(([a,b])=><button className="profile-row" key={a}><span><strong>{a}</strong><small>{b}</small></span><ChevronRight size={18}/></button>)}<button className="logout" onClick={onLogout}>Terminar sessão</button></main>; }
function Send({ onBack }: { onBack:()=>void }) { return <main className="screen send-screen"><button className="icon-button" onClick={onBack}><ArrowLeft /></button><span className="eyebrow">ENVIAR</span><h1>Envia o que precisares.</h1><p>Documentos, pequenas encomendas e pacotes, com acompanhamento Pedejá.</p>{['Documento','Pequena encomenda','Pacote','Outro'].map(x=><button className="send-option" key={x}><Package size={20}/><span>{x}</span><ChevronRight size={18}/></button>)}<div className="notice">O preço final será calculado pelo sistema no momento do pedido.</div></main>; }
function BottomNav({ tab, setTab }: { tab:Tab; setTab:(t:Tab)=>void }) { const items:[Tab,string,typeof Home][]=[['inicio','Início',Home],['descobrir','Descobrir',Compass],['pedidos','Pedidos',Package],['perfil','Perfil',UserRound]]; return <nav className="bottom-nav">{items.map(([id,label,Icon])=><button key={id} className={tab===id?'active':''} onClick={()=>setTab(id)}><Icon size={21}/><span>{label}</span></button>)}</nav>; }
