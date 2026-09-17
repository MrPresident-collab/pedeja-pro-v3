import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Bike, Car, Check, Clock3, MapPin, MessageCircle, Navigation, Phone, Share2 } from 'lucide-react';
import { getEnviarTracking, subscribeToEnviarTracking, type EnviarTracking } from '../../../repositories/enviarTrackingRepository';
import './tracking.css';

type TrackingScreenProps = {
  shipmentId: string;
  onBack: () => void;
};

const STATUS_STEPS = [
  { key: 'CONFIRMED', label: 'Pedido confirmado' },
  { key: 'ASSIGNED', label: 'Estafeta a caminho' },
  { key: 'PICKUP_PENDING', label: 'A recolher' },
  { key: 'PICKED_UP', label: 'Encomenda recolhida' },
  { key: 'IN_TRANSIT', label: 'Estafeta a caminho' },
  { key: 'ARRIVED_DESTINATION', label: 'Chegou ao destino' },
  { key: 'DELIVERED', label: 'Entregue' },
] as const;

function statusIndex(status: string) {
  const index = STATUS_STEPS.findIndex(step => step.key === status);
  if (index >= 0) return index;
  if (status === 'REQUESTED' || status === 'PAYMENT_PENDING') return 0;
  return 0;
}

function formatMinutes(expectedDeliveryAt: string | null) {
  if (!expectedDeliveryAt) return null;
  const diff = Math.max(0, Math.round((new Date(expectedDeliveryAt).getTime() - Date.now()) / 60000));
  return `${diff} min`;
}

function formatDistance(distanceKm: number | null) {
  if (distanceKm == null || Number.isNaN(distanceKm)) return null;
  return distanceKm < 1 ? `${Math.round(distanceKm * 1000)} m` : `${distanceKm.toFixed(1)} km`;
}

function getVehicleLabel(tracking: EnviarTracking) {
  const name = [tracking.vehicleMake, tracking.vehicleModel].filter(Boolean).join(' ');
  return name || null;
}

export default function TrackingScreen({ shipmentId, onBack }: TrackingScreenProps) {
  const [tracking, setTracking] = useState<EnviarTracking | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const next = await getEnviarTracking(shipmentId);
        if (active) setTracking(next);
      } catch (error) {
        if (active) setNotice(error instanceof Error ? error.message : 'Não foi possível carregar o acompanhamento.');
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();
    const unsubscribe = subscribeToEnviarTracking(shipmentId, () => void load());
    return () => {
      active = false;
      unsubscribe();
    };
  }, [shipmentId]);

  const currentIndex = statusIndex(tracking?.status ?? 'CONFIRMED');
  const eta = formatMinutes(tracking?.expectedDeliveryAt ?? null);
  const distance = formatDistance(tracking?.distanceKm ?? null);
  const vehicle = tracking ? getVehicleLabel(tracking) : null;
  const isDelivered = tracking?.status === 'DELIVERED';
  const canContactRider = Boolean(tracking?.riderPhone);
  const trackingUrl = useMemo(() => `${window.location.origin}/?tracking=${encodeURIComponent(shipmentId)}`, [shipmentId]);

  const shareTracking = async () => {
    setNotice('');
    const shareData = { title: 'Acompanhar pedido Pedejá', text: 'Acompanha este envio Pedejá em tempo real.', url: trackingUrl };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(trackingUrl);
      setNotice('Link de acompanhamento copiado.');
    } catch {
      // Share sheets can be dismissed by the user; do not surface an error for that action.
    }
  };

  const callRider = () => {
    if (tracking?.riderPhone) window.location.href = `tel:${tracking.riderPhone}`;
  };

  const messageRider = () => {
    if (tracking?.riderPhone) window.location.href = `sms:${tracking.riderPhone}`;
  };

  if (loading) {
    return <main className="screen tracking-screen"><header className="tracking-header"><button onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button><strong>Acompanhar pedido</strong></header><div className="tracking-state">A carregar o acompanhamento…</div></main>;
  }

  if (!tracking) {
    return <main className="screen tracking-screen"><header className="tracking-header"><button onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button><strong>Acompanhar pedido</strong></header><div className="tracking-state"><strong>Envio não encontrado.</strong><p>O acompanhamento só aparece para um envio existente na tua conta.</p></div></main>;
  }

  return (
    <main className="screen tracking-screen">
      <header className="tracking-header">
        <button onClick={onBack} aria-label="Voltar"><ArrowLeft size={21} /></button>
        <div><span>ENVIAR</span><strong>#{shipmentId.slice(0, 8).toUpperCase()}</strong></div>
        <button className="tracking-share-icon" onClick={shareTracking} aria-label="Partilhar acompanhamento"><Share2 size={19} /></button>
      </header>

      <section className="tracking-content">
        <div className="tracking-map" aria-label="Mapa de acompanhamento">
          <div className="map-grid" />
          {tracking.riderLocation ? <div className="map-live-marker"><Bike size={20} /></div> : <div className="map-no-location"><Navigation size={18} /><span>A localização do estafeta ficará disponível quando começar a ser transmitida.</span></div>}
          <div className="map-badge"><MapPin size={14} /> Acompanhamento Pedejá</div>
        </div>

        <div className="tracking-metrics">
          <div><Clock3 size={18} /><strong>{eta ?? '—'}</strong><span>tempo estimado</span></div>
          <div><Navigation size={18} /><strong>{distance ?? '—'}</strong><span>distância</span></div>
        </div>

        <section className="status-card" aria-label="Estado do envio">
          <div className="status-title"><strong>{STATUS_STEPS[currentIndex]?.label ?? 'A acompanhar'}</strong><span>{tracking.status}</span></div>
          <div className="status-timeline">
            {STATUS_STEPS.map((step, index) => {
              const complete = index <= currentIndex;
              const active = index === currentIndex;
              return <div className={`status-step ${complete ? 'complete' : ''} ${active ? 'active' : ''}`} key={step.key}><div className="status-dot">{complete && !active ? <Check size={12} /> : null}</div><span>{step.label}</span></div>;
            })}
          </div>
        </section>

        <section className="rider-card">
          <div className="rider-avatar"><Bike size={24} /></div>
          <div className="rider-info"><span>ESTAFETA</span><strong>{tracking.riderName ?? 'Aguardando estafeta'}</strong>{vehicle ? <p><Car size={14} /> {vehicle}{tracking.vehicleRegistration ? ` · ${tracking.vehicleRegistration}` : ''}</p> : <p>Os dados da viatura aparecerão quando forem atribuídos.</p>}</div>
        </section>

        {canContactRider && <div className="tracking-actions"><button onClick={callRider}><Phone size={18} />Ligar</button><button onClick={messageRider}><MessageCircle size={18} />Mensagem</button></div>}

        <button className="share-tracking-button" onClick={shareTracking}><Share2 size={18} /><span><strong>Partilhar acompanhamento</strong><small>Envia um link para acompanhar este pedido.</small></span></button>

        {tracking.status === 'ARRIVED_DESTINATION' && <div className="secret-code-banner"><strong>Entrega chegou</strong><p>Dá o código secreto de 5 dígitos ao estafeta para concluir a entrega.</p></div>}
        {isDelivered && <section className="rating-card"><span>Avalia o teu estafeta</span><div aria-label="Avaliação">☆ ☆ ☆ ☆ ☆</div></section>}
        {notice && <div className="tracking-notice">{notice}</div>}
      </section>
    </main>
  );
}
