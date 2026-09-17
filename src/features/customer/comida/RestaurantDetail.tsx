import { useEffect, useState } from 'react';
import { ArrowLeft, Minus, Plus, ShoppingBag, Store } from 'lucide-react';
import { listBusinessProducts } from '../../../repositories/businessRepository';
import { formatKz } from '../../../app/app-types';
import type { Business, Product } from '../../../app/app-types';
import './comida.css';

export type CartItem = Product & { quantity: number };

export default function RestaurantDetail({ business, onBack }: { business: Business; onBack: () => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    void listBusinessProducts(business.id)
      .then(data => { if (active) setProducts(data); })
      .catch(() => { if (active) setProducts([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [business.id]);

  const add = (product: Product) => {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) return current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart(current => current
      .map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
      .filter(item => item.quantity > 0));
  };

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
                    <button className="add-product" onClick={() => add(product)} aria-label={`Adicionar ${product.name}`}><Plus size={18} /></button>
                  ) : (
                    <div className="quantity-control"><button onClick={() => changeQuantity(product.id, -1)} aria-label="Diminuir"><Minus size={15} /></button><strong>{quantity}</strong><button onClick={() => changeQuantity(product.id, 1)} aria-label="Aumentar"><Plus size={15} /></button></div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {itemCount > 0 && (
        <button className="sticky-cart">
          <span><ShoppingBag size={18} /> {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span>
          <strong>Ver pedido · {formatKz(total)}</strong>
        </button>
      )}
    </main>
  );
}
