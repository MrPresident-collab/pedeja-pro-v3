import { useState } from 'react';
import { MapPin, Navigation } from 'lucide-react';
import { AddressSheet } from '@/components/address/AddressSheet';
import { repositories } from '@/repositories';
import { showToast } from '@/components/toastStore';
import type { Address } from '@/types';

type Props = {
  destination: Address | null;
  onChange: (address: Address | null) => void;
};

export function DestinationStep({ destination, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const addresses = repositories.location.listAddresses();

  return (
    <div className="step-content">
      {addresses.length > 0 && (
        <>
          <p className="step-section-title">Destino rápido</p>
          <div className="quick-addresses">
            {addresses.map((address) => (
              <button
                key={address.id}
                className={`quick-address ${destination?.id === address.id ? 'selected' : ''}`}
                onClick={() => {
                  onChange(address);
                  showToast(`Destino: ${address.label}.`);
                }}
              >
                <MapPin size={16} />
                <span>
                  <strong>{address.label}</strong>
                  <small>{address.line}</small>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <button className="btn-secondary route-change" onClick={() => setOpen(true)}>
        <Navigation size={18} /> {destination ? 'Escolher outro destino' : 'Escolher destino'}
      </button>

      {destination && (
        <div className="route-block">
          <div className="route-block-top">
            <span className="route-pin route-pin-b">B</span>
            <div className="route-block-main">
              <strong>{destination.label}</strong>
              <small>{destination.line}</small>
            </div>
          </div>
        </div>
      )}

      <AddressSheet
        open={open}
        selectMode
        eyebrow="ENTREGAR EM"
        title="Escolhe o destino"
        confirmLabel="Fechar"
        onClose={() => setOpen(false)}
        onSelect={onChange}
        onChanged={() => undefined}
      />
    </div>
  );
}