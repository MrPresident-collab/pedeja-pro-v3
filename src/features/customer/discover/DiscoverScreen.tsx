import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Search, Sparkles, Tag, UtensilsCrossed, ShoppingBag, Store, Baby, Heart, Laptop, Pill, SprayCan, Shirt, Sofa, CookingPot } from 'lucide-react';

type DiscoverScreenProps = { onBack?: () => void };

const categories = [
  ['Beleza', SprayCan], ['Perfumes', Sparkles], ['Bebé', Baby], ['Teen', Heart],
  ['Moda feminina', Shirt], ['Moda masculina', Shirt], ['Decoração', Sofa], ['Medicamentos', Pill],
  ['Eletrónica', Laptop], ['Cabelo', Sparkles], ['Eletrodomésticos', CookingPot], ['Comida', UtensilsCrossed],
];

const places = [
  { name: 'Restaurantes', detail: 'Comida, take-away e cozinhas locais', icon: UtensilsCrossed },
  { name: 'Compras', detail: 'Comércio local e negócios perto de ti', icon: ShoppingBag },
  { name: 'Lojas', detail: 'Supermercados, centros comerciais e grandes marcas', icon: Store },
];

export default function DiscoverScreen({ onBack }: DiscoverScreenProps) {
  const [query, setQuery] = useState('');
  const [mode, setMode] = useState<'perto' | 'mapa'>('perto');
  const filtered = useMemo(() => categories.filter(([name]) => String(name).toLowerCase().includes(query.toLowerCase())), [query]);

  return <main className="screen discover-screen">
    {onBack && <button className="screen-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>}
    <header className="section-page-heading"><span className="eyebrow">DESCOBRIR</span><h1>Encontra o que procuras.</h1><p>Explora comida, produtos, lojas e negócios perto de ti.</p></header>
    <label className="discover-search"><Search size={19} /><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Pesquisar produto, loja ou negócio" /></label>
    <div className="discover-toggle"><button className={mode === 'perto' ? 'active' : ''} onClick={() => setMode('perto')}><MapPin size={16} />Perto de ti</button><button className={mode === 'mapa' ? 'active' : ''} onClick={() => setMode('mapa')}><MapPin size={16} />Mapa</button></div>
    {mode === 'mapa' ? <section className="discovery-map"><MapPin size={30} /><strong>Descoberta no mapa</strong><p>Os negócios e pontos de interesse aparecerão aqui conforme tivermos localização e parceiros disponíveis.</p></section> : <>
      <div className="section-row"><h2>Categorias</h2><button>Ver tudo</button></div>
      <div className="category-grid">{filtered.map(([name, Icon]) => { const CategoryIcon = Icon as typeof Sparkles; return <button className="category-chip" key={String(name)}><span><CategoryIcon size={18} /></span>{name as string}</button>; })}</div>
      <div className="section-row"><h2>Explora por tipo</h2></div>
      <div className="discover-place-list">{places.map(({ name, detail, icon: Icon }) => <button key={name} className="discover-place"><span className="discover-place-icon"><Icon size={21} /></span><span><strong>{name}</strong><small>{detail}</small></span><ChevronRight size={18} /></button>)}</div>
      <section className="discover-promo"><div><span><Tag size={16} /> PROMOÇÕES</span><h2>Oportunidades perto de ti.</h2><p>Descobre produtos e negócios com ofertas disponíveis.</p></div><Sparkles size={38} /></section>
    </>}
  </main>;
}
