import { Camera, Check, Package, Phone, Scale, ShieldCheck, User } from 'lucide-react';
import type { ParcelPackageDraft, ParcelRecipientDraft } from '@/types';
import type { ParcelSize } from '@/types';
import type { ParcelFieldErrors } from '@/services/parcel/validation';

type Props = {
  recipient: ParcelRecipientDraft;
  onRecipientChange: (recipient: ParcelRecipientDraft) => void;
  pkg: ParcelPackageDraft;
  onChange: (pkg: ParcelPackageDraft) => void;
  restrictionAcknowledged: boolean;
  onRestrictionChange: (acknowledged: boolean) => void;
  errors?: ParcelFieldErrors;
  packagePhoto: File | null;
  onPackagePhotoChange: (file: File | null) => void;
};

const sizes: { id: ParcelSize; label: string; detail: string }[] = [
  { id: 'pequeno', label: 'Pequeno', detail: 'Documentos, pequenas encomendas' },
  { id: 'medio', label: 'Médio', detail: 'Caixas, sacos de compras' },
  { id: 'grande', label: 'Grande', detail: 'Móveis, electrodomésticos' },
];

export function PackageStep({
  recipient,
  onRecipientChange,
  pkg,
  onChange,
  restrictionAcknowledged,
  onRestrictionChange,
  errors,
  packagePhoto,
  onPackagePhotoChange,
}: Props) {
  return (
    <div className="step-content">
      <p className="step-section-title">Quem recebe? <small>(obrigatório)</small></p>
      <p className="field-label">
        <span>Nome *</span>
        <div className="input-group">
          <User className="input-icon" size={18} />
          <input value={recipient.name} onChange={(e) => onRecipientChange({ ...recipient, name: e.target.value })} placeholder="Nome de quem recebe" />
        </div>
        {errors?.recipientName && <small className="field-error">{errors.recipientName}</small>}
      </p>
      <p className="field-label">
        <span>Telefone *</span>
        <div className="input-group">
          <Phone className="input-icon" size={18} />
          <input value={recipient.phone} onChange={(e) => onRecipientChange({ ...recipient, phone: e.target.value })} placeholder="+244 9xx xxx xxx" inputMode="tel" />
        </div>
        {errors?.recipientPhone && <small className="field-error">{errors.recipientPhone}</small>}
        <small className="input-hint">Usamos este número apenas para facilitar a entrega.</small>
      </p>
      <p className="field-label">
        <span>Instruções de entrega <small>(opcional)</small></span>
        <textarea className="rating-comment" rows={2} value={recipient.instructions ?? ''} onChange={(e) => onRecipientChange({ ...recipient, instructions: e.target.value })} placeholder="Ex.: Entregar ao porteiro, tocar duas vezes." />
      </p>

      <p className="field-label">
        <span>O que envias? *</span>
        <div className="input-group">
          <Package className="input-icon" size={18} />
          <input
            value={pkg.description}
            onChange={(e) => onChange({ ...pkg, description: e.target.value })}
            placeholder="Ex.: Documentos do trabalho"
          />
        </div>
        {errors?.description && <small className="field-error">{errors.description}</small>}
      </p>

      <div className="field-label"><span>Foto da encomenda <strong>*</strong></span><label className="prod-upload"><Camera size={18}/><span><b>{packagePhoto ? 'Foto pronta' : 'Fotografa a encomenda'}</b><small>{packagePhoto ? packagePhoto.name : 'Obrigatório antes de enviar'}</small></span><input hidden type="file" accept="image/jpeg,image/png,image/webp" capture="environment" onChange={e=>onPackagePhotoChange(e.target.files?.[0]??null)}/></label>{errors?.packagePhoto&&<small className="field-error">{errors.packagePhoto}</small>}</div>

      <p className="step-section-title">Tamanho *</p>
      <div className="size-options">
        {sizes.map((s) => (
          <button
            key={s.id}
            className={`size-option ${pkg.size === s.id ? 'selected' : ''}`}
            onClick={() => onChange({ ...pkg, size: s.id })}
          >
            <div>
              <strong>{s.label}</strong>
              <small>{s.detail}</small>
            </div>
            {pkg.size === s.id && <Check size={20} />}
          </button>
        ))}
      </div>

      <p className="field-label">
        <span>Peso estimado <small>(opcional)</small></span>
        <div className="input-group">
          <Scale className="input-icon" size={18} />
          <input
            type="number"
            min={0}
            step={0.5}
            value={pkg.approximateWeightKg ?? ''}
            placeholder="Em quilogramas"
            onChange={(e) =>
              onChange({
                ...pkg,
                approximateWeightKg: Number(e.target.value) > 0 ? Number(e.target.value) : undefined,
              })
            }
          />
        </div>
        <small className="input-hint">Ajuda a escolher o melhor veículo.</small>
      </p>

      <p className="field-label">
        <span>Conteúdo frágil?</span>
        <div className={`toggle-row ${pkg.isFragile ? 'on' : ''}`}>
          <span>
            Imagens, vidro, equipamentos <small>Requer cabine fechada (exceto pequenos).</small>
          </span>
          <button
            className={`toggle ${pkg.isFragile ? 'on' : ''}`}
            onClick={() => onChange({ ...pkg, isFragile: !pkg.isFragile })}
            aria-pressed={Boolean(pkg.isFragile)}
          >
            <span className="toggle-thumb" />
          </button>
        </div>
      </p>

      <p className="field-label">
        <span>Notas <small>(opcional)</small></span>
        <textarea
          className="rating-comment"
          rows={2}
          value={pkg.notes ?? ''}
          onChange={(e) => onChange({ ...pkg, notes: e.target.value })}
          placeholder="Ex.: Não dobrar."
        />
      </p>

      <button
        className={`restriction-check ${restrictionAcknowledged ? 'done' : ''}`}
        onClick={() => onRestrictionChange(!restrictionAcknowledged)}
        aria-pressed={restrictionAcknowledged}
      >
        <span className="restriction-box">{restrictionAcknowledged && <Check size={16} />}</span>
        <span>
          <ShieldCheck size={18} />
          Confirmo que a encomenda não contém artigos perigosos, ilegais ou proibidos por lei.
        </span>
      </button>
      {errors?.restriction && <small className="field-error">{errors.restriction}</small>}
    </div>
  );
}