import { useState } from 'react';
import { ArrowLeft, Clock3, MapPin, Package, ShoppingBag, Star, UtensilsCrossed } from 'lucide-react';

type OrderKind = 'comida' | 'loja' | 'enviar';
const icons = { comida: UtensilsCrossed, loja: ShoppingBag, enviar: Package };

export default function OrdersScreen({ onBack }: { onBack?: () => void }) {
  const [filter, setFilter] = useState<'ativos' | 'agendados' | 'historico'>('ativos');
  const labels = { ativos: 'Ativos', agendados: 'Agendados', historico: 'Histórico' };
  return <main className="screen orders-screen">
    {onBack && <button className="screen-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>}
    <header className="section-page-heading"><span className="eyebrow">PEDIDOS</span><h1>As tuas transações.</h1><p>Comida, compras, lojas e envios num só lugar.</p></header>
    <div className="orders-tabs">{(Object.keys(labels) as Array<keyof typeof labels>).map(key => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{labels[key]}</button>)}</div>
    <section className="order-list"><div className="orders-empty"><Clock3 size={28} /><strong>{filter === 'agendados' ? 'Nenhuma entrega agendada.' : filter === 'historico' ? 'Ainda não tens histórico.' : 'Ainda não tens pedidos ativos.'}</strong><p>Quando fizeres uma transação Pedejá, ela aparecerá aqui com o seu tipo, estado, acompanhamento e pagamento.</p></div></section>
    <section className="order-types"><h2>Tipos de transação</h2>{(['comida', 'loja', 'enviar'] as OrderKind[]).map(kind => { const Icon = icons[kind]; return <div className="order-type-guide" key={kind}><Icon size={18} /><span>{kind === 'comida' ? 'Pedido de comida' : kind === 'loja' ? 'Pedido de loja' : 'Envio de encomenda'}</span></div>; })}</section>
    <div className="order-history-note"><Star size={17} />Depois de concluído, poderás consultar o recibo, pagamento e avaliação. Para envios, usa <strong>Repetir envio</strong>.</div>
  </main>;
}
