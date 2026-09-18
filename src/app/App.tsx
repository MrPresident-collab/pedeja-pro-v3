import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Compass, Home, MapPin, Package, Search, ShoppingBag, Store, UserRound, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listActiveBusinesses } from '../repositories/businessRepository';
import { createCustomerAddress, getDefaultCustomerAddress, type CustomerAddress } from '../repositories/customerAddressRepository';
import ComidaScreen from '../features/customer/comida/ComidaScreen';
import ComprasScreen from '../features/customer/compras/ComprasScreen';
import LojasScreen from '../features/customer/lojas/LojasScreen';
import EnviarEntryScreen from '../features/customer/enviar/EnviarEntryScreen';
import DiscoverScreen from '../features/customer/discover/DiscoverScreen';
import OrdersScreen from '../features/customer/orders/OrdersScreen';
import OrderDetailScreen from '../features/customer/orders/OrderDetailScreen';
import ProfileScreen from '../features/customer/profile/ProfileScreen';
import type { AppScreen, Business, CustomerSection, CustomerTab } from './app-types';
import './home.css';
import '../features/customer/compras/compras.css';
import '../features/customer/lojas/lojas.css';

const SPLASH_MS = 1400;
type CustomerView = 'home' | 'comida' | 'compras' | 'lojas' | 'enviar' | 'order-detail';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [tab, setTab] = useState<CustomerTab>('inicio');
  const [address, setAddress] = useState<CustomerAddress | null>(null);
  const [profileName, setProfileName] = useState('');
  const [returningSession, setReturningSession] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      const hasSession = Boolean(data.session);
      setReturningSession(hasSession);
      if (hasSession) {
        const [profileResult, addressResult] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('id', data.session?.user.id ?? '').maybeSingle(),
          getDefaultCustomerAddress().catch(() => null),
        ]);
        if (!active) return;
        setProfileName(profileResult.data?.full_name?.trim() ?? '');
        setAddress(addressResult);
      }
      window.setTimeout(() => { if (active) setScreen(hasSession ? 'customer' : 'welcome'); }, SPLASH_MS);
    });
    return () => { active = false; };
  }, []);

  if (screen === 'splash') return <Splash returningSession={returningSession} />;
  if (screen === 'welcome') return <Welcome onEnter={() => setScreen('auth')} onGuest={() => setScreen('address')} />;
  if (screen === 'auth') return <Auth onBack={() => setScreen('welcome')} onSuccess={async () => {
    const [profileResult, addressResult] = await Promise.all([
      supabase.from('profiles').select('full_name').eq('id', (await supabase.auth.getUser()).data.user?.id ?? '').maybeSingle(),
      getDefaultCustomerAddress().catch(() => null),
    ]);
    setProfileName(profileResult.data?.full_name?.trim() ?? '');
    setAddress(addressResult);
    setScreen('address');
  }} />;
  if (screen === 'address') return <Address existing={address} onSaved={saved => { setAddress(saved); setScreen('customer'); }} />;
  return <Customer
    tab={tab}
    onTabChange={setTab}
    address={address}
    profileName={profileName}
    onSignedOut={() => { setAddress(null); setProfileName(''); setTab('inicio'); setScreen('welcome'); }}
  />;
}

function Splash({ returningSession }: { returningSession: boolean }) {
  return <main className="splash" aria-label="Pedejá"><div className="splash-center"><div><div className="splash-brand">Pedejá<span className="brand-purple-dot">.</span></div><p>A promessa que se move</p>{returningSession && <small>A preparar a tua sessão…</small>}</div></div><div className="splash-next" aria-hidden="true">A carregar…</div></main>;
}

function Welcome({ onEnter, onGuest }: { onEnter: () => void; onGuest: () => void }) {
  return <main className="welcome"><div className="brand-lockup"><strong>Pedejá<span className="brand-purple-dot">.</span></strong><small>A promessa que se move</small></div><div className="welcome-copy"><span>ENTRA NO ECOSSISTEMA</span><h1>Tudo o que precisas,<br />a caminho de ti.</h1><p>Comida, compras, lojas e envios — numa só experiência.</p></div><div className="welcome-actions"><button className="primary" onClick={onEnter}>Entrar</button><button className="secondary" onClick={onEnter}>Criar conta</button><button className="text-button" onClick={onGuest}>Continuar como convidado</button></div></main>;
}

