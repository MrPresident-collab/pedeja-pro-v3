import { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Compass, Home, MapPin, Package, Search, ShoppingBag, Store, UserRound, UtensilsCrossed } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { listActiveBusinesses } from '../repositories/businessRepository';
import ComidaScreen from '../features/customer/comida/ComidaScreen';
import ComprasScreen from '../features/customer/compras/ComprasScreen';
import LojasScreen from '../features/customer/lojas/LojasScreen';
import EnviarScreen from '../features/customer/enviar/EnviarScreen';
import type { AppScreen, Business, CustomerSection, CustomerTab } from './app-types';
import './home.css';
import '../features/customer/compras/compras.css';
import '../features/customer/lojas/lojas.css';

const SPLASH_MS = 1400;

type CustomerView = 'home' | 'comida' | 'compras' | 'lojas' | 'enviar';

export default function App() {
  const [screen, setScreen] = useState<AppScreen>('splash');
  const [tab, setTab] = useState<CustomerTab>('inicio');
  const [address, setAddress] = useState('');
  const [returningSession, setReturningSession] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setReturningSession(Boolean(data.session));
      window.setTimeout(() => {
        if (active) setScreen(data.session ? 'customer' : 'welcome');
      }, SPLASH_MS);
    });
    return () => { active = false; };
  }, []);

  if (screen === 'splash') return <Splash returningSession={returningSession} />;
  if (screen === 'welcome') return <Welcome onEnter={() => setScreen('auth')} onGuest={() => setScreen('address')} />;
  if (screen === 'auth') return <Auth onBack={() => setScreen('welcome')} onSuccess={() => setScreen('address')} />;
  if (screen === 'address') return <Address address={address} onChange={setAddress} onContinue={() => setScreen('customer')} />;
  return <Customer tab={tab} onTabChange={setTab} address={address || 'Casa'} />;
}

function Splash({ returningSession }: { returningSession: boolean }) {
  return <main className="splash" aria-label="Pedejá"><div className="splash-center"><div><div className="splash-brand">Pedejá<span className="brand-purple-dot">.</span></div><p>A promessa que se move</p>{returningSession && <small>A preparar a tua sessão…</small>}</div></div><div className="splash-next" aria-hidden="true">A carregar…</div></main>;
}

function Welcome({ onEnter, onGuest }: { onEnter: () => void; onGuest: () => void }) {
  return <main className="welcome"><div className="brand-lockup"><strong>Pedejá<span className="brand-purple-dot">.</span></strong><small>A promessa que se move</small></div><div className="welcome-copy"><span>ENTRA NO ECOSSISTEMA</span><h1>Tudo o que precisas,<br />a caminho de ti.</h1><p>Comida, compras, lojas e envios — numa só experiência.</p></div><div className="welcome-actions"><button className="primary" onClick={onEnter}>Entrar</button><button className="secondary" onClick={onEnter}>Criar conta</button><button className="text-button" onClick={onGuest}>Continuar como convidado</button></div></main>;
}

function Auth({ onBack, onSuccess }: { onBack: () => void; onSuccess: () => void }) {
  const [phone, setPhone] = useState('+244 ');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  async function sendCode() { setBusy(true); setNotice(''); const { error } = await supabase.auth.signInWithOtp({ phone: phone.replace(/\s+/g, '') }); setBusy(false); if (error) return setNotice(error.message); setStep('otp'); setNotice('Enviámos um código para o teu número.'); }
  async function verifyCode() { setBusy(true); setNotice(''); const { data, error } = await supabase.auth.verifyOtp({ phone: phone.replace(/\s+/g, ''), token: otp.trim(), type: 'sms' }); setBusy(false); if (error || !data.user) return setNotice(error?.message ?? 'Código inválido.'); onSuccess(); }
  return <main className="auth-page"><button className="icon-button" onClick={step === 'otp' ? () => setStep('phone') : onBack} aria-label="Voltar">←</button><div className="auth-copy"><span>PEDEJÁ</span><h1>{step === 'phone' ? 'Entra na tua conta.' : 'Confirma o teu número.'}</h1><p>{step === 'phone' ? 'Usa o teu número de Angola para continuar.' : `Código enviado para ${phone}`}</p></div>{step === 'phone' ? <input autoFocus value={phone} onChange={event => setPhone(event.target.value)} placeholder="+244 9xx xxx xxx" inputMode="tel" /> : <input autoFocus value={otp} onChange={event => setOtp(event.target.value)} placeholder="Código de 6 dígitos" inputMode="numeric" maxLength={6} />}{notice && <div className="notice">{notice}</div>}<button className="primary" disabled={busy} onClick={step === 'phone' ? sendCode : verifyCode}>{busy ? 'A processar…' : step === 'phone' ? 'Enviar código' : 'Confirmar'}</button></main>;
}

function Address({ address, onChange, onContinue }: { address: string; onChange: (value: string) => void; onContinue: () => void }) {
  return <main className="address-page"><div className="address-icon"><MapPin /></div><span>ONDE ENTREGAMOS?</span><h1>Primeiro, diz-nos onde estás.</h1><p>A tua casa será o endereço principal. Podes adicionar outros depois.</p><label>Casa<input value={address} onChange={event => onChange(event.target.value)} placeholder="Ex.: Talatona, Luanda" /></label><button className="primary" onClick={onContinue}>Continuar</button><button className="text-button" onClick={onContinue}>Definir mais tarde</button></main>;
}

