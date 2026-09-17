import { useState } from 'react';
import { ArrowLeft, ChevronRight, Clock3, MapPin, Package, RefreshCw, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';

export type OrderKind = 'comida' | 'loja' | 'enviar';

type DemoOrder = { id: string; kind: OrderKind; title: string; subtitle: string; status: string; amount: string; date: string; active?: boolean };

const demoOrders: DemoOrder[] = [
  { id: 'PJD-2048', kind: 'comida', title: 'Pedido de comida', subtitle: 'Restaurante parceiro', status: 'A preparar', amount: '— Kz', date: 'Hoje', active: true },
  { id: 'PJD-1931', kind: 'enviar', title: 'Envio de encomenda', subtitle: 'Entrega Pedejá', status: 'Agendado', amount: 'A calcular', date: 'Amanhã', active: true },
  { id: 'PJD-1842', kind: 'loja', title: 'Pedido de loja', subtitle: 'Produtos e compras', status: 'Entregue', amount: '— Kz', date: '12 Set', active: false },
];

const icons = { comida: UtensilsCrossed, loja: ShoppingBag, enviar: Package };

export default function OrdersScreen({ onBack }: { onBack?: () => void }) {
  const [filter, setFilter] = useState<'ativos' | 'agendados' | 'historico'>('ativos');
  const visible = demoOrders.filter(order => filter === 'historico' ? !order.active : filter === 'agendados' ? order.status === 'Agendado' : order.active && order.status !== 'Agendado');

  return <main className="screen orders-screen">
    {onBack && <button className="screen-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>}
    <header className="section-page-heading"><span className="eyebrow">PEDIDOS</span><h1>As tuas transações.</h1><p>Comida, compras, lojas e envios num só lugar.</p></header>
    <div className="orders-tabs"><button className={filter === 'ativos' ? 'active' : ''} onClick={() => setFilter('ativos')}>Ativos</button><button className={filter === 'agendados' ? 'active' : ''} onClick={() => setFilter('agendados')}>Agendados</button><button className={filter === 'historico' ? 'active' : ''} onClick={() => setFilter('historico')}>Histórico</button></div>
    <section className="order-list">{visible.length === 0 ? <div className="orders-empty"><Clock3 size={26} /><strong>Nada por aqui ainda.</strong><p>Quando fizeres uma transação, ela aparecerá nesta área.</p></div> : visible.map(order => { const Icon = icons[order.kind]; return <article className="order-card" key={order.id}>
      <div className="order-card-top"><span className="order-type"><Icon size={17} />{order.kind === 'comida' ? 'Comida' : order.kind === 'loja' ? 'Loja' : 'Envio'}</span><small>{order.date}</small></div>
      <h2>{order.title}</h2><p>{order.subtitle}</p>
      <div className="order-status"><span className="status-dot" /><strong>{order.status}</strong><span>{order.amount}</span></div>
      {order.active && <div className="order-timeline"><span className="done" /> <span className="done" /> <span /> <span /> </div>}
      <div className="order-actions">{order.active ? <button><MapPin size={16} />Acompanhar</button> : <button><RefreshCw size={16} />{order.kind === 'enviar' ? 'Repetir envio' : 'Pedir novamente'}</button>}<button className="ghost"><ChevronRight size={17} />Detalhes</button></div>
    </article>; })}</section>
    {filter === 'historico' && visible.length > 0 && <div className="order-history-note"><Star size={17} />Podes avaliar uma transação concluída a partir dos detalhes do pedido.</div>}
  </main>;
}
