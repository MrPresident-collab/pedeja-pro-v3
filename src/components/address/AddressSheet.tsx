import { useState } from 'react';
import { Briefcase, ChevronRight, Home, MapPin, Pencil, Plus, Trash2 } from 'lucide-react';
import { BottomSheet } from '@/components/BottomSheet';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { repositories } from '@/repositories';
import { showToast } from '@/components/toastStore';
import { isSupabaseConfigured } from '@/services/supabase';
import type { Address } from '@/types';

type Props = {
  open: boolean;
  eyebrow?: string;
  title?: string;
  confirmLabel?: string;
  closeOnSelect?: boolean;
  selectMode?: boolean;
  onSelect?: (address: Address) => void;
  onClose: () => void;
  onChanged: () => void;
};

type Mode = { kind: 'list' } | { kind: 'add' } | { kind: 'edit'; address: Address };

const labelOptions = ['Casa', 'Trabalho', 'Outro'];

function addressIcon(label: string) {
  if (label === 'Casa') return <Home size={19} />;
  if (label === 'Trabalho') return <Briefcase size={19} />;
  return <MapPin size={19} />;
}

export function AddressSheet({
  open,
  eyebrow = 'ENTREGAR EM',
  title = 'Escolhe o teu lugar',
  confirmLabel = 'Confirmar localização',
  closeOnSelect = true,
  selectMode = false,
  onSelect,
  onClose,
  onChanged,
}: Props) {
  const [mode, setMode] = useState<Mode>({ kind: 'list' });
  const [confirmAddress, setConfirmAddress] = useState<Address | null>(null);

  const [label, setLabel] = useState('Casa');
  const [customLabel, setCustomLabel] = useState('');
  const [line, setLine] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [instructions, setInstructions] = useState('');
  const [lineError, setLineError] = useState(false);
  const [saving, setSaving] = useState(false);

  const addresses = repositories.location.listAddresses();

  function resetForm() {
    setLabel('Casa');
    setCustomLabel('');
    setLine('');
    setNeighborhood('');
    setInstructions('');
    setLineError(false);
  }

  function beginAdd() {
    resetForm();
    setMode({ kind: 'add' });
  }

  function beginEdit(address: Address) {
    setLabel(address.label === 'Casa' || address.label === 'Trabalho' || address.label === 'Outro' ? address.label : 'Outro');
    setCustomLabel(address.label === 'Casa' || address.label === 'Trabalho' ? '' : address.label);
    setLine(address.line ?? '');
    setNeighborhood(address.neighborhood ?? '');
    setInstructions(address.deliveryInstructions ?? '');
    setLineError(false);
    setMode({ kind: 'edit', address });
  }

  async function handleSelect(address: Address) {
    if (selectMode) {
      showToast(`Destino: ${address.label}.`);
      onSelect?.(address);
      if (closeOnSelect) onClose();
      return;
    }
    if (!address.current) {
      try { await repositories.location.setDefault(address.id); onChanged(); } catch { showToast('Não foi possível alterar o endereço predefinido.'); }
    }
    showToast(`Entregar em ${address.label}.`);
    if (closeOnSelect) onClose();
  }

  function askDelete(address: Address) {
    if (address.current) {
      showToast('Escolhe outro endereço como atual antes de eliminar este.');
      return;
    }
    setConfirmAddress(address);
  }

  async function confirmDelete() {
    if (!confirmAddress) return;
    try { await repositories.location.removeAddress(confirmAddress.id); onChanged(); showToast('Endereço eliminado.'); } catch { showToast('Não foi possível eliminar o endereço.'); }
    setConfirmAddress(null);
  }

  async function save() {
    const addressLine = line.trim();
    if (addressLine.length < 5) { setLineError(true); return; }
    setSaving(true);
    try {
      const data: Partial<Omit<Address, 'id'>> = { label: label === 'Outro' ? customLabel.trim() || 'Outro' : label, line: addressLine };
      if (neighborhood.trim()) data.neighborhood = neighborhood.trim();
      if (instructions.trim()) data.deliveryInstructions = instructions.trim();
      if (mode.kind === 'edit') {
        data.coordinates = mode.address.coordinates;
        data.city = mode.address.city;
        await repositories.location.updateAddress(mode.address.id, data);
        showToast('Endereço atualizado.');
      } else {
        let coordinates: Address['coordinates'];
        if (isSupabaseConfigured()) {
          coordinates = await new Promise<Address['coordinates']>((resolve, reject) => navigator.geolocation.getCurrentPosition(
            (position) => resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }),
            () => reject(new Error('LOCATION_REQUIRED')), { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
          ));
        }
        await repositories.location.addAddress({ id: `addr-${Date.now()}`, ...data, coordinates } as Address);
        showToast('Endereço adicionado.');
      }
      onChanged();
      setMode({ kind: 'list' });
    } catch (error) {
      if (error instanceof Error && error.message === 'LOCATION_REQUIRED') showToast('Permite a localização do dispositivo para guardar este endereço.');
      else showToast('Não foi possível guardar o endereço.');
    } finally { setSaving(false); }
  }

  const editing = mode.kind === 'edit';
  const sheetTitle = editing ? 'Editar endereço' : mode.kind === 'add' ? 'Novo endereço' : title;
  const sheetEyebrow = editing || mode.kind === 'add' ? 'ENDEREÇO' : eyebrow;

  return (
    <>
      <BottomSheet open={open} onClose={onClose} eyebrow={sheetEyebrow} title={sheetTitle}>
        {mode.kind === 'list' ? (
          <div className="sheet-content">
            {addresses.length === 0 ? (
              <div className="address-empty">
                <MapPin size={20} />
                <p>Ainda não tens endereços. Adiciona o primeiro para calcular a entrega.</p>
              </div>
            ) : (
              <div className="address-list">
                {addresses.map((address) => (
                  <div className="address-row" key={address.id}>
                    <button className="address-row-select" onClick={() => handleSelect(address)}>
                      <span className="address-row-icon">{addressIcon(address.label)}</span>
                      <span className="address-row-main">
                        <strong>{address.label}</strong>
                        <small>{address.line}</small>
                      </span>
                      {address.current && <span className="profile-badge">Atual</span>}
                      <ChevronRight size={16} />
                    </button>
                    <div className="address-row-actions">
                      <button
                        className="icon-button icon-button-sm"
                        aria-label={`Editar ${address.label}`}
                        onClick={() => beginEdit(address)}
                      >
                        <Pencil size={15} />
                      </button>
                      <button
                        className="icon-button icon-button-sm danger-ic"
                        aria-label={`Eliminar ${address.label}`}
                        onClick={() => askDelete(address)}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button className="add-address" onClick={beginAdd}>
              <Plus size={18} /> Adicionar endereço
            </button>

            {selectMode ? null : (
              <div className="location-note">
                <MapPin size={18} />
                <span>
                  <strong>Por que pedimos isto?</strong>
                  <small>Para encontrar o caminho certo e entregar sem atrasos.</small>
                </span>
              </div>
            )}

            <button className="btn-primary" onClick={onClose}>
              {confirmLabel}
            </button>
          </div>
        ) : (
          <div className="sheet-content">
            <p className="field-label">
              <span>Tipo de endereço</span>
              <span className="label-chips">
                {labelOptions.map((option) => (
                  <button
                    key={option}
                    className={`label-chip ${label === option ? 'selected' : ''}`}
                    onClick={() => {
                      setLabel(option);
                      if (option !== 'Outro' && customLabel) setCustomLabel('');
                    }}
                  >
                    {option}
                  </button>
                ))}
              </span>
            </p>

            {label === 'Outro' && (
              <p className="field-label">
                <span>Nome do endereço</span>
                <div className="input-group">
                  <MapPin className="input-icon" size={18} />
                  <input
                    value={customLabel}
                    onChange={(e) => {
                      setCustomLabel(e.target.value);
                      setLineError(false);
                    }}
                    placeholder="Ex.: Casa da avó"
                  />
                </div>
              </p>
            )}

            <p className="field-label">
              <span>Endereço *</span>
              <div className="input-group">
                <MapPin className="input-icon" size={18} />
                <input
                  value={line}
                  onChange={(e) => {
                    setLine(e.target.value);
                    if (e.target.value.trim().length >= 5) setLineError(false);
                  }}
                  placeholder="Rua, bairro, referência"
                />
              </div>
              {lineError && <small className="field-error">Escreve o teu endereço completo.</small>}
            </p>

            <p className="field-label">
              <span>Bairro <small>(opcional)</small></span>
              <div className="input-group">
                <input
                  value={neighborhood}
                  onChange={(e) => setNeighborhood(e.target.value)}
                  placeholder="Ex.: Talatona"
                />
              </div>
            </p>

            <p className="field-label">
              <span>Instruções de entrega <small>(opcional)</small></span>
              <textarea
                className="rating-comment"
                rows={3}
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="Ex.: Portão branco, perto do mercado."
              />
            </p>

            <button
              className="btn-primary"
              disabled={line.trim().length < 5 || (label === 'Outro' && !customLabel.trim())}
              onClick={() => void save()}
            >
              {saving ? 'A guardar…' : 'Guardar endereço'}
            </button>
            <button className="btn-secondary" onClick={() => setMode({ kind: 'list' })}>
              Voltar
            </button>
          </div>
        )}
      </BottomSheet>

      <ConfirmDialog
        open={confirmAddress !== null}
        title="Eliminar endereço?"
        message={
          confirmAddress
            ? `Queres remover "${confirmAddress.label}" (${confirmAddress.line}) dos teus endereços?`
            : undefined
        }
        confirmLabel="Eliminar"
        onConfirm={confirmDelete}
        onCancel={() => setConfirmAddress(null)}
      />
    </>
  );
}