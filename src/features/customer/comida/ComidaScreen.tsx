import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Search, ShoppingBag, SlidersHorizontal, Store, UtensilsCrossed } from 'lucide-react';
import { listActiveBusinesses } from '../../../repositories/businessRepository';
import type { Business } from '../../../app/app-types';
import RestaurantDetail from './RestaurantDetail';
import './comida.css';

type FoodCategory = 'todos' | 'hamburguer' | 'pizza' | 'sushi' | 'angolana';

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

  if (selectedBusiness) {
    return <RestaurantDetail business={selectedBusiness} onBack={() => setSelectedBusiness(null)} />;
  }

  return (
    <main className="screen comida-screen">
      <header className="marketplace-header">
        <button className="icon-button" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
        <div>
          <span className="eyebrow">PEDEJÁ</span>
          <h1>Comida</h1>
        </div>
        <button className="icon-button" aria-label="Filtros"><SlidersHorizontal size={19} /></button>
      </header>

      <div className="marketplace-location"><MapPin size={15} /><span>Entregar em Casa</span><ChevronRight size={15} /></div>

      <label className="marketplace-search">
        <Search size={19} />
        <input value={search} onChange={event => setSearch(event.target.value)} placeholder="Pesquisar comida ou restaurante" />
      </label>

      <div className="food-category-row" aria-label="Categorias de comida">
        {categories.map(item => (
          <button key={item.id} className={category === item.id ? 'active' : ''} onClick={() => setCategory(item.id)}>{item.label}</button>
        ))}
      </div>

      <div className="marketplace-section-heading">
        <div><span className="eyebrow">PERTO DE TI</span><h2>Restaurantes</h2></div>
        <span className="result-count">{loading ? '…' : filteredBusinesses.length}</span>
      </div>

      {loading ? (
        <div className="marketplace-state">A carregar restaurantes…</div>
      ) : filteredBusinesses.length === 0 ? (
        <div className="marketplace-empty">
          <div className="empty-icon"><UtensilsCrossed size={24} /></div>
          <strong>Nada encontrado</strong>
          <p>{search ? 'Experimenta outra pesquisa.' : 'Ainda não há restaurantes disponíveis nesta categoria.'}</p>
        </div>
      ) : (
        <section className="restaurant-list">
          {filteredBusinesses.map(business => (
            <button className="restaurant-card" key={business.id} onClick={() => setSelectedBusiness(business)}>
              <div className="restaurant-thumb"><Store size={24} /></div>
              <div className="restaurant-card-copy">
                <strong>{business.name}</strong>
                <p>{business.description || 'Restaurante Pedejá'}</p>
                <small><MapPin size={12} /> Perto de ti</small>
              </div>
              <ChevronRight size={18} />
            </button>
          ))}
        </section>
      )}

      <div className="marketplace-footnote"><ShoppingBag size={15} /> Dados e disponibilidade fornecidos pelos parceiros Pedejá.</div>
    </main>
  );
}
