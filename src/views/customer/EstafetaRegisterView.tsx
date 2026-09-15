import { ArrowLeft, MessageCircle } from 'lucide-react';
import { repositories } from '@/repositories';
import { ApprovalSteps } from '@/components/explore/ApprovalSteps';

type Props = {
  onBack: () => void;
  onSupport: () => void;
};

const acceptedVehicles = ['Moto', 'Triciclo', 'Carro', 'Carrinha'];

export function EstafetaRegisterView({ onBack, onSupport }: Props) {
  const flow = repositories.explore.getEstafetaRegistration();

  return (
    <main className="page inner-page register-page">
      <header className="category-header">
        <button className="icon-button back-button" onClick={onBack} aria-label="Voltar">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">CONDUZ E GANHA</p>
          <h1>Estafeta Pedejá.</h1>
        </div>
      </header>

      <p className="register-intro">{flow.headline}</p>

      <p className="eyebrow">Veículos aceites</p>
      <div className="chips-row">
        {acceptedVehicles.map((vehicle) => (
          <span className="chip-pill" key={vehicle}>
            {vehicle}
          </span>
        ))}
      </div>

      <p className="eyebrow">{flow.requirementsLabel}</p>
      <ul className="requirement-list">
        {flow.requirements.map((requirement) => (
          <li key={requirement}>{requirement}</li>
        ))}
      </ul>

      <p className="eyebrow">{flow.stepsLabel}</p>
      <ApprovalSteps steps={flow.steps} />

      <p className="register-note">{flow.activationNote}</p>

      <div className="register-soon">
        <span className="chip chip-purple">Em preparação</span>
        <p>
          A inscrição para estafetas estará disponível em breve.
        </p>
        <p>
          O registo não atribui acesso: depois da análise e aprovação da equipa, recebes acesso ao
          área de Estafeta.
        </p>
      </div>

      <button type="button" className="btn-secondary register-support" onClick={onSupport}>
        <MessageCircle size={18} /> Falar com o Pedejá.
      </button>
    </main>
  );
}