import { useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Clock3,
  DollarSign,
  MapPin,
  MessageCircle,
  Navigation,
  Package,
  Phone,
  ReceiptText,
  ScrollText,
  ShoppingBag,
  Store,
  Timer,
  Utensils,
  BadgeInfo,
  HelpCircle,
} from 'lucide-react';
import { BrandMark } from '@/components/BrandMark';
import { showToast } from '@/components/toastStore';
import type {
  RiderRepository,
  DriverDeliveryStage,
  DriverVehicleType,
  DeliveryOffer,
  ActiveDeliveryState,
  DeliveryType,
} from '@/repositories/riderTypes';
import { FOOD_SHOPPING_STAGES } from '@/repositories/riderTypes';
import { formatKz } from '@/utils/format';

type Props = {
  riderRepo: RiderRepository;
  onChat: (name: string) => void;
  onSupport: () => void;
};

const stageLabels: Record<DriverDeliveryStage, string> = {
  heading_to_pickup: 'A caminho da recolha',
  arrived_at_pickup: 'Cheguei à recolha',
  waiting_for_preparation: 'A aguardar preparação',
  ready_for_pickup: 'Pedido pronto',
  picked_up: 'Pedido recolhido',
  heading_to_destination: 'A caminho do destino',
  arrived_at_destination: 'Cheguei ao destino',
  confirming_delivery: 'Confirmar entrega',
  completed: 'Entrega concluída',
};

const stageCta: Partial<Record<DriverDeliveryStage, string>> = {
  heading_to_pickup: 'Cheguei à recolha',
  arrived_at_pickup: 'Aguardar pedido',
  waiting_for_preparation: 'Marcar pedido pronto',
  ready_for_pickup: 'Recolher pedido',
  picked_up: 'A caminho do destino',
  heading_to_destination: 'Cheguei ao destino',
  arrived_at_destination: 'Confirmar entrega',
  confirming_delivery: 'Concluir entrega',
};

const deliveryTypeLabels: Record<DeliveryType, string> = {
  comida: 'Comida',
  compras: 'Compras',
  lojas: 'Lojas',
  enviar: 'Enviar',
};

const deliveryTypeHint: Record<DeliveryType, string> = {
  comida: 'Refeição para entrega',
  compras: 'Compras do dia a dia',
  lojas: 'Recolha numa loja',
  enviar: 'Envio de encomenda',
};

const vehicleLabels: Record<DriverVehicleType, string> = {
  mota: 'Mota',
  triciclo: 'Triciclo',
  carro: 'Carro',
  carrinha: 'Carrinha',
};

const packageSizeLabels: Record<string, string> = {
  pequeno: 'Pequeno',
  medio: 'Médio',
  grande: 'Grande',
};

type UiState =
  | { kind: 'unavailable'; reason: 'rejected' | 'suspended' }
  | { kind: 'not_approved'; step: 'pending_documents' | 'pending_review' }
  | { kind: 'incomplete' }
  | { kind: 'offline' }
  | { kind: 'searching' }
  | { kind: 'offer'; offer: DeliveryOffer }
  | { kind: 'delivery' }
  | { kind: 'completed' };

function resolveUiState(repo: RiderRepository): UiState {
  const approval = repo.getApprovalStatus();
  if (approval === 'rejected') return { kind: 'unavailable', reason: 'rejected' };
  if (approval === 'suspended') return { kind: 'unavailable', reason: 'suspended' };
  if (approval === 'pending_documents' || approval === 'pending_review') {
    return { kind: 'not_approved', step: approval };
  }
  if (!repo.isProfileComplete()) return { kind: 'incomplete' };

  const active = repo.getActiveDeliveryState();
  if (active) {
    return active.stage === 'completed' ? { kind: 'completed' } : { kind: 'delivery' };
  }

  const offer = repo.getCurrentOffer();
  if (offer) return { kind: 'offer', offer };

  const availability = repo.getAvailabilityStatus();
  if (availability === 'online_searching' || repo.isOnline()) return { kind: 'searching' };

  return { kind: 'offline' };
}

