import { useEffect, useState } from 'react';
import { BottomNav, type Tab } from '@/components/BottomNav';
import { BottomSheet } from '@/components/BottomSheet';
import { AddressSheet } from '@/components/address/AddressSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { PersonalDataSheet } from '@/components/account/PersonalDataSheet';
import { PaymentsSheet } from '@/components/account/PaymentsSheet';
import { NotificationsSheet } from '@/components/account/NotificationsSheet';
import { AppearanceSheet } from '@/components/account/AppearanceSheet';
import { PermissionsSheet } from '@/components/account/PermissionsSheet';
import { DeleteAccountDialog } from '@/components/account/DeleteAccountDialog';
import { ToastHost } from '@/components/Toast';
import { showToast } from '@/components/toastStore';
import { SignInSheet } from '@/components/SignInSheet';
import { repositories } from '@/repositories';
import { isDemoModeEnabled, isSupabaseConfigured } from '@/services/supabase';
import { useAuth } from '@/auth/useAuth';
import { SessionGate } from '@/auth/SessionGate';
import { useResolvedDark } from '@/hooks/useAppearance';
import { HomeView } from '@/views/customer/HomeView';
import { MarketplaceView } from '@/views/customer/MarketplaceView';
import { ExploreView } from '@/views/customer/ExploreView';
import { BusinessRegisterView } from '@/views/customer/BusinessRegisterView';
import { EstafetaRegisterView } from '@/views/customer/EstafetaRegisterView';
import { LegalDocView } from '@/views/customer/LegalDocView';
import { OrdersView } from '@/views/customer/OrdersView';
import { ProfileView } from '@/views/customer/ProfileView';
import { SplashView } from '@/views/customer/SplashView';
import { WelcomeView } from '@/views/customer/WelcomeView';
import { ContentView } from '@/views/customer/ContentView';
import { BusinessView } from '@/views/customer/BusinessView';
import { CartView } from '@/views/customer/CartView';
import { CheckoutView } from '@/views/customer/CheckoutView';
import { CategoryView } from '@/views/customer/categories/CategoryView';
import { EnviarView } from '@/views/customer/enviar/EnviarView';
import { ParcelCreatedView } from '@/views/customer/enviar/ParcelCreatedView';
import { ParcelTrackingView } from '@/views/customer/enviar/ParcelTrackingView';
import { ProductionBackoffice } from '@/views/backoffice/ProductionBackoffice';

import type { Business, Category } from '@/types';

type CustomerScreen =
  | { name: 'splash' }
  | { name: 'welcome' }
  | { name: 'app' }
  | { name: 'marketplace' }
  | { name: 'category'; category: Category }
  | { name: 'enviar' }
  | { name: 'parcel-success'; orderId: string }
  | { name: 'parcel-tracking'; orderId: string }
  | { name: 'business'; business: Business; from: { type: 'marketplace' } | { type: 'category'; category: Category } | { type: 'app' } }
  | { name: 'cart' }
  | { name: 'checkout' }
  | { name: 'content'; topicKey: string }
  | { name: 'register-business' }
  | { name: 'register-estafeta' }
  | { name: 'legal'; docKey: string };

function openWhatsApp(text: string) {
  window.open(`https://wa.me/244900000000?text=${encodeURIComponent(text)}`, '_blank');
}

