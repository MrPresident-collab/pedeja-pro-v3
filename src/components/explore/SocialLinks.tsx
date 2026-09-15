import { Facebook, Instagram, Linkedin } from 'lucide-react';
import { showToast } from '@/components/toastStore';
import type { ExploreSocialLink } from '@/data/explore';

type Props = {
  links: ExploreSocialLink[];
};

const icons = {
  facebook: Facebook,
  instagram: Instagram,
  linkedin: Linkedin,
} as const;

export function SocialLinks({ links }: Props) {
  return (
    <div className="social-row">
      {links.map((link) => {
        const Icon = icons[link.id];
        if (link.url) {
          return (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${link.label} (abre numa nova janela)`}
            >
              <Icon size={18} /> {link.label}
            </a>
          );
        }
        return (
          <button
            key={link.id}
            onClick={() => showToast('Perfil do Pedejá em preparação.')}
            aria-label={`${link.label} (link em preparação)`}
          >
            <Icon size={18} /> {link.label}
          </button>
        );
      })}
    </div>
  );
}