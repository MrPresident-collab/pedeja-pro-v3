import { ArrowLeft, FileText, MessageCircle, ShieldCheck } from 'lucide-react';
import { repositories } from '@/repositories';
import { contentTopics, defaultTopic } from '@/data/content';

type Props = {
  docKey: string;
  onBack: () => void;
  onSupport: () => void;
};

export function LegalDocView({ docKey, onBack, onSupport }: Props) {
  const doc = repositories.explore.getLegal().find((d) => d.key === docKey);
  const title = doc?.title ?? 'Documento';
  const content = contentTopics[title] ?? defaultTopic;

  return (
    <main className="page inner-page legal-page">
      <header className="category-header">
        <button className="icon-button back-button" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">LEGAL</p>
          <h1>{title}</h1>
        </div>
      </header>

      <div className="legal-document-card">
        <div className="legal-document-heading">
          <span className="legal-doc-icon" aria-hidden="true"><FileText size={22} /></span>
          <div><span className="chip">{content.eyebrow}</span><small>Versão informativa · Pedejá</small></div>
        </div>
        {content.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
        <div className="legal-disclaimer"><ShieldCheck size={16} /> Este conteúdo explica o funcionamento atual da plataforma. Em caso de dúvida, fala com o suporte.</div>
      </div>

      <button type="button" className="support-link" onClick={onSupport}>
        <MessageCircle size={18} /> Dúvidas? Fala connosco
      </button>
    </main>
  );
}