function CustomerApp() {
  const auth = useAuth();
  const [screen, setScreen] = useState<CustomerScreen>({ name: 'splash' });
  const [tab, setTab] = useState<Tab>('home');
  const [showAddress, setShowAddress] = useState(false);
  const [showAddressMode, setShowAddressMode] = useState<'picker' | 'manage'>('picker');
  const [showPersonal, setShowPersonal] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAppearance, setShowAppearance] = useState(false);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);
  const [authSheetMode, setAuthSheetMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [profileTick, setProfileTick] = useState(0);
  const [, bumpAppearance] = useState(0);
  const [dataStatus, setDataStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [dataError, setDataError] = useState<string | null>(null);
  const defaultAddress = repositories.location.getDefaultAddress();
  const appearanceMode = repositories.settings.getAppearance();
  const resolvedDark = useResolvedDark(appearanceMode);

  useEffect(() => {
    let alive = true;
    if (!isSupabaseConfigured() && !isDemoModeEnabled()) {
      setDataError('O Pedejá não conseguiu ligar ao serviço de dados. Configura o Supabase antes de usar a aplicação em produção.');
      setDataStatus('error');
      return () => { alive = false; };
    }
    if (isSupabaseConfigured() && !auth.user) {
      setDataStatus('ready');
      return () => { alive = false; };
    }
    setDataStatus('loading');
    setDataError(null);
    let attempt = 0;
    const initializeWithRetry = async () => {
      while (attempt < 2 && alive) {
        attempt += 1;
        try {
          await repositories.initialize();
          if (alive) setDataStatus('ready');
          return;
        } catch (error: unknown) {
          if (attempt >= 2 || !alive) {
            if (!alive) return;
            console.error('[Pedejá] Falha ao carregar dados', error);
            setDataError(error instanceof Error ? error.message : 'Não foi possível carregar os dados.');
            setDataStatus('error');
            return;
          }
          await new Promise((resolve) => window.setTimeout(resolve, 450));
        }
      }
    };
    void initializeWithRetry();
    return () => { alive = false; };
  }, [auth.user]);

  useEffect(() => {
    if (auth.status === 'authenticated') {
      setScreen((current) => (
        current.name === 'splash' || current.name === 'welcome'
          ? { name: 'app' }
          : current
      ));
    }
  }, [auth.status]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.appearance = resolvedDark ? 'dark' : 'light';
    return () => {
      delete root.dataset.appearance;
    };
  }, [resolvedDark]);

  if (dataStatus === 'loading') return <SessionGate />;
  if (dataStatus === 'error') return <SessionGate error={dataError ?? 'Não foi possível carregar os dados.'} onRetry={() => window.location.reload()} />;

  function navigateToApp() {
    setScreen({ name: 'app' });
    setTab('home');
  }

  function handleGuest() {
    if (!auth.isDemo && !auth.user) {
      setAuthSheetMode('sign-in');
      setShowSignIn(true);
      return;
    }
    navigateToApp();
  }

  function handleCategory(cat: Category) {
    if (cat === 'enviar') {
      if (!auth.user && !auth.isDemo) {
        setAuthSheetMode('sign-in');
        setShowSignIn(true);
        showToast('Entra para usar o Pedejá Enviar.');
        return;
      }
      setScreen({ name: 'enviar' });
    } else {
      setScreen({ name: 'category', category: cat });
    }
  }

  function handleBusiness(b: Business) {
    setScreen({
      name: 'business',
      business: b,
      from: screen.name === 'category'
        ? { type: 'category', category: screen.category }
        : { type: 'marketplace' },
    });
  }

  function openCheckout() {
    if (!auth.user) {
      setAuthSheetMode('sign-in');
      setShowSignIn(true);
      showToast('Entra para finalizar a compra.');
      return;
    }
    setScreen({ name: 'checkout' });
  }

  function confirmLogout() {
    setShowLogoutConfirm(false);
    void auth.signOut();
    setScreen({ name: 'welcome' });
    showToast('Sessão terminada.');
  }

  function handleAction(label: string, orderId?: string) {
    switch (label) {
      case 'logout':
        setShowLogoutConfirm(true);
        return;
      case 'support':
        openWhatsApp('Olá Pedejá! Preciso de ajuda.');
        return;
      case 'track':
        showToast('Encontra o mapa com a localização por cima. O estafeta está a caminho.');
        return;
      case 'trackParcel':
        if (orderId) {
          setScreen({ name: 'parcel-tracking', orderId });
        }
        return;
      case 'addresses':
        setShowAddressMode('manage');
        setShowAddress(true);
        return;
      case 'personal':
        setShowPersonal(true);
        return;
      case 'payments':
        setShowPayments(true);
        return;
      case 'notifications':
        setShowNotifications(true);
        return;
      case 'appearance':
        setShowAppearance(true);
        return;
      case 'permissions':
        setShowPermissions(true);
        return;
      case 'privacy':
        setScreen({ name: 'content', topicKey: 'Política de Privacidade' });
        return;
      case 'terms':
        setScreen({ name: 'content', topicKey: 'Termos de Uso' });
        return;
      case 'delete-account':
        setShowDelete(true);
        return;
      case 'share-and-earn':
      case 'share-app':
        if (navigator.share) {
          navigator.share({ title: 'Pedejá', text: 'A promessa que se move — pede e recebe com o Pedejá.' }).catch(() => {});
        } else {
          showToast('O Pedejá está disponível no teu navegador.');
        }
        return;
      default:
        showToast('Estamos a preparar isso. Em breve!');
        return;
    }
  }

  if (screen.name === 'splash') {
    return (
      <>
        <SplashView onNext={() => setScreen({ name: 'welcome' })} />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'welcome') {
    return (
      <>
        <WelcomeView
          onEnter={() => { setAuthSheetMode('sign-in'); setShowSignIn(true); }}
          onCreate={() => { setAuthSheetMode('sign-up'); setShowSignIn(true); }}
          onGuest={handleGuest}
          demoMode={auth.isDemo}
        />
        <BottomSheet
          open={showSignIn}
          onClose={() => setShowSignIn(false)}
          eyebrow="PEDEJÁ"
          title="Como queres começar?"
        >
          <SignInSheet
            key={authSheetMode}
            initialMode={authSheetMode}
            onClose={() => setShowSignIn(false)}
            onSuccess={navigateToApp}
          />
        </BottomSheet>
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'marketplace') {
    return (
      <>
        <MarketplaceView
          onBack={() => setScreen({ name: 'app' })}
          onBusiness={handleBusiness}
          onCategory={handleCategory}
          onCart={() => setScreen({ name: 'cart' })}
          signedIn={Boolean(auth.user || auth.isDemo)}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'category') {
    return (
      <>
        <CategoryView
          category={screen.category}
          onBack={() => setScreen({ name: 'app' })}
          onBusiness={handleBusiness}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'enviar') {
    return (
      <>
        <EnviarView
          onBack={() => setScreen({ name: 'app' })}
          onComplete={(orderId) => setScreen({ name: 'parcel-success', orderId })}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'parcel-success') {
    return (
      <>
        <ParcelCreatedView
          orderId={screen.orderId}
          onTrack={() => setScreen({ name: 'parcel-tracking', orderId: screen.orderId })}
          onDone={() => {
            setScreen({ name: 'app' });
            setTab('orders');
          }}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'parcel-tracking') {
    return (
      <>
        <ParcelTrackingView
          orderId={screen.orderId}
          onBack={() => {
            setScreen({ name: 'app' });
            setTab('orders');
          }}
          onCancelled={(orderId) => {
            setScreen({ name: 'parcel-tracking', orderId });
          }}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'business') {
    return (
      <>
        <BusinessView
          business={screen.business}
          onBack={() => {
            if (screen.from.type === 'marketplace') setScreen({ name: 'marketplace' });
            else if (screen.from.type === 'category') setScreen({ name: 'category', category: screen.from.category });
            else setScreen({ name: 'app' });
          }}
          onCart={() => setScreen({ name: 'cart' })}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'cart') {
    const cartBusiness = repositories.cart.getBusiness();
    return (
      <>
        <CartView
          business={cartBusiness}
          onBack={() =>
            cartBusiness
              ? setScreen({ name: 'business', business: cartBusiness, from: { type: 'app' } })
              : setScreen({ name: 'app' })
          }
          onCheckout={openCheckout}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'checkout') {
    const business = repositories.cart.getBusiness();
    return (
      <>
        <CheckoutView
          onBack={() =>
            business
              ? setScreen({ name: 'business', business, from: { type: 'app' } })
              : setScreen({ name: 'app' })
          }
          address={defaultAddress}
          onChangeAddress={() => {
            setShowAddressMode('picker');
            setShowAddress(true);
          }}
          onPlaced={(orderId) => {
            showToast(`Pedido ${orderId} confirmado.`);
            setScreen({ name: 'app' });
            setTab('orders');
          }}
        />
        <AddressSheet
          open={showAddress}
          onClose={() => setShowAddress(false)}
          onChanged={() => setProfileTick((value) => value + 1)}
          confirmLabel="Escolher"
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'content') {
    return (
      <>
        <ContentView
          topicKey={screen.topicKey}
          onBack={() => setScreen({ name: 'app' })}
          onSupport={() => openWhatsApp('Olá Pedejá! Quero falar com o suporte.')}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'register-business') {
    return (
      <>
        <BusinessRegisterView
          onBack={() => setScreen({ name: 'app' })}
          onSupport={() => openWhatsApp('Olá Pedejá! Quero registar o meu negócio.')}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'register-estafeta') {
    return (
      <>
        <EstafetaRegisterView
          onBack={() => setScreen({ name: 'app' })}
          onSupport={() => openWhatsApp('Olá Pedejá! Quero registar-me como Estafeta.')}
        />
        <ToastHost />
      </>
    );
  }

  if (screen.name === 'legal') {
    return (
      <>
        <LegalDocView
          docKey={screen.docKey}
          onBack={() => setScreen({ name: 'app' })}
          onSupport={() => openWhatsApp('Olá Pedejá! Tenho uma dúvida sobre documentos legais.')}
        />
        <ToastHost />
      </>
    );
  }

  return (
    <div className="app-shell">
      <div className="app-frame">
        {tab === 'home' && (
          <HomeView
            onAddress={() => {
              setShowAddressMode('picker');
              setShowAddress(true);
            }}
            onCategory={handleCategory}
            onMarketplace={() => setScreen({ name: 'marketplace' })}
            defaultAddress={defaultAddress}
          />
        )}
        {tab === 'explore' && (
          <ExploreView
            onRegisterBusiness={() => setScreen({ name: 'register-business' })}
            onRegisterEstafeta={() => setScreen({ name: 'register-estafeta' })}
            onOpenLegal={(docKey) => setScreen({ name: 'legal', docKey })}
          />
        )}
        {tab === 'orders' && <OrdersView onAction={handleAction} />}
        {tab === 'profile' && <ProfileView key={profileTick} onAction={handleAction} />}
      </div>
      <BottomNav tab={tab} onChange={setTab} badge={1} />
      <AddressSheet
        open={showAddress}
        onClose={() => setShowAddress(false)}
        onChanged={() => setProfileTick((value) => value + 1)}
        closeOnSelect={showAddressMode === 'picker'}
        confirmLabel={showAddressMode === 'picker' ? 'Confirmar localização' : 'Fechar'}
      />
      <PersonalDataSheet
        open={showPersonal}
        onClose={() => setShowPersonal(false)}
        onChanged={() => setProfileTick((t) => t + 1)}
        onSupport={() => openWhatsApp('Olá Pedejá! Quero atualizar os meus dados pessoais.')}
      />
      <PaymentsSheet open={showPayments} onClose={() => setShowPayments(false)} />
      <NotificationsSheet open={showNotifications} onClose={() => setShowNotifications(false)} />
      <AppearanceSheet open={showAppearance} onClose={() => setShowAppearance(false)} onChanged={() => bumpAppearance((t) => t + 1)} />
      <PermissionsSheet open={showPermissions} onClose={() => setShowPermissions(false)} />
      <DeleteAccountDialog open={showDelete} onClose={() => setShowDelete(false)} />
      <ConfirmDialog
        open={showLogoutConfirm}
        title="Terminar sessão?"
        message="Vais voltar ao início. Tens a certeza?"
        confirmLabel="Terminar sessão"
        tone="primary"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
      <ToastHost />
    </div>
  );
}

function App() {
  const auth = useAuth();
  const path = window.location.pathname.replace(/\/$/, '') || '/';
  // Backoffice aliases are intentionally supported so staff links/bookmarks remain forgiving.
  if (path === '/merchant' || path === '/merchants' || path === '/rider' || path === '/estafeta' || path === '/operations' || path === '/operation') {
    const surface = (path === '/merchant' || path === '/merchants') ? 'merchant' : (path === '/operations' || path === '/operation') ? 'operations' : 'rider';
    return <ProductionBackoffice surface={surface} />;
  }
  
  if (auth.status === 'loading') return <SessionGate />;
  if (auth.status === 'error') {
    return <SessionGate error={auth.error ?? 'Não foi possível verificar a sessão.'} onRetry={auth.retry} />;
  }
  
  return <CustomerApp />;
}

export default App;