export function RiderHomeView({ riderRepo, onChat, onSupport }: Props) {
  const ui = resolveUiState(riderRepo);
  const stats = riderRepo.getStats();
  const profile = riderRepo.getProfile();
  const activeVehicle = profile.vehicles.find((v) => v.id === profile.activeVehicleId);

  function callPhone(phone: string) {
    window.location.href = `tel:${phone.replace(/[\s+]/g, '')}`;
  }

  return (
    <main className="rider-home">
      <header className="rider-topbar">
        <div className="rider-topbar-left">
          <div className="rider-logo-small">
            <BrandMark className="logo-sm" />
          </div>
          <div className="rider-balance">
            <small>Ganhos de hoje</small>
            <strong>{formatKz(stats.todayEarnings)}</strong>
          </div>
        </div>
        {ui.kind === 'offline' && (
          <button className="rider-toggle" onClick={() => riderRepo.setOnline(true)}>
            <span className="rider-toggle-dot" />
            Ficar online
          </button>
        )}
        {ui.kind === 'searching' && (
          <button className="rider-toggle online" onClick={() => riderRepo.setOnline(false)}>
            <span className="rider-toggle-dot" />
            Online
          </button>
        )}
        {ui.kind === 'offer' && (
          <button className="rider-toggle online" onClick={() => riderRepo.setOnline(false)}>
            <span className="rider-toggle-dot" />
            Online
          </button>
        )}
        {(ui.kind === 'delivery' || ui.kind === 'completed') && (
          <span className="rider-status-chip rider-status-delivery">
            <span className="rider-toggle-dot" />
            Em entrega
          </span>
        )}
        {ui.kind !== 'offline' &&
          ui.kind !== 'searching' &&
          ui.kind !== 'offer' &&
          ui.kind !== 'delivery' &&
          ui.kind !== 'completed' && (
            <span className="rider-status-chip">
              <span className="rider-toggle-dot" />
              Pendente
            </span>
          )}
      </header>

      {ui.kind === 'unavailable' && (
        <UnavailableState reason={ui.reason} onSupport={onSupport} />
      )}
      {ui.kind === 'not_approved' && (
        <NotApprovedState step={ui.step} profile={profile} onSupport={onSupport} />
      )}
      {ui.kind === 'incomplete' && (
        <IncompleteState profile={profile} onSupport={onSupport} />
      )}
      {ui.kind === 'offline' && (
        <OfflineState
          stats={stats}
          vehicleLabel={activeVehicle?.label ?? profile.vehicleLabel}
          onGoOnline={() => riderRepo.setOnline(true)}
        />
      )}
      {ui.kind === 'searching' && <SearchingState />}
      {ui.kind === 'offer' && (
        <OfferCard
          offer={ui.offer}
          riderRepo={riderRepo}
          onAccept={() => riderRepo.acceptOffer(ui.offer.id)}
          onDecline={() => riderRepo.declineOffer(ui.offer.id)}
        />
      )}
      {ui.kind === 'delivery' && (
        <ActiveDeliveryPanel
          delivery={riderRepo.getActiveDeliveryState()!}
          onAdvance={() => riderRepo.advanceStage()}
          onCall={() => riderRepo.getActiveDeliveryState()!.customerPhone}
          onCallPhone={callPhone}
          onChat={onChat}
          onSupport={onSupport}
        />
      )}
      {ui.kind === 'completed' && <CompletedState delivery={riderRepo.getActiveDeliveryState()} />}

      <div className="bottom-space" />
    </main>
  );
}

function MapBackdrop({ active }: { active: boolean }) {
  return (
    <div className={`rider-map-fill ${active ? 'rider-map-online' : 'rider-map-offline'}`}>
      <div className="rider-map-grid" />
      <div className="rider-map-hub hub-a">
        <span className="rider-hub-dot" />
        <span className="rider-hub-label">Zona ativa · Miramar</span>
      </div>
      <div className="rider-map-hub hub-b">
        <span className="rider-hub-dot" />
        <span className="rider-hub-label">Alta procura</span>
      </div>
      <div className="rider-search-radius">
        <div className="rider-radar-ring" />
        <div className="rider-radar-ring ring-2" />
        <div className="rider-radar-ring ring-3" />
      </div>
      <div className="rider-pulse" />
      <MapPin size={26} className="rider-map-pin" />
      <span className="rider-map-label">Tu</span>
    </div>
  );
}

