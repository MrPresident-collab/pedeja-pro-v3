import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
};

// Secção estática: o conteúdo está sempre visível na página, sem accordion.
export function ExploreSection({ title, description, icon, children }: Props) {
  return (
    <section className="explore-section">
      <header className="explore-section-head">
        {icon && <span className="explore-panel-icon" aria-hidden="true">{icon}</span>}
        <h2 className="explore-panel-text">
          <strong>{title}</strong>
          {description && <small>{description}</small>}
        </h2>
      </header>
      <div className="explore-section-content">{children}</div>
    </section>
  );
}