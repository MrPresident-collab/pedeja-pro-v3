import { ChevronUp, Play } from 'lucide-react';
import type { ExploreVideoItem } from '@/data/explore';

type Props = {
  video: ExploreVideoItem;
  expanded: boolean;
  onExpand: (video: ExploreVideoItem) => void;
  onCollapse: () => void;
};

// Preview de vídeo sempre visível; expande in-loco quando pressionado o Play.
// Sem thumbnails falsas, sem durações inventadas, sem conteúdo fabricado.
export function InAppVideoPlaceholder({ video, expanded, onExpand, onCollapse }: Props) {
  const ready = Boolean(video.sourceUrl);

  if (expanded) {
    return (
      <div className="video-expanded">
        <div className="video-expanded-top">
          <strong>{video.title}</strong>
          <button type="button" className="video-collapse" onClick={onCollapse} aria-label="Reduzir vídeo">
            <ChevronUp size={15} /> Reduzir
          </button>
        </div>
        {ready ? (
          <video
            className="video-stage"
            src={video.sourceUrl}
            controls
            playsInline
            preload="metadata"
          />
        ) : (
          <div className="video-stage">
            <span className="video-stage-play" aria-hidden="true">
              <Play size={26} fill="currentColor" />
            </span>
            <span className="video-stage-note">
              Vídeo em preparação — será reproduzido dentro do Pedejá
            </span>
          </div>
        )}
        {video.description && <p className="video-meta">{video.description}</p>}
      </div>
    );
  }

  return (
    <button
      type="button"
      className="video-ph"
      onClick={() => onExpand(video)}
      aria-label={`Ver o vídeo "${video.title}"`}
    >
      <span className="video-ph-media">
        <span className="video-ph-play" aria-hidden="true">
          <Play size={20} fill="currentColor" />
        </span>
        {!ready && <span className="video-ph-badge">Vídeo em breve</span>}
        {!ready && <span className="video-ph-hint">Reprodução dentro do Pedejá</span>}
      </span>
      <span className="video-ph-body">
        <strong>{video.title}</strong>
        {video.description && <small>{video.description}</small>}
      </span>
    </button>
  );
}