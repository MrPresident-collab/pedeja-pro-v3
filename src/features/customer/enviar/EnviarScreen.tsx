import { useMemo, useState } from 'react';
import { ArrowLeft, ChevronRight, MapPin, Package, Phone, Scale3D, ShieldCheck, UserRound } from 'lucide-react';
import { formatKz } from '../../../app/app-types';
import './enviar.css';

type Step = 'route' | 'recipient' | 'package' | 'review';

type FormState = {
  senderAddress: string;
  recipientName: string;
  recipientPhone: string;
  recipientAddress: string;
  packageDescription: string;
  packageSize: string;
  packageWeight: string;
  fragile: boolean;
  note: string;
};

const initialForm: FormState = {
  senderAddress: '',
  recipientName: '',
  recipientPhone: '+244 ',
  recipientAddress: '',
  packageDescription: '',
  packageSize: '',
  packageWeight: '',
  fragile: false,
  note: '',
};

export default function EnviarScreen({ onBack }: { onBack: () => void }) {
  const [step, setStep] = useState<Step>('route');
  const [form, setForm] = useState<FormState>(initialForm);

  const canContinue = useMemo(() => {
    if (step === 'route') return form.senderAddress.trim().length >= 2;
    if (step === 'recipient') return form.recipientName.trim().length >= 1 && form.recipientPhone.replace(/\s/g, '').length >= 7 && form.recipientAddress.trim().length >= 2;
    if (step === 'package') return form.packageDescription.trim().length >= 1;
    return true;
  }, [form, step]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm(current => ({ ...current, [key]: value }));

  const next = () => {
    if (!canContinue) return;
    if (step === 'route') setStep('recipient');
    else if (step === 'recipient') setStep('package');
    else if (step === 'package') setStep('review');
  };

  const back = () => {
    if (step === 'route') onBack();
    else if (step === 'recipient') setStep('route');
    else if (step === 'package') setStep('recipient');
    else setStep('package');
  };

  const title = step === 'route' ? 'De onde para onde?' : step === 'recipient' ? 'Quem vai receber?' : step === 'package' ? 'O que vais enviar?' : 'Confirma o envio';
  const stepNumber = step === 'route' ? 1 : step === 'recipient' ? 2 : step === 'package' ? 3 : 4;

  return (
    <main className="screen enviar-screen">
      <header className="enviar-header">
        <button className="enviar-back" onClick={back} aria-label="Voltar"><ArrowLeft size={21} /></button>
        <div><span>ENVIAR</span><strong>{stepNumber} de 4</strong></div>
        <div className="enviar-header-icon"><Package size={20} /></div>
      </header>

      <div className="enviar-progress" aria-label={`Etapa ${stepNumber} de 4`}><span style={{ width: `${stepNumber * 25}%` }} /></div>

      <section className="enviar-content">
        <div className="enviar-heading"><span className="enviar-eyebrow">ENVIA COM PEDEJÁ</span><h1>{title}</h1><p>Envia documentos, encomendas e pequenos volumes com acompanhamento Pedejá.</p></div>

        {step === 'route' && <>
          <div className="enviar-field-card"><div className="field-icon purple"><MapPin size={19} /></div><label>Local de recolha<input value={form.senderAddress} onChange={e => update('senderAddress', e.target.value)} placeholder="Ex.: Talatona, Luanda" /></label></div>
          <div className="route-line" aria-hidden="true" />
          <div className="enviar-field-card"><div className="field-icon"><MapPin size={19} /></div><label>Destino<input value={form.recipientAddress} onChange={e => update('recipientAddress', e.target.value)} placeholder="Ex.: Maianga, Luanda" /><small>Vamos pedir os dados do destinatário no próximo passo.</small></label></div>
        </>}

        {step === 'recipient' && <div className="enviar-form">
          <div className="enviar-field-card"><div className="field-icon"><UserRound size={19} /></div><label>Nome do destinatário<input value={form.recipientName} onChange={e => update('recipientName', e.target.value)} placeholder="Nome completo" /></label></div>
          <div className="enviar-field-card"><div className="field-icon"><Phone size={19} /></div><label>Telefone<input value={form.recipientPhone} onChange={e => update('recipientPhone', e.target.value)} placeholder="+244 9xx xxx xxx" inputMode="tel" /></label></div>
          <div className="enviar-field-card"><div className="field-icon"><MapPin size={19} /></div><label>Morada de entrega<input value={form.recipientAddress} onChange={e => update('recipientAddress', e.target.value)} placeholder="Rua, bairro, referência" /></label></div>
        </div>}

        {step === 'package' && <div className="enviar-form">
          <div className="enviar-field-card"><div className="field-icon"><Package size={19} /></div><label>O que estás a enviar?<textarea value={form.packageDescription} onChange={e => update('packageDescription', e.target.value)} placeholder="Ex.: documentos, roupa, encomenda pequena" rows={3} /></label></div>
          <div className="enviar-two-columns"><label className="plain-field">Tamanho<select value={form.packageSize} onChange={e => update('packageSize', e.target.value)}><option value="">Selecionar</option><option value="pequeno">Pequeno</option><option value="medio">Médio</option><option value="grande">Grande</option></select></label><label className="plain-field"><span><Scale3D size={15} /> Peso aproximado</span><input value={form.packageWeight} onChange={e => update('packageWeight', e.target.value)} placeholder="kg" inputMode="decimal" /></label></div>
          <button className={`toggle-row ${form.fragile ? 'selected' : ''}`} onClick={() => update('fragile', !form.fragile)} type="button"><span><ShieldCheck size={19} /><strong>É frágil</strong></span><i aria-hidden="true" /></button>
          <label className="plain-field">Nota para o estafeta<textarea value={form.note} onChange={e => update('note', e.target.value)} placeholder="Alguma instrução importante?" rows={3} /></label>
        </div>}

        {step === 'review' && <div className="enviar-review">
          <div className="review-card"><div className="review-row"><span>Recolha</span><strong>{form.senderAddress}</strong></div><div className="review-row"><span>Entrega</span><strong>{form.recipientAddress}</strong></div></div>
          <div className="review-card"><div className="review-row"><span>Destinatário</span><strong>{form.recipientName}</strong></div><div className="review-row"><span>Telefone</span><strong>{form.recipientPhone}</strong></div><div className="review-row"><span>Encomenda</span><strong>{form.packageDescription}</strong></div>{form.packageSize && <div className="review-row"><span>Tamanho</span><strong>{form.packageSize === 'medio' ? 'Médio' : form.packageSize[0].toUpperCase() + form.packageSize.slice(1)}</strong></div>}{form.packageWeight && <div className="review-row"><span>Peso</span><strong>{form.packageWeight} kg</strong></div>}{form.fragile && <div className="review-badge">Frágil</div>}</div>
          <div className="enviar-price-note"><div><span>Valor</span><strong>A calcular</strong></div><p>O preço do envio será calculado no checkout com base nos dados válidos do pedido. Não estamos a estimar nem a inventar um valor nesta etapa.</p></div>
        </div>}
      </section>

      <div className="enviar-bottom"><button className="primary enviar-continue" disabled={!canContinue} onClick={next}>{step === 'review' ? 'Continuar para checkout' : 'Continuar'}<ChevronRight size={19} /></button>{step === 'review' && <small>O pedido ainda não foi criado.</small>}</div>
    </main>
  );
}