function Auth({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => Promise<void> }) {
  const [phone, setPhone] = useState('+244 ');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function sendCode() {
    setBusy(true); setNotice('');
    const { error } = await supabase.auth.signInWithOtp({ phone: phone.replace(/\s+/g, '') });
    setBusy(false);
    if (error) return setNotice(error.message);
    setStep('otp'); setNotice('Enviámos um código para o teu número.');
  }

  async function verifyCode() {
    setBusy(true); setNotice('');
    const { data, error } = await supabase.auth.verifyOtp({ phone: phone.replace(/\s+/g, ''), token: otp.trim(), type: 'sms' });
    setBusy(false);
    if (error || !data.user) return setNotice(error?.message ?? 'Código inválido.');
    await onSuccess();
  }

  return <main className="auth-page"><button className="icon-button" onClick={step === 'otp' ? () => setStep('phone') : onBack} aria-label="Voltar">←</button><div className="auth-copy"><span>PEDEJÁ</span><h1>{step === 'phone' ? 'Entra na tua conta.' : 'Confirma o teu número.'}</h1><p>{step === 'phone' ? 'Usa o teu número de Angola para continuar.' : `Código enviado para ${phone}`}</p></div>{step === 'phone' ? <input autoFocus value={phone} onChange={event => setPhone(event.target.value)} placeholder="+244 9xx xxx xxx" inputMode="tel" /> : <input autoFocus value={otp} onChange={event => setOtp(event.target.value)} placeholder="Código de 6 dígitos" inputMode="numeric" maxLength={6} />}{notice && <div className="notice">{notice}</div>}<button className="primary" disabled={busy} onClick={step === 'phone' ? sendCode : verifyCode}>{busy ? 'A processar…' : step === 'phone' ? 'Enviar código' : 'Confirmar'}</button></main>;
}

