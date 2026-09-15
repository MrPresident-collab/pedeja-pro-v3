import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  Briefcase,
  CalendarClock,
  ChevronRight,
  Home,
  Pill,
  Search,
  Send,
  ShoppingBag,
  ShoppingCart,
  ShoppingBasket,
  Star,
  Store,
  Utensils,
  Zap,
} from 'lucide-react';
import { FilterChip } from '@/components/FilterChip';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyState } from '@/components/EmptyState';
import { repositories } from '@/repositories';
import { marketplaceNeeds, marketplaceFilters } from '@/data/marketplace';
import type { MarketplaceNeed } from '@/data/marketplace';
import type { Business, Category } from '@/types';
import { isSupabaseConfigured } from '@/services/supabase';

const iconMap = { utensils: Utensils, store: Store, 'shopping-bag': ShoppingBag, send: Send };

const needIconMap: Record<MarketplaceNeed['icon'], typeof Utensils> = {
  utensils: Utensils,
  pill: Pill,
  basket: ShoppingBasket,
  house: Home,
  quick: Zap,
  send: Send,
  office: Briefcase,
  today: CalendarClock,
};

const categoryLabel: Record<Exclude<Category, 'enviar'>, string> = {
  comida: 'Comida',
  compras: 'Compras',
  lojas: 'Lojas',
};

