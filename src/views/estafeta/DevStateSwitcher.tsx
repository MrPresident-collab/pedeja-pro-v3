import { useState } from 'react';
import type { RiderRepository, DriverApprovalStatus, DriverAvailabilityStatus } from '@/repositories/riderTypes';
import { __devSetRiderState } from '@/repositories/riderMock';

const approvalLabels: Record<DriverApprovalStatus, string> = {
  pending_documents: 'Documentos pendentes',
  pending_review: 'Em revisão',
  approved: 'Aprovado',
  rejected: 'Rejeitado',
  suspended: 'Suspenso',
};

const availabilityLabels: Record<DriverAvailabilityStatus, string> = {
  offline: 'Offline',
  online_searching: 'A procurar',
  offer_received: 'Oferta recebida',
  on_delivery: 'Em entrega',
  blocked: 'Bloqueado',
};

type Props = {
  riderRepo: RiderRepository;
  onChanged: () => void;
};

export function DevStateSwitcher({ riderRepo, onChanged }: Props) {
  const [expanded, setExpanded] = useState(false);
  const approval = riderRepo.getApprovalStatus();
  const availability = riderRepo.getAvailabilityStatus();

  if (!import.meta.env.DEV) return null;

  function cycleApproval() {
    const order: DriverApprovalStatus[] = [
      'pending_documents',
      'pending_review',
      'approved',
      'rejected',
      'suspended',
    ];
    const next = order[(order.indexOf(approval) + 1) % order.length];
    __devSetRiderState({ approval: next });
    onChanged();
  }

  function cycleAvailability() {
    const order: DriverAvailabilityStatus[] = [
      'offline',
      'online_searching',
      'on_delivery',
      'blocked',
    ];
    const next = order[(order.indexOf(availability) + 1) % order.length];
    __devSetRiderState({ availability: next });
    onChanged();
  }

  return (
    <div className="dev-switcher-container">
      <button
        className="dev-switcher-toggle"
        onClick={() => setExpanded((e) => !e)}
        aria-label="DEV state switcher"
      >
        DEV
      </button>
      {expanded && (
        <div className="dev-switcher-panel">
          <p className="dev-switcher-title">Estado de teste</p>
          <button className="dev-switcher-btn" onClick={cycleApproval}>
            <span>Aprovação</span>
            <strong>{approvalLabels[approval]}</strong>
          </button>
          <button className="dev-switcher-btn" onClick={cycleAvailability}>
            <span>Disponibilidade</span>
            <strong>{availabilityLabels[availability]}</strong>
          </button>
        </div>
      )}
    </div>
  );
}
