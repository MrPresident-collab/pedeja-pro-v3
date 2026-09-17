import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Store } from 'lucide-react';
import { listBusinessProducts } from '../../../repositories/businessRepository';
import { formatKz } from '../../../app/app-types';
import type { Business, Product } from '../../../app/app-types';
import './comida.css';

export type CartItem = Product & { quantity: number };

type Props = {
  business: Business;
  cart: CartItem[];
  onBack: () => void;
  onAdd: (product: Product) => void;
  onChangeQuantity: (productId: string, delta: number) => void;
  onOpenCart: () => void;
};

export default function RestaurantDetail({ business, cart, onBack, onAdd, onChangeQuantity, onOpenCart }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void listBusinessProducts(business.id)
      .then(data => { if (active) setProducts(data); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [business.id]);

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <main className="screen restaurant-detail-screen">
      <header className="restaurant-detail-header">
        <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div className="restaurant-detail-brand"><Store size={18} /><span>Restaurante</span></div>
        <div className="restaurant-detail-spacer" />
      </header>

      <section className="restaurant-hero">
        <div className="restaurant-hero-icon"><Store size={34} /></div>
        <span className="eyebrow">PEDEJÁ</span>
        <h1>{business.name}</h1>
        {business.description && <p>{business.description}</p>}
      </section>

      <section className="product-section">
        <div className="marketplace-section-heading"><div><span className="eyebrow">MENU</span><h2>Escolhe o que queres</h2></div></div>
        {loading ? (
          <div className="marketplace-state">A carregar menu…</div>
        ) : products.length === 0 ? (
          <div className="marketplace-empty"><strong>Menu indisponível</strong><p>Este parceiro ainda não tem produtos ativos disponíveis.</p></div>
        ) : (
          <div className="product-list">
            {products.map(product => {
              const quantity = cart.find(item => item.id === product.id)?.quantity ?? 0;
              return (
                <article className="product-row" key={product.id}>
                  <div className="product-copy"><strong>{product.name}</strong>{product.description && <p>{product.description}</p>}<span>{formatKz(product.price)}</span></div>
                  {quantity === 0 ? (
                    <button className="add-product" onClick={() => onAdd(product)} aria-label={`Adicionar ${product.name}`}><Plus size={18} /></button>
                  ) : (
                    <div className="quantity-control"><button onClick={() => onChangeQuantity(product.id, -1)} aria-label="Diminuir"><Minus size={15} /></button><strong>{quantity}</strong><button onClick={() => onChangeQuantity(product.id, 1)} aria-label="Aumentar"><Plus size={15} /></button></div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {itemCount > 0 && (
        <button className="sticky-cart" onClick={onOpenCart}>
          <span><ShoppingBag size={18} /> {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          <strong>Ver pedido · {formatKz(total)}</strong>
        </button>
      )}
    </main>
  );
}
