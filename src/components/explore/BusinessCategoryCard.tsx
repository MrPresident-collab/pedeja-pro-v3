import { ShoppingBag, Store, Utensils } from 'lucide-react';
import type { ExploreBusinessCategory } from '@/data/explore';

type Props = {
  category: ExploreBusinessCategory;
};

const icons = {
  comida: Utensils,
  comerciantes: Store,
  lojas: ShoppingBag,
} as const;

const includesLabel = 'Isto inclui:';

export function BusinessCategoryCard({ category }: Props) {
  const Icon = icons[category.id];
  return (
    <div className={`business-category ${category.id}`}>
      <div className="business-category-head">
        <span className="business-category-icon" aria-hidden="true">
          <Icon size={17} />
        </span>
        <strong>{category.title}</strong>
      </div>
      <small>{category.description}</small>
      {category.includes.length > 0 && (
        <>
          <p className="explore-label">{includesLabel}</p>
          <div className="chips-row">
            {category.includes.map((item) => (
              <span className="chip-pill" key={item}>
                {item}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}