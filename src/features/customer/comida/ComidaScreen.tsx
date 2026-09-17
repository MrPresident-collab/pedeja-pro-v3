import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Search, ShoppingBag, SlidersHorizontal, Store, UtensilsCrossed } from 'lucide-react';
import { listActiveBusinesses } from '../../../repositories/businessRepository';
import type { Business, Product } from '../../../app/app-types';
import CartScreen from './CartScreen';
import RestaurantDetail, { type CartItem } from './RestaurantDetail';
import './comida.css';

type FoodCategory = 'todos' | 'hamburguer' | 'pizza' | 'sushi' | 'angolana';
type View = 'list' | 'restaurant' | 'cart';

const categories: Array<{ id: FoodCategory; label: string }> = [
  { id: 'todos', label: 'Todos' },
  { id: 'hamburguer', label: 'Hambúrguer' },
  { id: 'pizza', label: 'Pizza' },
  { id: 'sushi', label: 'Sushi' },
  { id: 'angolana', label: 'Angolana' },
];

const isFoodBusiness = (business: Business) => {
  const category = business.marketplace_category?.toLowerCase() ?? '';
  return ['food', 'comida', 'restaurant', 'restaurante', 'takeaway', 'kitchen', 'cozinha'].some(value => category.includes(value));
};

const matchesCategory = (business: Business, category: FoodCategory) => {
  if (category === 'todos') return true;
  const haystack = `${business.name} ${business.description ?? ''}`.toLowerCase();
  const terms: Record<Exclude<FoodCategory, 'todos'>, string[]> = {
    hamburguer: ['hamburg', 'burger'],
    pizza: ['pizza'],
    sushi: ['sushi'],
    angolana: ['angolana', 'angolano', 'calulu', 'funge', 'muamba'],
  };
  return terms[category].some(term => haystack.includes(term));
};

export default function ComidaScreen({ onBack }: { onBack: () => void }) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FoodCategory>('todos');
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [view, setView] = useState<View>('list');
  const [cart, setCart] = useState<CartItem[]>([]);

  useEffect(() => {
    let active = true;
    void listActiveBusinesses()
      .then(data => { if (active) setBusinesses(data.filter(isFoodBusiness)); })
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

  const addToCart = (product: Product) => {
    setCart(current => {
      const existing = current.find(item => item.id === product.id);
      if (existing) return current.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...current, { ...product, quantity: 1 }];
    });
  };

  const changeQuantity = (productId: string, delta: number) => {
    setCart(current => current.map(item => item.id === productId ? { ...item, quantity: item.quantity + delta } : item).filter(item => item.quantity > 0));
  };

  if (view === 'cart') return <CartScreen items={cart} onBack={() => setView(selectedBusiness ? 'restaurant' : 'list')} onChangeQuantity={changeQuantityByProduct(cart, changeQuantity)} />;

  if (view === 'restaurant' && selectedBusiness) {
    return <RestaurantDetail business={selectedBusiness} cart={cart} onBack={() => setView('list')} onAdd={addToCart} onChangeQuantity={changeQuantity} onOpenCart={() => setView('cart')} />;
  }

  return (
    <main className="screen comida-screen">
      <header className="marketplace-header">
        <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div><span className="eyebrow">PEDEJÁ</span><h1>Comida</h1></div>
        <button className="icon-button" aria-label="Filtros"><SlidersHorizontal size={19} /></button>
      </header>
      <div className="marketplace-location"><MapPin size={15} /><span>Entregar em Casa</span><ChevronRight size={15} /></div>
      <label className="marketplace-search"><Search size={19} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar comida ou restaurante" /></label>
      <div className="food-category-row" aria-label="Categorias de comida">{categories.map(item => <button key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>)}</div>
      <div className="marketplace-section-heading"><div><span className="eyebrow">PERTO DE TI</span><h2>Restaurantes</h2></div><span className="result-count">{loading ? '…' : filteredBusinesses.length}</span></div>
      {loading ? <div className="marketplace-state">A carregar restaurantes…</div> : filteredBusinesses.length === 0 ? <div className="marketplace-empty"><div className="empty-icon"><UtensilsCrossed size={24} /></div><strong>Nada encontrado</strong><p>{search ? 'Experimenta outra pesquisa.' : 'Ainda não há restaurantes disponíveis nesta categoria.'}</p></div> : <section className="restaurant-list">{filteredBusinesses.map(business => <button className="restaurant-card" key={business.id} onClick={() => { setSelectedBusiness(business); setView('restaurant'); }}><div className="restaurant-thumb"><Store size={24} /></div><div className="restaurant-card-copy"><strong>{business.name}</strong><p>{business.description || 'Restaurante Pedejá'}</p><small><MapPin size={12} /> Perto de ti</small></div><ChevronRight size={18} /></button>)}</section>}
      {cart.length > 0 && <button className="sticky-cart" onClick={() => setView('cart')}><span><ShoppingBag size={18} /> {cart.reduce((sum, item) => sum + item.quantity, 0)} itens</span><strong>Ver pedido</strong></button>}
    </main>
  );
}

const changeQuantityByProduct = (cart: CartItem[], changeQuantity: (productId: string, delta: number) => void) => (product: Product, delta: number) => changeQuantity(product.id, delta);
