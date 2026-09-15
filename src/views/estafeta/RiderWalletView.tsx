import { useState } from 'react';
import {
  ArrowDownToLine,
  ArrowLeftRight,
  Banknote,
  Download,
  Undo2,
  Wallet,
} from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { showToast } from '@/components/toastStore';
import type {
  CashSettlementStatus,
  RiderRepository,
  WalletMovement,
  WalletMovementType,
} from '@/repositories/riderTypes';
import { formatKz } from '@/utils/format';

type Props = {
  riderRepo: RiderRepository;
};

type Period = 'today' | 'week' | 'month';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today', label: 'Hoje' },
  { id: 'week', label: 'Esta semana' },
  { id: 'month', label: 'Este mês' },
];

const MOVEMENT_LABELS: Record<WalletMovementType, string> = {
  earning: 'Ganho de entrega',
  adjustment: 'Ajuste',
  cancellation_compensation: 'Compensação por cancelamento',
  withdrawal: 'Levantamento',
};

const SETTLEMENT_LABELS: Record<CashSettlementStatus, string> = {
  pending: 'Pendente',
  in_reconciliation: 'Em reconciliação',
  settled: 'Pago',
  under_review: 'Em revisão',
  disputed: 'Em disputa',
};

function settlementChip(status: CashSettlementStatus) {
  const cls =
    status === 'settled'
      ? 'chip chip-success'
      : status === 'in_reconciliation'
        ? 'chip chip-purple'
        : 'chip chip-warn';
  return <span className={cls}>{SETTLEMENT_LABELS[status]}</span>;
}

function movementIcon(type: WalletMovementType) {
  switch (type) {
    case 'withdrawal':
      return <ArrowDownToLine size={15} />;
    case 'adjustment':
      return <ArrowLeftRight size={15} />;
    case 'cancellation_compensation':
      return <Undo2 size={15} />;
    default:
      return <Banknote size={15} />;
  }
}

