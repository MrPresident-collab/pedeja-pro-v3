import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Camera,
  Check,
  ChevronRight,
  Contact,
  FileText,
  KeyRound,
  Map,
  MapPin,
  Package,
  Phone,
  Search,
  ShieldAlert,
  ShoppingBag,
  Utensils,
  X,
} from 'lucide-react';
import './enviar.css';

type Step = 'route' | 'recipient' | 'type' | 'size' | 'fragile' | 'vehicle' | 'prohibited' | 'photo' | 'review';
type RecipientMode = 'self' | 'other';
type PackageType = 'document' | 'keys' | 'shopping' | 'food' | 'other';
type PackageSize = 'small' | 'medium' | 'large';
type VehicleType = 'moto' | 'kupapata' | 'car';

type FormState = {
  senderAddress: string;
  destinationAddress: string;
  recipientMode: RecipientMode;
  recipientName: string;
  recipientPhone: string;
  alternatePhone: string;
  note: string;
  packageType: PackageType | '';
  packageDescription: string;
  packageSize: PackageSize | '';
  packageWeight: string;
  fragile: boolean;
  vehicleType: VehicleType | '';
  prohibitedConfirmed: boolean;
  packagePhoto: File | null;
};

const initialForm: FormState = {
  senderAddress: '',
  destinationAddress: '',
  recipientMode: 'self',
  recipientName: '',
  recipientPhone: '+244 ',
  alternatePhone: '+244 ',
  note: '',
  packageType: '',
  packageDescription: '',
  packageSize: '',
  packageWeight: '',
  fragile: false,
  vehicleType: '',
  prohibitedConfirmed: false,
  packagePhoto: null,
};

const recentAddresses = [
  { label: 'Casa', value: 'Casa' },
  { label: 'Trabalho', value: 'Talatona' },
];

const packageTypes: Array<{ value: PackageType; label: string; icon: typeof FileText }> = [
  { value: 'document', label: 'Doc', icon: FileText },
  { value: 'keys', label: 'Chaves', icon: KeyRound },
  { value: 'shopping', label: 'Compra', icon: ShoppingBag },
  { value: 'food', label: 'Comida', icon: Utensils },
  { value: 'other', label: 'Outro', icon: Package },
];

const sizeOptions: Array<{ value: PackageSize; label: string; detail: string }> = [
  { value: 'small', label: '0–10 kg', detail: 'Moto' },
  { value: 'medium', label: '10–20 kg', detail: 'Moto / Kupapata' },
  { value: 'large', label: '20 kg+', detail: 'Car / Carrinha' },
];

const vehicleOptions: Array<{ value: VehicleType; label: string; detail: string; availableFor: PackageSize[] }> = [
  { value: 'moto', label: 'Moto', detail: 'Para volumes até 10 kg', availableFor: ['small', 'medium'] },
  { value: 'kupapata', label: 'Kupapata', detail: 'Ideal para volumes de 10–20 kg', availableFor: ['medium', 'large'] },
  { value: 'car', label: 'Car / Carrinha', detail: 'Para volumes acima de 20 kg', availableFor: ['large'] },
];

function formatWeight(value: string) {
  return value ? `${value} kg` : 'Não indicado';
}

