import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Search, ShoppingBag, SlidersHorizontal, Store } from 'lucide-react';
import { listActiveBusinesses, listBusinessProducts } from '../../../repositories/businessRepository';
import { formatKz } from '../../../app/app-types';
import type { Business, Product } from '../../../app/app-types';
import './compras.css';

type View = 'list' | 'business' | 'cart';
type CartItem = Product & { quantity: number };

type ShoppingCategory = 'todos' | 'farmacia' | 'conveniencia' | 'beleza' | 'casa';

const categories: Array<{ id: ShoppingCategory; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'farmacia', label: 'Farmácia' },
  { id: 'conveniencia', label: 'Conveniência' },
  { id: 'beleza', label: 'Beleza' },
  { id: 'casa', label: 'Casa' },
];

const isShoppingBusiness = (business: Business) => {
  const category = business.marketplace_category?.toLowerCase() ?? '';
  return ['shopping', 'compras', 'convenience', 'conveniência', 'pharmacy', 'farmacia', 'farmácia', 'beauty', 'casa'].some(value => category.includes(value));
};

const matchesCategory = (business: Business, category: ShoppingCategory) => {
  if (category === 'todos') return true;
  const haystack = `${business.name} ${business.description ?? ''}`.toLowerCase();
  const terms: Record<Exclude<ShoppingCategory, 'todos'>, string[]> = {
    farmacia: ['farmácia', 'farmacia', 'pharmacy'],
    conveniencia: ['conveniência', 'conveniencia', 'convenience', 'mercearia'],
    beleza: ['beleza', 'beauty', 'cosmética', 'cosmetica'],
    casa: ['casa', 'household', 'limpeza'],
  };
  return terms[category].some(term => haystack.includes(term));
};

export default function ComprasScreen({ onBack }: { onBack: () => void }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<ShoppingCategory>('todos');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [view, setView] = useState<View>('list');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let active = true;
    void listActiveBusinesses()
      .then(data => { if (active) setBusinesses(data.filter(isShoppingBusiness)); })
      .catch(() => { if (active) setBusinesses([]); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const filteredBusinesses = useMemo(() => {
    const query = search.trim().toLowerCase();
    return businesses.filter(business => {
      const haystack = `${business.name} ${business.description ?? ''}`.toLowerCase();
      return (!query || haystack.includes(query)) && matchesCategory(business, category);
    });
  }, [businesses, search, category]);

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

  if (view === 'cart') return <main className="screen compras-screen compras-cart"><header className="marketplace-header"><button className="icon-button" onClick={() => setView(selectedBusiness ? 'business' : 'list')} aria-label="Voltar"><ArrowLeft size={20} /></button><div><span className="eyebrow">PEDEJÁ</span><h1>O teu pedido</h1></div><span /></header><section className="cart-items">{cart.length === 0 ? <div className="marketplace-empty"><strong>O teu pedido está vazio.</strong><p>Adiciona produtos para continuar.</p></div> : cart.map(item => <div className="cart-item" key={item.id}><div><strong>{item.name}</strong><small>{formatKz(item.price)} cada</small></div><div className="quantity"><button onClick={() => changeQuantity(item.id, -1)} aria-label={`Diminuir ${item.name}`}>−</button><span>{item.quantity}</span><button onClick={() => changeQuantity(item.id, 1)} aria-label={`Aumentar ${item.name}`}>+</button></div></div>)}</section>{cart.length > 0 && <div className="cart-summary"><div><span>Subtotal</span><strong>{formatKz(subtotal)}</strong></div><p>O total final será calculado no checkout.</p><button className="primary" disabled>Continuar para checkout</button></div>}</main>;

  if (view === 'business' && selectedBusiness) return <main className="screen compras-screen"><header className="marketplace-header"><button className="icon-button" onClick={() => setView('list')} aria-label="Voltar"><ArrowLeft size={20} /></button><div><span className="eyebrow">COMPRAS</span><h1>{selectedBusiness.name}</h1></div><button className="icon-button" onClick={() => setView('cart')} aria-label="Ver pedido"><ShoppingBag size={19} /></button></header><div className="marketplace-location"><MapPin size={15} /><span>Entregar em Casa</span><ChevronRight size={15} /></div><p className="business-description">{selectedBusiness.description || 'Compra no teu comércio local através do Pedejá.'}</p><div className="marketplace-section-heading"><div><span className="eyebrow">PRODUTOS</span><h2>Disponíveis</h2></div></div>{productsLoading ? <div className="marketplace-state">A carregar produtos…</div> : products.length === 0 ? <div className="marketplace-empty"><Store size={24} /><strong>Sem produtos disponíveis</strong><p>Este parceiro ainda não tem produtos ativos.</p></div> : <section className="product-list">{products.map(product => { const quantity = cart.find(item => item.id === product.id)?.quantity ?? 0; return <article className="product-row" key={product.id}><div><strong>{product.name}</strong>{product.description && <p>{product.description}</p>}<span>{formatKz(product.price)}</span></div>{quantity === 0 ? <button className="add-button" onClick={() => addToCart(product)}>+</button> : <div className="quantity"><button onClick={() => changeQuantity(product.id, -1)} aria-label={`Diminuir ${product.name}`}>−</button><span>{quantity}</span><button onClick={() => addToCart(product)} aria-label={`Aumentar ${product.name}`}>+</button></div>}</article>; })}</section>}{itemCount > 0 && <button className="sticky-cart" onClick={() => setView('cart')}><span><ShoppingBag size={18} /> {itemCount} {itemCount === 1 ? 'item' : 'itens'}</span><strong>{formatKz(subtotal)}</strong></button>}</main>;

  return <main className="screen compras-screen"><header className="marketplace-header"><button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button><div><span className="eyebrow">PEDEJÁ</span><h1>Compras</h1></div><button className="icon-button" aria-label="Filtros"><SlidersHorizontal size={19} /></button></header><div className="marketplace-location"><MapPin size={15} /><span>Entregar em Casa</span><ChevronRight size={15} /></div><label className="marketplace-search"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar produtos ou lojas" /></label><div className="category-row">{categories.map(item => <button key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div><div className="marketplace-section-heading"><div><span className="eyebrow">PERTO DE TI</span><h2>Comerciantes</h2></div><span className="result-count">{loading ? '…' : filteredBusinesses.length}</span></div>{loading ? <div className="marketplace-state">A carregar comerciantes…</div> : filteredBusinesses.length === 0 ? <div className="marketplace-empty"><div className="empty-icon"><ShoppingBag size={24} /></div><strong>Nada encontrado</strong><p>{search ? 'Experimenta outra pesquisa.' : 'Ainda não há comerciantes disponíveis nesta categoria.'}</p></div> : <section className="restaurant-list">{filteredBusinesses.map(business => <button className="restaurant-card" key={business.id} onClick={() => void openBusiness(business)}><div className="restaurant-thumb"><Store size={24} /></div><div className="restaurant-card-copy"><strong>{business.name}</strong><p>{business.description || 'Comércio local Pedejá'}</p><small><MapPin size={12} /> Perto de ti</small></div><ChevronRight size={18} /></button>)}</section>}</main>;
}