function Address({ existing, onSaved }: { existing: CustomerAddress | null; onSaved: (address: CustomerAddress | null) => void }) {
  const [addressLine1, setAddressLine1] = useState(existing?.addressLine1 ?? '');
  const [neighborhood, setNeighborhood] = useState(existing?.neighborhood ?? '');
  const [municipality, setMunicipality] = useState(existing?.municipality ?? '');
  const [city, setCity] = useState(existing?.city ?? '');
  const [province, setProvince] = useState(existing?.province ?? '');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  async function save() {
    if (!addressLine1.trim() || !city.trim() || !province.trim() || busy) return;
    setBusy(true); setNotice('');
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        onSaved(existing);
        return;
      }
      if (existing) {
        onSaved(existing);
        return;
      }
      if (!navigator.geolocation) throw new Error('GEOLOCATION_UNAVAILABLE');
      const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 }));
      const id = await createCustomerAddress({
        label: 'Casa',
        addressLine1: addressLine1.trim(),
        neighborhood: neighborhood.trim(),
        municipality: municipality.trim(),
        city: city.trim(),
        province: province.trim(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      const created = await getDefaultCustomerAddress();
      if (!created || created.addressId !== id) throw new Error('ADDRESS_READBACK_FAILED');
      onSaved(created);
    } catch (err) {
      console.error('Failed to save customer address', err);
      setNotice('Não foi possível guardar a morada. Confirma os dados e permite a localização do dispositivo.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="address-page"><div className="address-icon"><MapPin /></div><span>ONDE ENTREGAMOS?</span><h1>A tua morada principal.</h1><p>Precisamos da morada e da localização do dispositivo para criar entregas reais.</p><label>Morada<input value={addressLine1} onChange={event => setAddressLine1(event.target.value)} placeholder="Rua, número, casa ou referência" /></label><label>Bairro<input value={neighborhood} onChange={event => setNeighborhood(event.target.value)} placeholder="Bairro" /></label><label>Município<input value={municipality} onChange={event => setMunicipality(event.target.value)} placeholder="Município" /></label><label>Cidade<input value={city} onChange={event => setCity(event.target.value)} placeholder="Cidade" /></label><label>Província<input value={province} onChange={event => setProvince(event.target.value)} placeholder="Província" /></label>{notice && <div className="notice">{notice}</div>}<button className="primary" disabled={busy || !addressLine1.trim() || !city.trim() || !province.trim()} onClick={() => void save()}>{busy ? 'A guardar…' : existing ? 'Continuar' : 'Guardar morada'}</button><button className="text-button" onClick={() => onSaved(existing)}>Continuar sem morada</button></main>;
}

function Customer({ tab, onTabChange, address, profileName, onSignedOut }: { tab: CustomerTab; onTabChange: (tab: CustomerTab) => void; address: CustomerAddress | null; profileName: string; onSignedOut: () => void }) {
  const [view, setView] = useState<CustomerView>('home');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const goHome = () => { setSelectedOrderId(null); setView('home'); };
  const changeTab = (next: CustomerTab) => { onTabChange(next); setSelectedOrderId(null); setView('home'); };
  const selectSection = (section: CustomerSection) => setView(section === 'comida' ? 'comida' : section === 'compras' ? 'compras' : section === 'lojas' ? 'lojas' : section === 'enviar' ? 'enviar' : 'home');
  const openOrder = (orderId: string) => { setSelectedOrderId(orderId); setView('order-detail'); };
  const addressLabel = address ? [address.addressLine1, address.neighborhood, address.municipality, address.city].filter(Boolean).join(', ') : '';
  const handleOrderCreated = (orderId: string) => openOrder(orderId);

  if (view === 'order-detail' && selectedOrderId) return <div className="app-shell"><OrderDetailScreen orderId={selectedOrderId} onBack={() => { setSelectedOrderId(null); setView('home'); onTabChange('pedidos'); }} /><BottomNav tab="pedidos" onChange={changeTab} /></div>;
  if (view === 'comida') return <div className="app-shell"><ComidaScreen onBack={goHome} address={addressLabel} addressId={address?.addressId ?? null} onOrderCreated={handleOrderCreated} /><BottomNav tab={tab} onChange={changeTab} /></div>;
  if (view === 'compras') return <div className="app-shell"><ComprasScreen onBack={goHome} /><BottomNav tab={tab} onChange={changeTab} /></div>;
  if (view === 'lojas') return <div className="app-shell"><LojasScreen onBack={goHome} /><BottomNav tab={tab} onChange={changeTab} /></div>;
  if (view === 'enviar') return <div className="app-shell"><EnviarEntryScreen onBack={goHome} /><BottomNav tab={tab} onChange={changeTab} /></div>;
  if (tab === 'descobrir') return <div className="app-shell"><DiscoverScreen /><BottomNav tab={tab} onChange={changeTab} /></div>;
  if (tab === 'pedidos') return <div className="app-shell"><OrdersScreen onOpenOrder={openOrder} /><BottomNav tab={tab} onChange={changeTab} /></div>;
  if (tab === 'perfil') return <div className="app-shell"><ProfileScreen onSignOut={() => { void supabase.auth.signOut().then(onSignedOut); }} /><BottomNav tab={tab} onChange={changeTab} /></div>;
  return <div className="app-shell"><HomeScreen address={addressLabel} profileName={profileName} onSection={selectSection} /><BottomNav tab={tab} onChange={changeTab} /></div>;
}

function HomeScreen({ address, profileName, onSection }: { address: string; profileName: string; onSection: (section: CustomerSection) => void }) {
  const [section, setSection] = useState<CustomerSection>('home');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void listActiveBusinesses().then(setBusinesses).catch(() => setBusinesses([])).finally(() => setLoading(false)); }, []);
  const experiences: Array<{ id: CustomerSection; label: string; image: string; Icon: typeof UtensilsCrossed }> = [{ id: 'comida', label: 'Comida', image: '/comida.png', Icon: UtensilsCrossed }, { id: 'compras', label: 'Compras', image: '/compras.png', Icon: ShoppingBag }, { id: 'enviar', label: 'Enviar', image: '/enviar.png', Icon: Package }, { id: 'lojas', label: 'Lojas', image: '/lojas.png', Icon: Store }];
  return <main className="screen home-screen"><header className="topbar"><div className="home-avatar" aria-label="Perfil"><UserRound size={19} /></div><button className="home-address"><MapPin size={15} />{address || 'Selecionar morada'}<ChevronDown size={16} /></button></header><section className="home-heading"><p>{profileName ? `Olá, ${profileName} 👋` : 'Olá 👋'}</p><h1>O que precisas hoje?</h1></section><div className="search"><Search size={19} /><span>Pesquisar comida, lojas ou produtos</span></div><section className="experience-grid" aria-label="Experiências Pedejá">{experiences.map(({ id, label, image, Icon }) => <button className="experience-card" key={id} onClick={() => { setSection(id); onSection(id); }}><img src={image} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /><span className="experience-fallback"><Icon size={28} /></span><strong>{label}</strong></button>)}</section><div className="filter-row" aria-label="Filtros"><button className="filter active">Perto de ti</button><button className="filter">Mais pedidos</button><button className="filter">Promo</button><button className="filter">Aberto</button><button className="filter">&lt;20 min</button></div><div className="section-row"><h2>{section === 'home' ? 'Perto de ti' : experiences.find(item => item.id === section)?.label}</h2><button>Ver tudo</button></div><section className="business-list">{loading ? <div className="home-loading">A carregar opções perto de ti…</div> : businesses.length === 0 ? <div className="home-empty">Ainda não há parceiros disponíveis na tua zona.</div> : businesses.slice(0, 8).map(business => <button className="business-row" key={business.id}><div className="business-image"><Store size={22} /></div><div><strong>{business.name}</strong><p>{business.description || 'Parceiro Pedejá'}</p><small><MapPin size={12} /> Disponível na tua zona</small></div><ChevronRight size={18} /></button>)}</section></main>;
}

function BottomNav({ tab, onChange }: { tab: CustomerTab; onChange: (tab: CustomerTab) => void }) {
  const items = [['inicio', Home], ['descobrir', Compass], ['pedidos', Package], ['perfil', UserRound] ] as const;
  const labels: Record<CustomerTab, string> = { inicio: 'Início', descobrir: 'Descobrir', pedidos: 'Pedidos', perfil: 'Perfil' };
  return <nav className="bottom-nav" aria-label="Navegação principal">{items.map(([id, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => onChange(id)} aria-current={tab === id ? 'page' : undefined}><Icon size={21} /><span>{labels[id]}</span></button>)}</nav>;
}