function Customer({ tab, onTabChange, address }: { tab: CustomerTab; onTabChange: (tab: CustomerTab) => void; address: string }) {
  const [view, setView] = useState<CustomerView>('home');
  const goHome = () => setView('home');
  const selectSection = (section: CustomerSection) => {
    if (section === 'comida') setView('comida');
    if (section === 'compras') setView('compras');
    if (section === 'lojas') setView('lojas');
    if (section === 'enviar') setView('enviar');
  };

  if (view === 'comida') return <div className="app-shell"><ComidaScreen onBack={goHome} /><BottomNav tab={tab} onChange={onTabChange} /></div>;
  if (view === 'compras') return <div className="app-shell"><ComprasScreen onBack={goHome} /><BottomNav tab={tab} onChange={onTabChange} /></div>;
  if (view === 'lojas') return <div className="app-shell"><LojasScreen onBack={goHome} /><BottomNav tab={tab} onChange={onTabChange} /></div>;
  if (view === 'enviar') return <div className="app-shell"><EnviarScreen onBack={goHome} /><BottomNav tab={tab} onChange={onTabChange} /></div>;

  return <div className="app-shell">{tab === 'inicio' ? <HomeScreen address={address} onSection={selectSection} /> : <SimpleScreen tab={tab} />}<BottomNav tab={tab} onChange={onTabChange} /></div>;
}

function HomeScreen({ address, onSection }: { address: string; onSection: (section: CustomerSection) => void }) {
  const [section, setSection] = useState<CustomerSection>('home');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void listActiveBusinesses().then(setBusinesses).catch(() => setBusinesses([])).finally(() => setLoading(false)); }, []);
  const experiences: Array<{ id: CustomerSection; label: string; image: string; Icon: typeof UtensilsCrossed }> = [
    { id: 'comida', label: 'Comida', image: '/comida.png', Icon: UtensilsCrossed },
    { id: 'compras', label: 'Compras', image: '/compras.png', Icon: ShoppingBag },
    { id: 'enviar', label: 'Enviar', image: '/enviar.png', Icon: Package },
    { id: 'lojas', label: 'Lojas', image: '/lojas.png', Icon: Store },
  ];
  return <main className="screen home-screen"><header className="topbar"><div className="home-avatar" aria-label="Perfil"><UserRound size={19} /></div><button className="home-address"><MapPin size={15} />{address}<ChevronDown size={16} /></button></header><section className="home-heading"><p>Olá, Daniel 👋</p><h1>O que precisas hoje?</h1></section><div className="search"><Search size={19} /><span>Pesquisar comida, lojas ou produtos</span></div><section className="experience-grid" aria-label="Experiências Pedejá">{experiences.map(({ id, label, image, Icon }) => <button className="experience-card" key={id} onClick={() => { setSection(id); onSection(id); }}><img src={image} alt="" onError={event => { event.currentTarget.style.display = 'none'; }} /><span className="experience-fallback"><Icon size={28} /></span><strong>{label}</strong></button>)}</section><div className="filter-row" aria-label="Filtros"><button className="filter active">Perto de ti</button><button className="filter">Mais pedidos</button><button className="filter">Promo</button><button className="filter">Aberto</button><button className="filter">&lt;20 min</button></div><div className="section-row"><h2>{section === 'home' ? 'Perto de ti' : experiences.find(item => item.id === section)?.label}</h2><button>Ver tudo</button></div><section className="business-list">{loading ? <div className="home-loading">A carregar opções perto de ti…</div> : businesses.length === 0 ? <div className="home-empty">Ainda estamos a preparar parceiros perto de ti.</div> : businesses.slice(0, 8).map(business => <button className="business-row" key={business.id}><div className="business-image"><Store size={22} /></div><div><strong>{business.name}</strong><p>{business.description || 'Comida, compras e entrega Pedejá'}</p><small><MapPin size={12} /> Perto de ti · 20–35 min</small></div><ChevronRight size={18} /></button>)}</section></main>;
}

function SimpleScreen({ tab }: { tab: CustomerTab }) { const labels: Record<CustomerTab, string> = { inicio: 'Início', descobrir: 'Descobrir', pedidos: 'Pedidos', perfil: 'Perfil' }; return <main className="screen simple-screen"><span className="eyebrow">{labels[tab].toUpperCase()}</span><h1>{labels[tab]}</h1><p>Esta área será construída nas próximas etapas do rebuild.</p></main>; }

function BottomNav({ tab, onChange }: { tab: CustomerTab; onChange: (tab: CustomerTab) => void }) { const items = [['inicio', Home], ['descobrir', Compass], ['pedidos', Package], ['perfil', UserRound] ] as const; const labels: Record<CustomerTab, string> = { inicio: 'Início', descobrir: 'Descobrir', pedidos: 'Pedidos', perfil: 'Perfil' }; return <nav className="bottom-nav" aria-label="Navegação principal">{items.map(([id, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => onChange(id)} aria-current={tab === id ? 'page' : undefined}><Icon size={21} /><span>{labels[id]}</span></button>)}</nav>; }