function normalize(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function applyFilter(list: Business[], filter: string): Business[] {
  switch (filter) {
    case 'Promoções':
      return list.filter((b) => b.promo);
    case 'Aberto agora':
      return list.filter((b) => b.open);
    case 'Melhor avaliados':
      return [...list].sort((a, b) => b.rating - a.rating);
    default:
      return list;
  }
}

type Props = {
  onBack: () => void;
  onBusiness: (b: Business) => void;
  onCategory: (cat: Category) => void;
  onCart: () => void;
  signedIn: boolean;
};

function BusinessCard({ business: b, onOpen }: { business: Business; onOpen: (b: Business) => void }) {
  const Icon = iconMap[b.icon];
  return (
    <button className="business-row" onClick={() => onOpen(b)}>
      <span className={`business-avatar ${b.tone}`}>
        <Icon size={22} />
      </span>
      <span className="business-info">
        <span className="business-info-top">
          <strong>{b.name}</strong>
          {b.promo && <span className="promo-tag">Promo</span>}
        </span>
        <small>{b.type}</small>
        <small className="business-meta">
          <Star size={12} fill="currentColor" /> {b.rating} · {b.deliveryMin}–{b.deliveryMax} min ·{' '}
          <span className={`open-dot ${b.open ? 'is-open' : ''}`} /> {b.open ? 'Aberto agora' : 'Fechado'}
        </small>
      </span>
      <span className="business-right">
        <small>{b.priceLabel}</small>
        <ChevronRight size={17} />
      </span>
    </button>
  );
}

function BusinessList({ items, onBusiness }: { items: Business[]; onBusiness: (b: Business) => void }) {
  return (
    <div className="business-list">
      {items.map((b) => (
        <BusinessCard key={b.id} business={b} onOpen={onBusiness} />
      ))}
    </div>
  );
}

export function MarketplaceView({ onBack, onBusiness, onCategory, onCart, signedIn }: Props) {
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [loadKey, setLoadKey] = useState(0);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'todos' | Exclude<Category, 'enviar'>>('todos');
  const [keyword, setKeyword] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Perto de ti');

  useEffect(() => {
    let alive = true;
    const t = setTimeout(() => {
      if (alive) setStatus('ready');
    }, 360);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [loadKey]);

  const retry = () => {
    setStatus('loading');
    setLoadKey((k) => k + 1);
  };

  const clearContext = () => {
    setActiveCategory('todos');
    setKeyword('');
    setSelectedFilter('Perto de ti');
  };

  const handleNeed = (need: MarketplaceNeed) => {
    if (need.key === 'enviar') {
      onCategory('enviar');
      return;
    }
    setActiveCategory(need.category ?? 'todos');
    setKeyword(need.keyword ?? '');
    setQuery('');
    setSelectedFilter('Perto de ti');
  };

  const selectCategory = (cat: Exclude<Category, 'enviar'>) => {
    setActiveCategory(activeCategory === cat ? 'todos' : cat);
    setKeyword('');
  };

  const nearby = useMemo(() => {
    if (query.trim()) return null;
    try {
      let list = repositories.merchant.listNearby();
      if (activeCategory !== 'todos') list = list.filter((b) => b.category === activeCategory);
      if (keyword) {
        const k = normalize(keyword);
        list = list.filter((b) => normalize(b.name).includes(k) || normalize(b.type).includes(k));
      }
      return applyFilter(list, selectedFilter);
    } catch {
      return null;
    }
  }, [query, activeCategory, keyword, selectedFilter]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    try {
      let list = repositories.marketplace.search(query);
      if (activeCategory !== 'todos') list = list.filter((b) => b.category === activeCategory);
      return applyFilter(list, selectedFilter);
    } catch {
      return null;
    }
  }, [query, activeCategory, selectedFilter]);

  const promos = useMemo(() => {
    try { return repositories.marketplace.listPromos(); } catch { return []; }
  }, []);

  const popular = useMemo(() => {
    try { return repositories.marketplace.listPopular(); } catch { return []; }
  }, []);

  const previous = useMemo(() => {
    try { return repositories.marketplace.listPrevious(); } catch { return []; }
  }, []);

  const recommended = useMemo(() => {
    try { return repositories.marketplace.listRecommended(); } catch { return []; }
  }, []);

  if (status === 'loading') {
    return (
      <main className="page marketplace-page">
        <header className="category-header">
          <button className="icon-button back-button" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Marketplace</h1>
          </div>
        </header>
        <EmptyState icon={<Store size={28} />} title="A procurar ofertas perto de ti…" message="Só um momento." />
      </main>
    );
  }

  if (status === 'error') {
    return (
      <main className="page marketplace-page">
        <header className="category-header">
          <button className="icon-button back-button" onClick={onBack}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>Marketplace</h1>
          </div>
        </header>
        <EmptyState
          icon={<AlertTriangle size={28} />}
          title="Não conseguimos carregar o Marketplace."
          message="Verifica a tua ligação e tenta novamente."
          action={
            <button className="btn-primary" onClick={retry}>
              Tentar novamente
            </button>
          }
        />
      </main>
    );
  }

  return (
    <main className="page marketplace-page">
      <header className="category-header">
        <button className="icon-button back-button" onClick={onBack}>
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1>Marketplace</h1>
        </div>
      </header>

      <div className="search-bar marketplace-search">
        <Search size={19} />
        <input
          type="text"
          placeholder="O que procuras?"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="marketplace-search-input"
        />
        <button className="marketplace-cart-btn" onClick={onCart} aria-label="Abrir o cesto">
          <ShoppingCart size={17} />
        </button>
      </div>

      <div className="filter-row">
        {marketplaceFilters.map((filter) => (
          <FilterChip
            key={filter}
            active={selectedFilter === filter}
            onClick={() => setSelectedFilter(filter)}
          >
            {filter}
          </FilterChip>
        ))}
      </div>

      <section className="marketplace-category-pills">
        <button
          className={`marketplace-pill ${activeCategory === 'comida' ? 'active' : ''}`}
          onClick={() => selectCategory('comida')}
        >
          <span className="marketplace-pill-icon food"><Utensils size={16} /></span>
          Comida
        </button>
        <button
          className={`marketplace-pill ${activeCategory === 'compras' ? 'active' : ''}`}
          onClick={() => selectCategory('compras')}
        >
          <span className="marketplace-pill-icon shop"><ShoppingBag size={16} /></span>
          Compras
        </button>
        <button
          className={`marketplace-pill ${activeCategory === 'lojas' ? 'active' : ''}`}
          onClick={() => selectCategory('lojas')}
        >
          <span className="marketplace-pill-icon stores"><Store size={16} /></span>
          Lojas
        </button>
        <button className="marketplace-pill" onClick={() => onCategory('enviar')}>
          <span className="marketplace-pill-icon send"><Send size={16} /></span>
          Enviar
        </button>
      </section>

      {query.trim() ? (
        <section className="section-block">
          {results === null ? (
            <EmptyState
              icon={<AlertTriangle size={28} />}
              title="Não conseguimos carregar os resultados."
              message="Tenta novamente."
              action={
                <button className="btn-primary" onClick={() => setQuery('')}>
                  Limpar pesquisa
                </button>
              }
            />
          ) : results.length > 0 ? (
            <>
              <SectionHeader
                eyebrow={`${results.length} ${results.length === 1 ? 'resultado' : 'resultados'}`}
                title="Resultados"
              />
              <BusinessList items={results} onBusiness={onBusiness} />
            </>
          ) : (
            <EmptyState
              icon={<Store size={28} />}
              title="Não encontrámos resultados para esta pesquisa."
              message="Confirma as palavras ou tenta uma pesquisa diferente."
            />
          )}
        </section>
      ) : (
        <>
          <section className="section-block">
            <SectionHeader
              eyebrow={activeCategory !== 'todos' ? categoryLabel[activeCategory]?.toUpperCase() + ' PERTO DE TI' : 'PERTO DE TI'}
              title="Perto de ti"
              action={
                activeCategory !== 'todos' || keyword ? (
                  <button className="see-all" onClick={clearContext}>
                    Limpar
                  </button>
                ) : undefined
              }
            />
            {nearby === null ? (
              <EmptyState
                icon={<Store size={28} />}
                title="Não conseguimos carregar os negócios."
                message="Tenta novamente."
              />
            ) : nearby.length > 0 ? (
              <BusinessList items={nearby} onBusiness={onBusiness} />
            ) : (
              <EmptyState
                icon={<Store size={28} />}
                title="Ainda não existem negócios disponíveis nesta zona."
                message="Estamos a expandir. Tenta mais tarde."
              />
            )}
          </section>

          <section className="section-block">
            <SectionHeader eyebrow="EXPLORA POR NECESSIDADE" title="O que precisas?" />
            <div className="marketplace-needs">
              {marketplaceNeeds.map((need) => {
                const NeedIcon = needIconMap[need.icon];
                return (
                  <button
                    key={need.key}
                    className="marketplace-need"
                    onClick={() => handleNeed(need)}
                  >
                    <span className="marketplace-need-icon">
                      <NeedIcon size={16} />
                    </span>
                    <span>{need.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {popular.length > 0 && (
            <section className="section-block">
              <SectionHeader eyebrow="TENDÊNCIAS" title="Mais pedidos" />
              <BusinessList items={popular} onBusiness={onBusiness} />
            </section>
          )}

          {promos.length > 0 && (
            <section className="section-block">
              <SectionHeader eyebrow="PROMOÇÕES" title="Promoções" />
              <BusinessList items={promos} onBusiness={onBusiness} />
            </section>
          )}

          {signedIn && previous.length > 0 && (
            <section className="section-block">
              <SectionHeader eyebrow="PEDIR NOVAMENTE" title="Pedir novamente" />
              <BusinessList items={previous.slice(0, 3)} onBusiness={onBusiness} />
            </section>
          )}

          {signedIn && recommended.length > 0 && (
            <section className="section-block">
              <SectionHeader eyebrow="RECOMENDADOS" title="Recomendado para ti" />
              <BusinessList items={recommended} onBusiness={onBusiness} />
            </section>
          )}

          {!isSupabaseConfigured() && <p className="marketplace-demo-note">
            Conteúdo de demonstração. Dados reais chegam com o lançamento.
          </p>}
        </>
      )}
    </main>
  );
}