import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import type { ExploreFaqItem } from '@/data/explore';

type Props = {
  items: ExploreFaqItem[];
};

export function FaqAccordion({ items }: Props) {
  const [openKey, setOpenKey] = useState<string | null>(null);

  return (
    <div className="faq-card">
      {items.map((item) => {
        const key = item.q;
        const open = openKey === key;
        return (
          <div className={`faq-item ${open ? 'open' : ''}`} key={key}>
            <button
              className="faq-question"
              onClick={() => setOpenKey(open ? null : key)}
              aria-expanded={open}
            >
              <span>{item.q}</span>
              <span className="faq-chevron" aria-hidden="true">
                <ChevronRight size={16} />
              </span>
            </button>
            {open && (
              <div className="faq-answer-inner">
                {item.a.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}