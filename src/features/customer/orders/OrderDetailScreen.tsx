import { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, Clock3, MapPin, Phone, ShoppingBag, Truck, UtensilsCrossed } from 'lucide-react';
import { getCustomerOrderDetail, type CustomerOrderDetail } from '../../../repositories/customerOrderDetailRepository';

function money(value: number, currency: string) {
  return new Intl.NumberFormat('pt-AO', { maximumFractionDigits: 0 }).format(value) + (currency === 'AOA' ? ' Kz' : ` ${currency}`);
}

function date(value: string | null) {
  return value ? new Intl.DateTimeFormat('pt-AO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value)) : '—';
}

function label(status: string) {
  return ({ PENDING: 'Pendente', CONFIRMED: 'Confirmado', ACCEPTED: 'Aceite', PREPARING: 'A preparar', READY: 'Pronto', PICKUP_PENDING: 'A aguardar recolha', PICKED_UP: 'Recolhido', IN_TRANSIT: 'Em entrega', DELIVERED: 'Entregue', CANCELLED: 'Cancelado', FAILED: 'Falhou' } as Record<string, string>)[status] ?? status.replaceAll('_', ' ');
}

export default function OrderDetailScreen({ orderId, onBack }: { orderId: string; onBack: () => void }) {
  const [order, setOrder] = useState<CustomerOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    void getCustomerOrderDetail(orderId).then(data => {
      if (mounted) setOrder(data);
    }).catch(err => {
      console.error('Failed to load order detail', err);
      if (mounted) setError('Não foi possível carregar os detalhes deste pedido.');
    }).finally(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [orderId]);

  if (loading) return <main className="screen order-detail-screen"><button className="screen-back" onClick={onBack}><ArrowLeft size={20} /></button><div className="orders-empty"><Clock3 size={28} /><strong>A carregar o pedido…</strong><p>Estamos a consultar os detalhes reais da tua transação.</p></div></main>;
  if (error || !order) return <main className="screen order-detail-screen"><button className="screen-back" onClick={onBack}><ArrowLeft size={20} /></button><div className="orders-empty"><strong>{error ?? 'Pedido não encontrado.'}</strong><button className="primary" onClick={onBack}>Voltar aos pedidos</button></div></main>;

  const isFood = order.businessCategory.toLowerCase().includes('food') || order.businessCategory.toLowerCase().includes('restaurant') || order.businessCategory.toLowerCase().includes('comida');
  const Icon = isFood ? UtensilsCrossed : ShoppingBag;
  const vehicle = [order.delivery?.vehicleMake, order.delivery?.vehicleModel].filter(Boolean).join(' ');
  const address = [order.deliveryAddress.line1, order.deliveryAddress.line2, order.deliveryAddress.neighborhood, order.deliveryAddress.municipality, order.deliveryAddress.city].filter(Boolean).join(', ');

  return <main className="screen order-detail-screen">
    <button className="screen-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
    <header className="section-page-heading">
      <span className="eyebrow">PEDIDO {order.orderReference}</span>
      <div className="order-detail-title"><div className="order-history-icon"><Icon size={20} /></div><div><h1>{order.businessName}</h1><p>{label(order.status)} · {date(order.placedAt)}</p></div></div>
    </header>

    <section className="order-detail-section">
      <h2>Itens</h2>
      {order.items.length === 0 ? <p className="muted">Os itens deste pedido não estão disponíveis.</p> : order.items.map(item => <div className="order-detail-item" key={item.id}><div><strong>{item.quantity}× {item.name}</strong>{item.sku && <small>{item.sku}</small>}</div><span>{money(item.lineTotal, order.currencyCode)}</span></div>)}
    </section>

    <section className="order-detail-section">
      <h2>Resumo</h2>
      <div className="order-detail-row"><span>Subtotal</span><span>{money(order.subtotal, order.currencyCode)}</span></div>
      <div className="order-detail-row"><span>Entrega</span><span>{money(order.deliveryFee, order.currencyCode)}</span></div>
      <div className="order-detail-row"><span>Taxa de serviço</span><span>{money(order.serviceFee, order.currencyCode)}</span></div>
      {order.discountAmount > 0 && <div className="order-detail-row"><span>Desconto</span><span>-{money(order.discountAmount, order.currencyCode)}</span></div>}
      <div className="order-detail-total"><span>Total</span><strong>{money(order.totalAmount, order.currencyCode)}</strong></div>
    </section>

    <section className="order-detail-section">
      <h2>Entrega</h2>
      <div className="order-detail-info"><MapPin size={17} /><span>{address || 'Morada não disponível'}</span></div>
      {order.recipientName && <div className="order-detail-info"><span>Destinatário: {order.recipientName}{order.recipientPhone ? ` · ${order.recipientPhone}` : ''}</span></div>}
      {order.deliveryInstructions && <div className="order-detail-note">{order.deliveryInstructions}</div>}
    </section>

    {order.delivery && <section className="order-detail-section">
      <h2>Estafeta</h2>
      <div className="order-detail-rider"><div className="order-detail-rider-icon"><Truck size={19} /></div><div><strong>{order.delivery.riderName ?? 'Estafeta atribuído'}</strong><span>{vehicle || order.delivery.vehicleType || 'Veículo não disponível'}</span>{order.delivery.vehicleRegistration && <span>{order.delivery.vehicleRegistration}</span>}</div>{order.delivery.riderPhone && <a href={`tel:${order.delivery.riderPhone}`} aria-label="Ligar ao estafeta"><Phone size={18} /></a>}</div>
    </section>}

    <section className="order-detail-section order-detail-timeline">
      <h2>Estado</h2>
      {[['Pedido', order.placedAt], ['Aceite', order.acceptedAt], ['Entregue', order.deliveredAt]].map(([name, time]) => <div className="order-timeline-row" key={String(name)}><CheckCircle2 size={17} /><div><strong>{name}</strong><span>{date(time as string | null)}</span></div></div>)}
    </section>
  </main>;
}
