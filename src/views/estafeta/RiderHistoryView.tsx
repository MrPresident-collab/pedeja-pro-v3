import { useState } from 'react';
import { MapPin, Package, ShoppingBag, Store, Utensils } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import type {
  CashSettlementStatus,
  DeliveryType,
  DriverHistoryItem,
  DriverHistoryStatus,
  RiderRepository,
} from '@/repositories/riderTypes';
import { formatKz } from '@/utils/format';

type Props = {
  riderRepo: RiderRepository;
};

type Filter = 'all' | DriverHistoryStatus;

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'completed', label: 'Concluídas' },
  { id: 'cancelled', label: 'Canceladas' },
  { id: 'failed', label: 'Falhadas' },
  { id: 'returned', label: 'Devolvidas' },
];

const STATUS_LABELS: Record<DriverHistoryStatus, string> = {
  completed: 'Concluída',
  cancelled: 'Cancelada',
  failed: 'Falhada',
  returned: 'Devolvida',
};

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  comida: 'Comida',
  compras: 'Compras',
  lojas: 'Lojas',
  enviar: 'Envio',
};

const SETTLEMENT_LABELS: Record<CashSettlementStatus, string> = {
  pending: 'Pendente',
  in_reconciliation: 'Em reconciliação',
  settled: 'Pago',
  under_review: 'Em revisão',
  disputed: 'Em disputa',
};

function typeIcon(type: DeliveryType) {
  switch (type) {
    case 'comida':
      return <Utensils size={11} />;
    case 'compras':
      return <ShoppingBag size={11} />;
    case 'lojas':
      return <Store size={11} />;
    default:
      return <Package size={11} />;
  }
}

function statusIcon(status: DriverHistoryStatus) {
  switch (status) {
    case 'completed':
      return <span>✓</span>;
    case 'cancelled':
      return <span>✕</span>;
    case 'failed':
      return <span>!</span>;
    default:
      return <span>↩</span>;
  }
}

function settlementChip(status: CashSettlementStatus) {
  const cls =
    status === 'settled'
      ? 'chip chip-success'
      : status === 'in_reconciliation'
        ? 'chip chip-purple'
        : 'chip chip-warn';
  return <span className={cls}>{SETTLEMENT_LABELS[status]}</span>;
}

export function RiderHistoryView({ riderRepo }: Props) {
  const all = riderRepo.getDriverHistory();
  const wallet = riderRepo.getWallet();
  const stats = riderRepo.getStats();
  const [filter, setFilter] = useState<Filter>('all');
  const [detail, setDetail] = useState<DriverHistoryItem | null>(null);

  const items = filter === 'all' ? all : all.filter((i) => i.status === filter);

  const statusChip = (status: DriverHistoryStatus) => {
    const cls =
      status === 'completed'
        ? 'chip chip-success'
        : status === 'cancelled'
          ? 'chip chip-warn'
          : status === 'failed'
            ? 'chip chip-warn'
            : 'chip chip-warn';
    return <span className={cls}>{STATUS_LABELS[status]}</span>;
  };

  return (
    <main className="page rider-page inner-page">
      <header className="inner-header">
        <p className="eyebrow">HISTÓRICO</p>
        <h1>Entregas recentes.</h1>
        <p>O teu histórico de trabalho no Pedejá.</p>
      </header>

      <section className="rider-monthly-summary">
        <p className="eyebrow">RESUMO DO MÊS</p>
        <div className="rider-summary-grid">
          <div className="rider-summary-item">
            <span className="rider-summary-value">{stats.monthDeliveries}</span>
            <small>Entregas</small>
          </div>
          <div className="rider-summary-item">
            <span className="rider-summary-value">{formatKz(wallet.monthEarnings)}</span>
            <small>Ganhos</small>
          </div>
          <div className="rider-summary-item">
            <span className="rider-summary-value">{formatKz(stats.avgPerDeliveryMoney.amount)}</span>
            <small>Média/entrega</small>
          </div>
          <div className="rider-summary-item">
            <span className="rider-summary-value">{stats.onTimePct}%</span>
            <small>Pontualidade</small>
          </div>
        </div>
      </section>

      <section className="rider-history-section">
        <div className="rider-history-filters">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              className={`filter-chip ${filter === f.id ? 'selected' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className="rider-history-list">
          {items.length === 0 && (
            <p className="rider-history-empty">Sem entregas com este estado.</p>
          )}
          {items.map((item) => (
            <button className="rider-history-item" key={item.id} onClick={() => setDetail(item)}>
              <div className="rider-history-left">
                <span className={`rider-history-status ${item.status}`}>{statusIcon(item.status)}</span>
              </div>
              <div className="rider-history-info">
                <strong>{item.deliveryLabel}</strong>
                <small>
                  {typeIcon(item.deliveryType)} {DELIVERY_LABELS[item.deliveryType]} ·{' '}
                  {item.paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa'}
                </small>
                <small className="rider-history-dest">
                  <MapPin size={11} /> {item.pickupLabel} → {item.destinationLabel}
                </small>
                {item.cashSettlementStatus && (
                  <span className="rider-mov-chip">{settlementChip(item.cashSettlementStatus)}</span>
                )}
              </div>
              <div className="rider-history-right">
                <strong>
                  {item.status === 'completed' ? formatKz(item.totalEarnings) : '—'}
                </strong>
                <small className="rider-history-date">{item.date}</small>
              </div>
            </button>
          ))}
        </div>
      </section>

      <BottomSheet
        open={!!detail}
        onClose={() => setDetail(null)}
        eyebrow="ENTREGA"
        title={detail ? detail.reference : ''}
      >
        {detail && (
          <div className="rider-mov-detail">
            <div className="rider-mov-detail-total">
              <strong>
                {detail.status === 'completed' ? formatKz(detail.totalEarnings) : '—'}
              </strong>
              <span>{STATUS_LABELS[detail.status]}</span>
            </div>

            <div className="rider-history-detail-types">
              <span className="rider-history-type-icon">{typeIcon(detail.deliveryType)}</span>
              <span>{detail.deliveryLabel}</span>
              {statusChip(detail.status)}
            </div>

            <div className="rider-mov-detail-meta">
              <span>Recolha</span>
              <strong>{detail.pickupLabel}</strong>
            </div>
            <div className="rider-mov-detail-meta">
              <span>Destino</span>
              <strong>{detail.destinationLabel}</strong>
            </div>
            <div className="rider-mov-detail-meta">
              <span>Veículo</span>
              <strong className="rider-cap">{detail.vehicleType}</strong>
            </div>
            <div className="rider-mov-detail-meta">
              <span>Método de pagamento</span>
              <strong>{detail.paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa'}</strong>
            </div>
            {detail.cashSettlementStatus && (
              <div className="rider-mov-detail-meta">
                <span>Estado do dinheiro</span>
                {settlementChip(detail.cashSettlementStatus)}
              </div>
            )}
            <div className="rider-mov-detail-meta">
              <span>Data</span>
              <strong>{detail.date}</strong>
            </div>

            {detail.status === 'completed' && (
              <div className="rider-earnings-list">
                <div className="rider-earnings-row total">
                  <span>Ganhos da entrega</span>
                  <strong>{formatKz(detail.totalEarnings)}</strong>
                </div>
              </div>
            )}
          </div>
        )}
      </BottomSheet>

      <div className="bottom-space" />
    </main>
  );
}