export function RiderWalletView({ riderRepo }: Props) {
  const wallet = riderRepo.getWallet();
  const movements = riderRepo.getMovements();
  const stats = riderRepo.getStats();
  const [period, setPeriod] = useState<Period>('today');
  const [detail, setDetail] = useState<WalletMovement | null>(null);

  const seriesLabel = PERIODS.find((p) => p.id === period)!.label;
  const seriesAmount =
    period === 'today'
      ? wallet.todayEarnings
      : period === 'week'
        ? wallet.weekEarnings
        : wallet.monthEarnings;

  const exportCsv = () => {
    const rows = [
      ['Referência', 'Data', 'Tipo', 'Método de pagamento', 'Estado', 'Linha', 'Valor', 'Total'],
      ...movements.flatMap((m) =>
        (m.lines.length ? m.lines : [{ label: MOVEMENT_LABELS[m.type], amount: m.total }]).map(
          (line) => [
            m.reference,
            m.date,
            MOVEMENT_LABELS[m.type],
            m.paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa',
            m.cashSettlementStatus ? SETTLEMENT_LABELS[m.cashSettlementStatus] : '',
            line.label,
            String(line.amount),
            String(m.total),
          ],
        ),
      ),
    ];
    const content = rows
      .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([`\uFEFF${content}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `carteira-estafeta-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Carteira exportada em CSV.');
  };

  return (
    <main className="page rider-page inner-page">
      <header className="inner-header">
        <p className="eyebrow">CARTEIRA</p>
        <h1>Os teus ganhos.</h1>
        <p>Tudo o que ganhaste, transparente.</p>
      </header>

      <div className="rider-export-row">
        <button className="rider-export-btn" onClick={exportCsv}>
          <Download size={14} /> Exportar CSV
        </button>
      </div>

      <div className="rider-balance-hero">
        <Wallet size={28} />
        <div>
          <small>Saldo disponível</small>
          <strong>{formatKz(wallet.availableBalance)}</strong>
          <small>Ganhos prontos a usar na tua carteira Pedejá.</small>
        </div>
      </div>

      <div className="rider-segmented" role="tablist" aria-label="Período de ganhos">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            role="tab"
            aria-selected={period === p.id}
            className={period === p.id ? 'selected' : ''}
            onClick={() => setPeriod(p.id)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <section className="rider-wallet-period">
        <p className="eyebrow">GANHOS · {seriesLabel.toUpperCase()}</p>
        <div className="rider-wallet-period-card">
          <strong>{formatKz(seriesAmount)}</strong>
          <small>Ganhos brutos antes de taxas e acertos.</small>
        </div>
      </section>

      <section className="rider-stats-row">
        <div className="rider-stat-mini">
          <span className="rider-stat-mini-value">{stats.deliveriesCompleted}</span>
          <small>Entregas</small>
        </div>
        <div className="rider-stat-mini">
          <span className="rider-stat-mini-value">{formatKz(stats.avgPerDeliveryMoney.amount)}</span>
          <small>Média/entrega</small>
        </div>
        <div className="rider-stat-mini">
          <span className="rider-stat-mini-value">{stats.onTimePct}%</span>
          <small>Pontualidade</small>
        </div>
      </section>

      <section className="rider-settle-section">
        <p className="eyebrow">PENDENTES E PAGOS</p>
        <div className="rider-pay-grid">
          <div className="rider-pay-card pending">
            <strong>{formatKz(wallet.pendingAmount)}</strong>
            <small>Pendente</small>
            <span className="rider-pay-note">Dinheiro que cobraste e ainda não foi reconciliado.</span>
          </div>
          <div className="rider-pay-card paid">
            <strong>{formatKz(wallet.paidAmount)}</strong>
            <small>Pago</small>
            <span className="rider-pay-note">Ganhos já pagos pela Pedejá.</span>
          </div>
        </div>
        <div className="rider-cash-status">
          <span>Reconciliação de dinheiro: {SETTLEMENT_LABELS[wallet.cashSettlementStatus]}</span>
          {settlementChip(wallet.cashSettlementStatus)}
        </div>
      </section>

      <section className="rider-settle-section">
        <p className="eyebrow">LEVANTAMENTOS</p>
        <div className="rider-withdraw-note">
          <p>Os levantamentos estarão disponíveis quando esta funcionalidade estiver ativa.</p>
        </div>
      </section>

      <section className="rider-mov-section">
        <p className="eyebrow">MOVIMENTOS</p>
        <div className="rider-mov-list">
          {movements.map((m) => (
            <button key={m.id} className="rider-mov-row" onClick={() => setDetail(m)}>
              <span className={`rider-mov-icon ${m.type}`}>{movementIcon(m.type)}</span>
              <span className="rider-mov-info">
                <strong>{MOVEMENT_LABELS[m.type]}</strong>
                <small>
                  {m.reference} · {m.date}
                </small>
                {m.cashSettlementStatus && (
                  <span className="rider-mov-chip">{settlementChip(m.cashSettlementStatus)}</span>
                )}
              </span>
              <strong className="rider-mov-total">+{formatKz(m.total)}</strong>
            </button>
          ))}
        </div>
      </section>

      <BottomSheet
        open={!!detail}
        onClose={() => setDetail(null)}
        eyebrow="MOVIMENTO"
        title={detail ? detail.reference : ''}
      >
        {detail && (
          <div className="rider-mov-detail">
            <div className="rider-mov-detail-total">
              <strong>+{formatKz(detail.total)}</strong>
              <span>{MOVEMENT_LABELS[detail.type]}</span>
            </div>

            <div className="rider-earnings-list">
              {detail.lines.map((line) => (
                <div className="rider-earnings-row" key={line.label}>
                  <span>{line.label}</span>
                  <strong>{formatKz(line.amount)}</strong>
                </div>
              ))}
              <div className="rider-earnings-row total">
                <span>Total</span>
                <strong>{formatKz(detail.total)}</strong>
              </div>
            </div>

            <div className="rider-mov-detail-meta">
              <span>Método de pagamento</span>
              <strong>{detail.paymentMethod === 'cash' ? 'Dinheiro' : 'Multicaixa'}</strong>
            </div>
            {detail.cashSettlementStatus && (
              <div className="rider-mov-detail-meta">
                <span>Estado</span>
                {settlementChip(detail.cashSettlementStatus)}
              </div>
            )}
            <div className="rider-mov-detail-meta">
              <span>Data</span>
              <strong>{detail.date}</strong>
            </div>
          </div>
        )}
      </BottomSheet>

      <div className="bottom-space" />
    </main>
  );
}