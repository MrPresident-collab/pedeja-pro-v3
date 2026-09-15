import type { ReactNode } from 'react';
import { ArrowUpRight, ChevronRight } from 'lucide-react';

type Props = {
  title: string;
  detail?: string;
  icon?: ReactNode;
  href?: string;
  onClick?: () => void;
};

export function ExploreLinkRow({ title, detail, icon, href, onClick }: Props) {
  const content = (
    <>
      {icon && <span className="explore-row-icon">{icon}</span>}
      <span className="explore-row-main">
        <strong>{title}</strong>
        {detail && <small>{detail}</small>}
      </span>
      <span className="explore-row-chevron" aria-hidden="true">
        {href ? <ArrowUpRight size={17} /> : <ChevronRight size={17} />}
      </span>
    </>
  );

  if (href) {
    return (
      <a className="explore-row" href={href} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    );
  }

  return (
    <button className="explore-row" onClick={onClick}>
      {content}
    </button>
  );
}