import { ImageIcon } from 'lucide-react';

type Props = {
  label: string;
  // TODO(media): as imagens reais serão ficheiros locais; o placeholder apenas marca o espaço.
};

export function ExploreImagePlaceholder({ label }: Props) {
  return (
    <div className="img-placeholder" role="img" aria-label={label}>
      <span className="img-placeholder-icon" aria-hidden="true">
        <ImageIcon size={18} />
      </span>
      <span className="img-placeholder-label">{label}</span>
    </div>
  );
}