function UnavailableState({ reason, onSupport }: { reason: 'rejected' | 'suspended'; onSupport: () => void }) {
  return (
    <div className="rider-state-screen">
      <MapBackdrop active={false} />
      <div className="rider-state-panel">
        <span className="rider-state-icon blocked">
          <BadgeInfo size={22} />
        </span>
        <h2>{reason === 'suspended' ? 'Conta suspensa' : 'Conta rejeitada'}</h2>
        <p>
          {reason === 'suspended'
            ? 'A tua conta está atualmente suspensa. Não podes receber entregas até o estado ser resolvido.'
            : 'Não foi possível validar o teu registo. Não podes ficar online com uma conta rejeitada.'}
        </p>
        <button className="btn-secondary" onClick={onSupport}>
          <HelpCircle size={16} /> Contactar o suporte
        </button>
      </div>
    </div>
  );
}

function NotApprovedState({
  step,
  profile,
  onSupport,
}: {
  step: 'pending_documents' | 'pending_review';
  profile: ReturnType<RiderRepository['getProfile']>;
  onSupport: () => void;
}) {
  const pendingDocs = profile.documents.filter((d) => d.status !== 'approved');
  return (
    <div className="rider-state-screen">
      <MapBackdrop active={false} />
      <div className="rider-state-panel">
        <span className="rider-state-icon">
          <ScrollText size={22} />
        </span>
        <h2>A tua conta está em análise</h2>
        <p>
          {step === 'pending_documents'
            ? 'Ainda faltam documentos para poderes entregar. Conclui o teu registo para ficares online.'
            : 'Os teus dados estão a ser verificados pela equipa Pedejá. Assim que for aprovada, podes ficar online.'}
        </p>
        {step === 'pending_documents' && pendingDocs.length > 0 && (
          <div className="rider-pending-docs">
            {(pendingDocs.slice(0, 3)).map((d) => (
              <span className="rider-doc-chip" key={d.kind}>
                {d.label}
              </span>
            ))}
          </div>
        )}
        <button className="btn-primary" onClick={onSupport}>
          <HelpCircle size={16} /> Falar com o suporte
        </button>
      </div>
    </div>
  );
}

function IncompleteState({
  profile,
  onSupport,
}: {
  profile: ReturnType<RiderRepository['getProfile']>;
  onSupport: () => void;
}) {
  const activeVehicle = profile.vehicles.find((v) => v.id === profile.activeVehicleId);
  const vehicleOk = activeVehicle?.verificationStatus === 'approved';
  return (
    <div className="rider-state-screen">
      <MapBackdrop active={false} />
      <div className="rider-state-panel">
        <span className="rider-state-icon">
          <BadgeInfo size={22} />
        </span>
        <h2>Falta pouco para entregares</h2>
        <p>A tua conta está aprovada, mas ainda não está completa para ficares online.</p>
        <div className="rider-check-list">
          {vehicleOk ? (
            <span className="rider-check-item done">
              <Check size={14} /> Veículo aprovado
            </span>
          ) : (
            <span className="rider-check-item">
              <Check size={14} /> Ter um veículo aprovado
            </span>
          )}
          <span className="rider-check-item done">
            <Check size={14} /> Documentos válidos
          </span>
          <span className="rider-check-item">
            <Check size={14} /> Perfil completo
          </span>
        </div>
        <button className="btn-primary" onClick={onSupport}>
          <HelpCircle size={16} /> Preciso de ajuda
        </button>
      </div>
    </div>
  );
}