export default function EnviarScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('route');
  const [form, setForm] = useState<FormState>(initialForm);
  const [mapOpen, setMapOpen] = useState(false);
  const [prohibitedOpen, setProhibitedOpen] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (photoPreview) URL.revokeObjectURL(photoPreview);
    };
  }, [photoPreview]);

  const availableVehicles = useMemo(() => {
    if (!form.packageSize) return vehicleOptions;
    return vehicleOptions.filter(vehicle => vehicle.availableFor.includes(form.packageSize as PackageSize));
  }, [form.packageSize]);

  const recommendedVehicle = useMemo<VehicleType | ''>(() => {
    if (form.packageSize === 'small') return 'moto';
    if (form.packageSize === 'medium') return 'kupapata';
    if (form.packageSize === 'large') return 'car';
    return '';
  }, [form.packageSize]);

  const canContinue = useMemo(() => {
    if (step === 'route') return form.senderAddress.trim().length >= 2 && form.destinationAddress.trim().length >= 2;
    if (step === 'recipient') {
      if (form.recipientMode === 'self') return true;
      return form.recipientName.trim().length >= 1 && form.recipientPhone.replace(/\s/g, '').length >= 7;
    }
    if (step === 'type') return Boolean(form.packageType);
    if (step === 'size') return Boolean(form.packageSize) && Number(form.packageWeight || 0) > 0;
    if (step === 'fragile') return true;
    if (step === 'vehicle') return Boolean(form.vehicleType);
    if (step === 'prohibited') return form.prohibitedConfirmed;
    if (step === 'photo') return Boolean(form.packagePhoto);
    return true;
  }, [form, step]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));

  const chooseSize = (value: PackageSize) => {
    update('packageSize', value);
    const nextVehicle = vehicleOptions.find(vehicle => vehicle.value === recommendedVehicle && vehicle.availableFor.includes(value));
    update('vehicleType', nextVehicle?.value ?? '');
  };

  const next = () => {
    if (!canContinue) return;
    if (step === 'route') setStep('recipient');
    else if (step === 'recipient') setStep('type');
    else if (step === 'type') setStep('size');
    else if (step === 'size') setStep('fragile');
    else if (step === 'fragile') setStep('vehicle');
    else if (step === 'vehicle') setStep('prohibited');
    else if (step === 'prohibited') setStep('photo');
    else if (step === 'photo') setStep('review');
  };

  const back = () => {
    if (mapOpen) {
      setMapOpen(false);
      return;
    }
    if (step === 'route') onBack();
    else if (step === 'recipient') setStep('route');
    else if (step === 'type') setStep('recipient');
    else if (step === 'size') setStep('type');
    else if (step === 'fragile') setStep('size');
    else if (step === 'vehicle') setStep('fragile');
    else if (step === 'prohibited') setStep('vehicle');
    else if (step === 'photo') setStep('prohibited');
    else setStep('photo');
  };

  const selectCurrentLocation = () => {
    if (!navigator.geolocation) {
      update('senderAddress', 'Localização atual');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      () => update('senderAddress', 'Localização atual'),
      () => update('senderAddress', 'Localização atual'),
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handlePhoto = (file: File | null) => {
    if (!file) return;
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    update('packagePhoto', file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const titleMap: Record<Step, string> = {
    route: 'De onde para onde?',
    recipient: 'Quem recebe?',
    type: 'O que é?',
    size: 'Tamanho',
    fragile: 'Frágil?',
    vehicle: 'Viatura',
    prohibited: 'Segurança do envio',
    photo: 'Foto da encomenda',
    review: 'Resumo do envio',
  };

  const stepNumber = ['route', 'recipient', 'type', 'size', 'fragile', 'vehicle', 'prohibited', 'photo', 'review'].indexOf(step) + 1;
  const totalSteps = 9;

  return (
    <main className="screen enviar-screen">
      <header className="enviar-header">
        <button className="enviar-back" onClick={back} aria-label="Voltar"><ArrowLeft size={21} /></button>
        <div><span>ENVIAR</span><strong>{stepNumber} de {totalSteps}</strong></div>
        <div className="enviar-header-icon"><Package size={20} /></div>
      </header>

      <div className="enviar-warning"><ShieldAlert size={17} /><span>Garanta que a encomenda está bem embalada e fechada.</span></div>
      <div className="enviar-progress" aria-label={`Etapa ${stepNumber} de ${totalSteps}`}><span style={{ width: `${stepNumber / totalSteps * 100}%` }} /></div>

      <section className="enviar-content">
        <div className="enviar-heading"><span className="enviar-eyebrow">ENVIA COM PEDEJÁ</span><h1>{titleMap[step]}</h1><p>Envia documentos, encomendas e pequenos volumes com acompanhamento Pedejá.</p></div>

        {step === 'route' && <div className="enviar-form route-form">
          <button className="location-primary" type="button" onClick={selectCurrentLocation}><MapPin size={19} /><span>Usar minha localização atual</span></button>
          <button className="map-secondary" type="button" onClick={() => setMapOpen(true)}><Map size={19} /><span>Escolher no mapa</span><ChevronRight size={17} /></button>
          <div className="recent-block"><div className="section-label">Recentes</div>{recentAddresses.map(address => <button className="recent-row" key={address.label} type="button" onClick={() => update('senderAddress', address.value)}><MapPin size={16} /><span><strong>{address.label}</strong><small>{address.value}</small></span></button>)}</div>
          <div className="enviar-field-card"><div className="field-icon"><MapPin size={19} /></div><label>Destino<input value={form.destinationAddress} onChange={e => update('destinationAddress', e.target.value)} placeholder="Pesquisar morada, bairro ou referência" /><small>O destino pode ser ajustado no mapa.</small></label><Search className="field-end-icon" size={18} /></div>
        </div>}

        {step === 'recipient' && <div className="enviar-form">
          <div className="choice-grid two"><button type="button" className={`choice-card ${form.recipientMode === 'self' ? 'selected' : ''}`} onClick={() => update('recipientMode', 'self')}><span className="radio-dot" /><strong>Eu mesmo</strong></button><button type="button" className={`choice-card ${form.recipientMode === 'other' ? 'selected' : ''}`} onClick={() => update('recipientMode', 'other')}><span className="radio-dot" /><strong>Outra pessoa</strong></button></div>
          {form.recipientMode === 'other' && <>
            <div className="enviar-field-card"><div className="field-icon"><Contact size={19} /></div><label>Nome<input value={form.recipientName} onChange={e => update('recipientName', e.target.value)} placeholder="Nome completo" /></label></div>
            <div className="enviar-field-card"><div className="field-icon"><Phone size={19} /></div><label>Número<div className="phone-row"><input value={form.recipientPhone} onChange={e => update('recipientPhone', e.target.value)} placeholder="+244 9xx xxx xxx" inputMode="tel" /><button type="button" aria-label="Importar contacto" title="Importar contacto"><Contact size={18} /></button></div></label></div>
            <div className="enviar-field-card"><div className="field-icon"><Phone size={19} /></div><label>Número alternativo <em>(opcional)</em><input value={form.alternatePhone} onChange={e => update('alternatePhone', e.target.value)} placeholder="+244 9xx xxx xxx" inputMode="tel" /></label></div>
            <label className="plain-field">Nota<textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="Ex.: Portão azul, falar com a vizinha..." rows={3} /></label>
          </>}
        </div>}

        {step === 'type' && <div className="enviar-form"><div className="package-type-grid">{packageTypes.map(({ value, label, icon: Icon }) => <button key={value} type="button" className={`package-type-card ${form.packageType === value ? 'selected' : ''}`} onClick={() => update('packageType', value)}><Icon size={22} /><strong>{label}</strong></button>)}</div><label className="plain-field">Descrição <em>(opcional para categorias específicas)</em><textarea value={form.packageDescription} onChange={e => update('packageDescription', e.target.value)} placeholder="Ex.: documentos, chaves, roupa..." rows={3} /></label></div>}

        {step === 'size' && <div className="enviar-form"><div className="size-grid">{sizeOptions.map(option => <button key={option.value} type="button" className={`size-card ${form.packageSize === option.value ? 'selected' : ''}`} onClick={() => chooseSize(option.value)}><strong>{option.label}</strong><span>{option.detail}</span></button>)}</div><label className="plain-field">Peso aproximado<input value={form.packageWeight} onChange={e => update('packageWeight', e.target.value)} placeholder="Ex.: 8" inputMode="decimal" /><small>O peso ajuda a selecionar a viatura adequada.</small></label></div>}

        {step === 'fragile' && <div className="enviar-form"><div className="choice-grid two"><button type="button" className={`choice-card ${form.fragile ? 'selected' : ''}`} onClick={() => update('fragile', true)}><span className="radio-dot" /><strong>Sim</strong></button><button type="button" className={`choice-card ${!form.fragile ? 'selected' : ''}`} onClick={() => update('fragile', false)}><span className="radio-dot" /><strong>Não</strong></button></div>{form.fragile && <div className="fragile-warning"><ShieldAlert size={19} /><div><strong>Encomenda frágil</strong><p>Será aplicada a tarifa correspondente no checkout e o estafeta receberá um aviso especial de manuseamento.</p></div></div>}</div>}

        {step === 'vehicle' && <div className="enviar-form"><div className="vehicle-list">{availableVehicles.map(vehicle => { const recommended = vehicle.value === recommendedVehicle; return <button key={vehicle.value} type="button" className={`vehicle-card ${recommended ? 'recommended' : ''} ${form.vehicleType === vehicle.value ? 'selected' : ''}`} onClick={() => update('vehicleType', vehicle.value)}><div className="vehicle-copy"><span className="vehicle-label">{recommended && <b>RECOMENDADA</b>}</span><strong>{vehicle.label}</strong><small>{vehicle.detail}</small></div><div className="vehicle-price">A calcular</div><span className="vehicle-check">{form.vehicleType === vehicle.value ? <Check size={16} /> : null}</span></button>; })}</div><p className="muted-note">A tarifa da viatura será calculada pelo backend no checkout. Os valores apresentados nesta etapa não são estimativas.</p></div>}

        {step === 'prohibited' && <div className="enviar-form"><button type="button" className={`prohibited-check ${form.prohibitedConfirmed ? 'checked' : ''}`} onClick={() => update('prohibitedConfirmed', !form.prohibitedConfirmed)}><span className="checkbox-box">{form.prohibitedConfirmed && <Check size={15} />}</span><span>Confirmo que <strong>NÃO</strong> estou a enviar itens proibidos, ilegais, dinheiro vivo ou armas. Aceito os termos da Pedejá.</span></button><button type="button" className="prohibited-link" onClick={() => setProhibitedOpen(true)}>Ver lista proibida <ChevronRight size={16} /></button></div>}

        {step === 'photo' && <div className="enviar-form photo-step"><div className="photo-example"><div className="photo-placeholder"><Package size={42} /></div><strong>Foto da caixa fechada</strong><span>Mostra a encomenda já embalada e fechada.</span></div><label className="photo-button"><Camera size={19} /><span>{form.packagePhoto ? 'Tirar novamente' : 'Tirar foto'}</span><input type="file" accept="image/*" capture="environment" onChange={e => handlePhoto(e.target.files?.[0] ?? null)} /></label>{photoPreview && <div className="photo-preview"><img src={photoPreview} alt="Pré-visualização da encomenda" /><button type="button" onClick={() => { update('packagePhoto', null); if (photoPreview) URL.revokeObjectURL(photoPreview); setPhotoPreview(null); }} aria-label="Remover foto"><X size={17} /></button></div>}</div>}

        {step === 'review' && <div className="enviar-review">
          <div className="review-card"><div className="review-row"><span>Recolha</span><strong>{form.senderAddress}</strong></div><div className="review-row"><span>Destino</span><strong>{form.destinationAddress}</strong></div></div>
          <div className="review-card"><div className="review-row"><span>Recebe</span><strong>{form.recipientMode === 'self' ? 'Eu mesmo' : form.recipientName}</strong></div>{form.recipientMode === 'other' && <div className="review-row"><span>Telefone</span><strong>{form.recipientPhone}</strong></div>}<div className="review-row"><span>Tipo</span><strong>{packageTypes.find(type => type.value === form.packageType)?.label}</strong></div><div className="review-row"><span>Tamanho</span><strong>{sizeOptions.find(size => size.value === form.packageSize)?.label}</strong></div><div className="review-row"><span>Peso</span><strong>{formatWeight(form.packageWeight)}</strong></div><div className="review-row"><span>Viatura</span><strong>{vehicleOptions.find(vehicle => vehicle.value === form.vehicleType)?.label}</strong></div>{form.fragile && <div className="review-badge">Frágil — tarifa adicional no checkout</div>}</div>
          <div className="enviar-price-note"><div><span>Valor</span><strong>A calcular</strong></div><p>O preço final será calculado no checkout com base nos dados válidos do pedido. Não estamos a estimar nem a inventar um valor nesta etapa.</p></div>
          <div className="secret-code-note"><ShieldAlert size={19} /><div><strong>Código secreto de 5 dígitos</strong><p>Quando um estafeta aceitar o envio, a Pedejá enviará um código secreto de 5 dígitos ao destinatário. Partilha-o apenas com quem vai receber a encomenda. O estafeta precisará desse código para concluir a entrega.</p></div></div>
        </div>}
      </section>

      <div className="enviar-bottom"><button className="primary enviar-continue" disabled={!canContinue} onClick={next}>{step === 'review' ? 'Continuar para checkout' : 'Continuar'}<ChevronRight size={19} /></button>{step === 'review' && <button className="cancel-action" type="button" onClick={onBack}>Cancelar</button>}</div>

      {mapOpen && <div className="enviar-overlay"><div className="map-sheet"><header><button type="button" onClick={() => setMapOpen(false)} aria-label="Fechar"><ArrowLeft size={20} /></button><strong>Escolher no mapa</strong><button type="button" onClick={() => setMapOpen(false)} aria-label="Fechar"><X size={20} /></button></header><div className="map-search"><Search size={18} /><input autoFocus placeholder="Pesquisar morada, bairro ou referência" /></div><div className="map-placeholder"><MapPin size={30} /><strong>Mapa</strong><span>Escolhe um ponto ou pesquisa uma morada.</span></div><div className="map-suggestions"><span>Sugestões recentes</span>{recentAddresses.map(address => <button type="button" key={address.label} onClick={() => { update('senderAddress', address.value); setMapOpen(false); }}><MapPin size={17} /><div><strong>{address.label}</strong><small>{address.value}</small></div></button>)}</div></div></div>}

      {prohibitedOpen && <div className="enviar-overlay"><div className="prohibited-sheet"><header><strong>Lista proibida</strong><button type="button" onClick={() => setProhibitedOpen(false)} aria-label="Fechar"><X size={20} /></button></header><p>Não envies itens ilegais, armas, dinheiro vivo ou outros artigos cuja circulação seja proibida pela legislação aplicável ou pelos termos da Pedejá.</p><button className="primary" type="button" onClick={() => setProhibitedOpen(false)}>Entendi</button></div></div>}
    </main>
  );
}
