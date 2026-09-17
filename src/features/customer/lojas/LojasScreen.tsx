import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Search, ShoppingBag, Store } from 'lucide-react';
import { listActiveBusinesses, listBusinessProducts } from '../../../repositories/businessRepository';
import { formatKz } from '../../../app/app-types';
import type { Business, Product } from '../../../app/app-types';
import './lojas.css';

type View = 'list' | 'business' | 'cart';
type CartItem = Product & { quantity: number };

const isStoreBusiness = (business: Business) => business.marketplace_category === 'lojas';

export default function LojasScreen({ onBack }: { onBack: () => void }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [view, setView] = useState<View>('list');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let active = true;
    void listActiveBusinesses()
      .then(data => { if (active) setBusinesses(data.filter(isStoreBusiness)); })
      .catch(() => { if (active) setBusinesses([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return businesses;
    return businesses.filter(business => `${business.name} ${business.description ?? ''}`.toLowerCase().includes(query));
  }, [businesses, search]);

  const openBusiness = async (business: Business) => {
    setSelectedBusiness(business);
    setView('business');
    setProductsLoading(true);
    try { setProducts(await listBusinessProducts(business.id)); }
    catch { setProducts([]); }
    finally { setProductsLoading(false); }
  };

  const addToCart = (product: Product) => setCart(current => {
    const existing = current.find(item => item.id === product.id);
    return existing
      ? current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item)
      : [...current, { ...product, quantity: 1 }];
  });

  const changeQuantity = (productId: string, delta: number) => setCart(current => current
    .map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item)
    .filter(item => item.quantity > 0));

  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (view === 'cart') {
    return <main className="screen lojas-screen lojas-cart">
      <header className="marketplace-header">
        <button className="icon-button" onClick={() => setView(selectedBusiness ? 'business' : 'list')} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">LOJAS</span><h1>O teu pedido</h1></div>
        <span />
      </header>
      <section className="cart-items">
        {cart.length === 0 ? <div className="marketplace-empty"><strong>O teu pedido está vazio.</strong><p>Adiciona produtos para continuar.</p></div> : cart.map(item => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><small>{formatKz(item.price)} cada</small></div><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Diminuir ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Aumentar ${item.name}`}>+</button></div></div>)}
      </section>
      {cart.length > 0 && <div className="cart-summary"><div><span>Subtotal</span><strong>{formatKz(subtotal)}</strong></div><p>O total final será calculado no checkout.</p><button className="primary" disabled>Continuar para checkout</button></div>}
    </main>;
  }

  if (view === 'business' && selectedBusiness) {
    return <main className="screen lojas-screen">
      <header className="marketplace-header">
        <button className="icon-button" onClick={() => setView('list')} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">LOJAS</span><h1>{selectedBusiness.name}</h1></div>
        <button className="icon-button" onClick={() => setView('cart')} aria-label="Ver pedido"><ShoppingBag size={19} /></button>
      </header>
      <div className="marketplace-location"><MapPin size={15} /><span>Entregar em Casa</span><ChevronRight size={15} /></div>
      <p className="business-description">{selectedBusiness.description || 'Compra nesta loja através do Pedejá.'}</p>
      <div className="marketplace-section-heading"><div><span className="eyebrow">PRODUTOS</span><h2>Disponíveis</h2></div></div>
      {productsLoading ? <div className="marketplace-state">A carregar produtos…</div> : products.length === 0 ? <div className="marketplace-empty"><Store size={24} /><strong>Sem produtos disponíveis</strong><p>Esta loja ainda não tem produtos ativos.</p></div> : <section className="product-list">{products.map(product => { const quantity = cart.find(item => item.id === product.id)?.quantity ?? 0; return <article className="product-row" key={product.id}><div><strong>{product.name}</strong>{product.description && <p>{product.description}</p>}<span>{formatKz(product.price)}</span></div>{quantity === 0 ? <button className="add-button" onClick={() => addToCart(product)}>+</button> : <div className="quantity"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Diminuir ${product.name}`}>−</button><span>{quantity}</span><button onClick={() => addToCart(product)} aria-label={`Aumentar ${product.name}`}>+</button></div>}</article>; })}</section>}
      {itemCount > 0 && <button className="sticky-cart" onClick={() => setView('cart')}><span><ShoppingBag size={18} /> {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span><strong>{formatKz(subtotal)}</strong></button>}
    </main>;
  }

  return <main className="screen lojas-screen">
    <header className="marketplace-header">
      <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
      <div><span className="eyebrow">PEDEJÁ</span><h1>Lojas</h1></div>
      <span />
    </header>
    <div className="marketplace-location"><MapPin size={15} /><span>Entregar em Casa</span><ChevronRight size={15} /></div>
    <label className="marketplace-search"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar lojas ou produtos" /></label>
    <div className="lojas-intro"><Store size={19} /><div><strong>Grandes lojas perto de ti</strong><p>Supermercados, centros comerciais e grandes retalhistas.</p></div></div>
    <div className="marketplace-section-heading"><div><span className="eyebrow">PERTO DE TI</span><h2>Lojas</h2></div><span className="result-count">{loading ? '…' : filteredBusinesses.length}</span></div>
    {loading ? <div className="marketplace-state">A carregar lojas…</div> : filteredBusinesses.length === 0 ? <div className="marketplace-empty"><div className="empty-icon"><Store size={24} /></div><strong>{search ? 'Nada encontrado' : 'Ainda não há lojas disponíveis'}</strong><p>{search ? 'Experimenta outra pesquisa.' : 'As lojas disponíveis aparecerão aqui quando estiverem ativas no Pedejá.'}</p></div> : <section className="store-list">{filteredBusinesses.map(business => <button className="store-card" key={business.id} onClick={() => void openBusiness(business)}><div className="store-thumb"><Store size={24} /></div><div className="store-card-copy"><strong>{business.name}</strong><p>{business.description || 'Loja Pedejá'}</p><small><MapPin size={12} /> Perto de ti</small></div><ChevronRight size={18} /></button>)}</section>}
  </main>;
}