function OfflineState({
  stats,
  vehicleLabel,
  onGoOnline,
}: {
  stats: ReturnType<RiderRepository['getStats']>;
  vehicleLabel: string;
  onGoOnline: () => void;
}) {
  return (
    <>
      <MapBackdrop active={false} />
      <div className="rider-offline-panel">
        <div className="rider-offline-stats">
          <div className="rider-stat-card">
            <span className="rider-stat-value">{formatKz(stats.todayEarnings)}</span>
            <small>Ganhos de hoje</small>
          </div>
          <div className="rider-stat-card">
            <span className="rider-stat-value">{stats.deliveriesCompleted}</span>
            <small>Entregas</small>
          </div>
          <div className="rider-stat-card">
            <span className="rider-stat-value">{stats.onTimePct}%</span>
            <small>Pontualidade</small>
          </div>
        </div>
        <button className="btn-primary rider-go-online" onClick={onGoOnline}>
          Ficar online
        </button>
        <p className="rider-offline-hint">
          Entregas com: <strong>{vehicleLabel}</strong>. Ao ficares online recebes corridas na tua zona.
        </p>
      </div>
    </>
  );
}

function SearchingState() {
  return (
    <div className="rider-online-area">
      <MapBackdrop active />
      <div className="rider-empty-radar">
        <p>A procurar entregas perto de ti...</p>
      </div>
    </div>
  );
}

