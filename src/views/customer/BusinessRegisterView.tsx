import { ArrowLeft, MessageCircle } from 'lucide-react';
import { repositories } from '@/repositories';
import { exploreBusinessCategories } from '@/data/explore';
import { ApprovalSteps } from '@/components/explore/ApprovalSteps';
import { BusinessCategoryCard } from '@/components/explore/BusinessCategoryCard';

type Props = {
  onBack: () => void;
  onSupport: () => void;
};

export function BusinessRegisterView({ onBack, onSupport }: Props) {
  const flow = repositories.explore.getBusinessRegistration();

  return (
    <main className="page inner-page register-page">
      <header className="category-header">
        <button className="icon-button back-button" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">PARA NEGÓCIOS</p>
          <h1>{flow.title}</h1>
        </div>
      </header>

      <p className="register-intro">{flow.description}</p>

      <p className="eyebrow">{flow.stepsLabel}</p>
      <ApprovalSteps steps={flow.steps} />

      <p className="register-note">{flow.secondaryInfo}</p>

      <p className="eyebrow">Categorias de negócio</p>
      {exploreBusinessCategories.map((category) => (
        <BusinessCategoryCard key={category.id} category={category} />
      ))}

      <div className="register-soon">
        <span className="chip chip-purple">Em preparação</span>
        <p>
          O formulário de registo será lançado em breve. Quando estiver disponível, será multi-passo e
          adaptado a cada categoria de negócio.
        </p>
        <p>Enquanto isso, podes tirar dúvidas pelos canais de apoio do Pedejá.</p>
      </div>

      <button type="button" className="btn-secondary register-support" onClick={onSupport}>
        <MessageCircle size={18} /> Falar com o Pedejá.
      </button>
    </main>
  );
}