import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, Clock3, Package, ShoppingBag, Star, Truck, UtensilsCrossed } from 'lucide-react';
import { getCustomerOrdersHistory, type CustomerOrderHistory } from '../../../repositories/customerOrdersRepository';

type OrderKind = 'comida' | 'loja' | 'enviar';
const icons = { comida: UtensilsCrossed, loja: ShoppingBag, enviar: Package };

function formatDate(value: string | null) {
  if (!value) return 'Data não disponível';
  return new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
}
function formatMoney(value: number, currencyCode: string) {
  return new Intl.NumberFormat('pt-AO', { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value) + (currencyCode === 'AOA' ? ' Kz' : ` ${currencyCode}`);
}
function statusLabel(status: string) {
  const labels: Record<string, string> = { PENDING: 'Pendente', CONFIRMED: 'Confirmado', ACCEPTED: 'Aceite', PREPARING: 'A preparar', READY: 'Pronto', PICKUP_PENDING: 'A aguardar recolha', PICKED_UP: 'Recolhido', IN_TRANSIT: 'Em entrega', DELIVERED: 'Entregue', CANCELLED: 'Cancelado', FAILED: 'Falhou' };
  return labels[status] ?? status.replaceAll('_', ' ');
}
function orderKind(order: CustomerOrderHistory): OrderKind {
  const category = order.businessCategory.toLowerCase();
  return category.includes('restaurant') || category.includes('food') || category.includes('comida') ? 'comida' : 'loja';
}

function OrderCard({ order, onOpen }: { order: CustomerOrderHistory; onOpen: () => void }) {
  const kind = orderKind(order);
  const Icon = icons[kind];
  const delivered = order.status === 'DELIVERED' || order.deliveredAt !== null;
  const vehicle = [order.vehicleMake, order.vehicleModel].filter(Boolean).join(' ');

  return <button type="button" className="order-history-card order-history-card-button" onClick={onOpen} aria-label={`Abrir pedido ${order.orderReference}`}>
    <div className="order-history-card-top">
      <div className="order-history-icon"><Icon size={19} /></div>
      <div className="order-history-main"><strong>{order.businessName}</strong><span>{order.orderReference}</span></div>
      <span className={`order-status order-status-${order.status.toLowerCase()}`}>{statusLabel(order.status)}</span>
    </div>
    <div className="order-history-meta"><span>{formatDate(order.placedAt)}</span><strong>{formatMoney(order.totalAmount, order.currencyCode)}</strong></div>
    {delivered && <div className="order-history-delivery"><div><Clock3 size={15} /><span>{order.durationMinutes != null ? `${order.durationMinutes} min` : 'Duração indisponível'}</span></div><div><Truck size={15} /><span>{order.riderName ? `Estafeta: ${order.riderName}` : 'Estafeta indisponível'}</span></div>{vehicle && <div><span>{vehicle}</span></div>}</div>}
    <div className="order-history-footer"><span>{order.paymentMethod ? `Pagamento: ${order.paymentMethod}` : 'Pagamento registado'}</span><ChevronRight size={18} /></div>
  </button>;
}

export default function OrdersScreen({ onBack, onOpenOrder }: { onBack?: () => void; onOpenOrder: (orderId: string) => void }) {
  const [filter, setFilter] = useState<'ativos' | 'agendados' | 'historico'>('ativos');
  const [orders, setOrders] = useState<CustomerOrderHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const labels = { ativos: 'Ativos', agendados: 'Agendados', historico: 'Histórico' };

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError(null);
      try { const data = await getCustomerOrdersHistory(); if (mounted) setOrders(data); }
      catch (err) { console.error('Failed to load customer order history', err); if (mounted) setError('Não foi possível carregar os teus pedidos. Tenta novamente.'); }
      finally { if (mounted) setLoading(false); }
    }
    void load();
    return () => { mounted = false; };
  }, []);

  const visibleOrders = useMemo(() => {
    if (filter === 'historico') return orders.filter(order => ['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status));
    if (filter === 'agendados') return [];
    return orders.filter(order => !['DELIVERED', 'CANCELLED', 'FAILED'].includes(order.status));
  }, [filter, orders]);

  return <main className="screen orders-screen">
    {onBack && <button className="screen-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>}
    <header className="section-page-heading"><span className="eyebrow">PEDIDOS</span><h1>As tuas transações.</h1><p>Comida, compras, lojas e envios num só lugar.</p></header>
    <div className="orders-tabs">{(Object.keys(labels) as Array<keyof typeof labels>).map(key => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{labels[key]}</button>)}</div>
    <section className="order-list">
      {loading && <div className="orders-empty"><Clock3 size={28} /><strong>A carregar os teus pedidos…</strong><p>Estamos a consultar o teu histórico no Pedejá.</p></div>}
      {!loading && error && <div className="orders-empty"><strong>{error}</strong></div>}
      {!loading && !error && visibleOrders.length === 0 && <div className="orders-empty"><Clock3 size={28} /><strong>{filter === 'agendados' ? 'Nenhuma entrega agendada.' : filter === 'historico' ? 'Ainda não tens histórico.' : 'Ainda não tens pedidos ativos.'}</strong><p>Quando fizeres uma transação Pedejá, ela aparecerá aqui com o seu tipo, estado, acompanhamento e pagamento.</p></div>}
      {!loading && !error && visibleOrders.map(order => <OrderCard key={order.orderId} order={order} onOpen={() => onOpenOrder(order.orderId)} />)}
    </section>
    <section className="order-types"><h2>Tipos de transação</h2>{(['comida', 'loja', 'enviar'] as OrderKind[]).map(kind => { const Icon = icons[kind]; return <div className="order-type-guide" key={kind}><Icon size={18} /><span>{kind === 'comida' ? 'Pedido de comida' : kind === 'loja' ? 'Pedido de loja' : 'Envio de encomenda'}</span></div>; })}</section>
    <div className="order-history-note"><Star size={17} />O histórico usa dados reais da tua conta. Para envios, a integração com <strong>Enviar</strong> será ligada ao mesmo espaço de Pedidos.</div>
  </main>;
}