function OfferCard({
  offer,
  riderRepo,
  onAccept,
  onDecline,
}: {
  offer: DeliveryOffer;
  riderRepo: RiderRepository;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const [remaining, setRemaining] = useState(offer.remainingSeconds);
  const totalTimeout = Math.max(offer.remainingSeconds, 15);

  useEffect(() => {
    const interval = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(interval);
          riderRepo.expireOffer(offer.id);
          return 0;
        }
        return r - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [offer.id, riderRepo]);

  const pct = (remaining / totalTimeout) * 100;
  const TypeIcon =
    offer.deliveryType === 'comida'
      ? Utensils
      : offer.deliveryType === 'compras'
        ? ShoppingBag
        : offer.deliveryType === 'lojas'
          ? Store
          : Package;

  return (
    <div className="rider-request-card">
      <div className="rider-request-header">
        <span className="rider-request-badge">CORRIDA DISPONÍVEL</span>
        <span className="rider-request-timer">{remaining}s</span>
      </div>
      <div className="rider-request-timer-bar">
        <span style={{ width: `${pct}%` }} />
      </div>

      <div className="rider-offer-type">
        <span className="rider-offer-type-icon"><TypeIcon size={15} /></span>
        <span>
          <strong>{deliveryTypeLabels[offer.deliveryType]}</strong>
          <small>{deliveryTypeHint[offer.deliveryType]}</small>
        </span>
      </div>

      <div className="rider-request-route">
        <div className="rider-route-point">
          <Store size={14} />
          <div>
            <strong>{offer.pickupLabel}</strong>
            <small>{offer.pickupAddress}</small>
          </div>
        </div>
        <div className="rider-route-line" />
        <div className="rider-route-point">
          <MapPin size={14} fill="currentColor" />
          <div>
            <strong>{offer.destinationArea}</strong>
            <small>{offer.destinationAddress}</small>
          </div>
        </div>
      </div>

      <div className="rider-request-meta">
        <span>{offer.distanceLabel}</span>
        <span>{offer.durationLabel}</span>
        <span>
          Veículo: <strong>{vehicleLabels[offer.vehicleRequired]}</strong>
        </span>
      </div>

      {offer.deliveryType === 'enviar' && offer.packageSize && (
        <div className="rider-offer-line">
          <Package size={14} />
          <span>Tamanho da encomenda: <strong>{packageSizeLabels[offer.packageSize] ?? offer.packageSize}</strong></span>
        </div>
      )}

      <div className="rider-offer-earnings">
        <span className="rider-offer-earnings-title">Ganhos estimados</span>
        <div className="rider-offer-earnings-lines">
          <span>Base <strong>{formatKz(offer.baseEarnings)}</strong></span>
          {offer.bonus > 0 && <span>Bónus <strong>{formatKz(offer.bonus)}</strong></span>}
          {offer.tip > 0 && <span>Gorjeta <strong>{formatKz(offer.tip)}</strong></span>}
        </div>
        <div className="rider-offer-total">
          <span>Total</span>
          <strong>{formatKz(offer.totalEarnings)}</strong>
        </div>
      </div>

      <div className="rider-offer-payment">
        <ReceiptText size={14} />
        <span>
          Pagamento: <strong>{offer.paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa'}</strong>
        </span>
      </div>

      {offer.paymentMethod === 'cash' && offer.cashToCollect !== undefined && (
        <div className="rider-offer-cash">
          <DollarSign size={15} />
          <div>
            <strong>Cobrar ao cliente: {formatKz(offer.cashToCollect)}</strong>
            <small>Este valor pertence ao pedido e deve ser devolvido à Pedejá durante a liquidação.</small>
          </div>
        </div>
      )}

      {offer.instructions && (
        <p className="rider-request-instructions">Instruções: {offer.instructions}</p>
      )}

      <div className="rider-offer-actions">
        <button className="btn-primary rider-accept-btn" onClick={onAccept}>
          Aceitar
        </button>
        <button className="rider-decline-btn" onClick={onDecline}>
          Recusar
        </button>
      </div>
    </div>
  );
}

function MacroProgress({ stage }: { stage: DriverDeliveryStage }) {
  const idx = FOOD_SHOPPING_STAGES.indexOf(stage);
  const phase = idx >= 7 ? 2 : idx >= 4 ? 1 : 0;
  return (
    <div className="rider-macro-progress">
      {['Recolha', 'Em viagem', 'Entrega'].map((label, i) => (
        <div key={label} className={`rider-macro-step ${phase === i ? 'current' : ''} ${phase > i ? 'done' : ''}`}>
          <span className="rider-macro-dot" />
          <span>{label}</span>
        </div>
      ))}
    </div>
  );
}

function ActiveDeliveryPanel({
  delivery,
  onAdvance,
  onCall,
  onCallPhone,
  onChat,
  onSupport,
}: {
  delivery: ActiveDeliveryState;
  onAdvance: () => void;
  onCall: () => string;
  onCallPhone: (phone: string) => void;
  onChat: (name: string) => void;
  onSupport: () => void;
}) {
  const [showStages, setShowStages] = useState(false);
  const stageIdx = FOOD_SHOPPING_STAGES.indexOf(delivery.stage);
  const cta = stageCta[delivery.stage];
  const TypeIcon =
    delivery.deliveryType === 'comida'
      ? Utensils
      : delivery.deliveryType === 'compras'
        ? ShoppingBag
        : delivery.deliveryType === 'lojas'
          ? Store
          : Package;

  return (
    <div className="rider-active-sheet">
      <div className="rider-sheet-handle" />

      <div className="rider-sheet-header">
        <span className="rider-sheet-badge">EM ENTREGA</span>
        <span className="rider-sheet-id">{delivery.orderId}</span>
        <span className="rider-sheet-type"><TypeIcon size={14} /> {deliveryTypeLabels[delivery.deliveryType]}</span>
      </div>

      <MacroProgress stage={delivery.stage} />

      <div className="rider-current-stage">
        <span className="rider-current-stage-icon"><Timer size={16} /></span>
        <div>
          <strong>{stageLabels[delivery.stage]}</strong>
          <small>Etapa {stageIdx + 1} de {FOOD_SHOPPING_STAGES.length}</small>
        </div>
        <span className="rider-stage-track"><span style={{ width: `${((stageIdx + 1) / FOOD_SHOPPING_STAGES.length) * 100}%` }} /></span>
      </div>

      <div className="rider-delivery-info">
        <div className="rider-delivery-route">
          <div className="rider-route-point">
            <Store size={14} />
            <div>
              <strong>{delivery.pickupLabel}</strong>
              <small>{delivery.pickupAddress}</small>
            </div>
          </div>
          <div className="rider-route-line" />
          <div className="rider-route-point">
            <MapPin size={14} fill="currentColor" />
            <div>
              <strong>{delivery.destinationLabel}</strong>
              <small>{delivery.destinationAddress}</small>
            </div>
          </div>
        </div>

        <div className="rider-delivery-meta">
          <span><Navigation size={13} /> {delivery.distanceLabel}</span>
          <span><Clock3 size={13} /> {delivery.durationLabel}</span>
          <strong>{formatKz(delivery.totalEarnings)}</strong>
        </div>

        {delivery.instructions && (
          <div className="rider-delivery-instructions">
            <small>Instruções: {delivery.instructions}</small>
          </div>
        )}

        {delivery.paymentMethod === 'cash' ? (
          <div className="rider-delivery-cash">
            <div>
              <strong>Pagamento: Dinheiro</strong>
              <small>{delivery.cashToCollect !== undefined ? `Cobrar ao cliente: ${formatKz(delivery.cashToCollect)}` : 'Sem recolha de dinheiro'}</small>
            </div>
            {delivery.stage === 'confirming_delivery' && delivery.cashToCollect !== undefined && (
              <span className="rider-cash-note">Confirma o recebimento de {formatKz(delivery.cashToCollect)} do cliente.</span>
            )}
          </div>
        ) : (
          <div className="rider-delivery-cash multicaixa">
            <strong>Pagamento: Multicaixa</strong>
            <small>Sem recolha de dinheiro</small>
          </div>
        )}
      </div>

      <button className="rider-stage-toggle" onClick={() => setShowStages((s) => !s)}>
        <ScrollText size={14} /> {showStages ? 'Ocultar etapas' : 'Ver etapas'}
      </button>
      {showStages && (
        <div className="rider-stage-list">
          {FOOD_SHOPPING_STAGES.map((s, i) => (
            <div key={s} className={`rider-stage-item ${i < stageIdx ? 'done' : ''} ${i === stageIdx ? 'current' : ''}`}>
              {i < stageIdx ? <Check size={13} /> : i === stageIdx ? <CheckCircle2 size={13} /> : <span className="rider-stage-idx">{i + 1}</span>}
              <span>{stageLabels[s]}</span>
            </div>
          ))}
        </div>
      )}

      <div className="rider-delivery-actions">
        {cta && (
          <button className="btn-primary" onClick={onAdvance}>
            {cta}
          </button>
        )}
        <div className="rider-action-row">
          <button className="rider-action-btn" onClick={() => showToast('A abrir navegação...')}>
            <Navigation size={16} /> Navegar
          </button>
          <button className="rider-action-btn" onClick={() => onCallPhone(onCall())}>
            <Phone size={16} /> Ligar
          </button>
          <button className="rider-action-btn" onClick={() => onChat(delivery.customerName)}>
            <MessageCircle size={16} /> Mensagem
          </button>
          <button className="rider-action-btn" onClick={onSupport}>
            <HelpCircle size={16} /> Suporte
          </button>
        </div>
      </div>
    </div>
  );
}

function CompletedState({ delivery }: { delivery: ActiveDeliveryState | null }) {
  return (
    <div className="rider-completed-screen">
      <div className="rider-map-fill rider-map-offline">
        <div className="rider-map-grid" />
      </div>
      <div className="rider-completed-panel">
        <span className="rider-completed-icon"><Check size={26} /></span>
        <h2>Entrega concluída</h2>
        <p>{delivery ? `Recebeste ${formatKz(delivery.totalEarnings)} por esta corrida.` : 'Recebeste os ganhos por esta corrida.'}</p>
        {delivery?.paymentMethod === 'cash' && delivery.cashToCollect !== undefined && (
          <p className="rider-completed-cash">
            O valor em dinheiro ({formatKz(delivery.cashToCollect)}) fica em liquidação na tua carteira.
          </p>
        )}
        <span className="rider-completed-hint">A voltar a procurar entregas...</span>
      </div>
    </div>
  );
}