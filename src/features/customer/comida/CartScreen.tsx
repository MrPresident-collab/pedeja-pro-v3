import { ArrowLeft, Minus, Plus, ShoppingBag } from 'lucide-react';
import { formatKz } from '../../../app/app-types';
import type { Product } from '../../../app/app-types';
import type { CartItem } from './RestaurantDetail';
import './comida.css';

export default function CartScreen({ items, onBack, onChangeQuantity }: { items: CartItem[]; onBack: () => void; onChangeQuantity: (product: Product, delta: number) => void }) {
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <main className="screen cart-screen">
      <header className="marketplace-header">
        <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">PEDEJÁ</span><h1>O teu pedido</h1></div>
        <div className="restaurant-detail-spacer" />
      </header>

      {items.length === 0 ? (
        <div className="marketplace-empty"><div className="empty-icon"><ShoppingBag size={24} /></div><strong>O carrinho está vazio</strong><p>Adiciona produtos de um parceiro para continuar.</p></div>
      ) : (
        <>
          <section className="cart-list">
            {items.map(item => (
              <article className="cart-row" key={item.id}>
                <div className="product-copy"><strong>{item.name}</strong><span>{formatKz(item.price)}</span></div>
                <div className="quantity-control"><button onClick={() => onChangeQuantity(item, -1)} aria-label="Diminuir"><Minus size={15} /></button><strong>{item.quantity}</strong><button onClick={() => onChangeQuantity(item, 1)} aria-label="Aumentar"><Plus size={15} /></button></div>
              </article>
            ))}
          </section>
          <section className="cart-summary"><div><span>Subtotal</span><strong>{formatKz(total)}</strong></div><small>{count} {count === 1 ? 'item' : 'itens'} · O total final será calculado no checkout.</small></section>
          <button className="primary cart-continue" disabled>Continuar para checkout</button>
        </>
      )}
    </main>
  );
}
