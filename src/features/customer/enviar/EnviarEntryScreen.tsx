import { useState } from 'react';
import { ArrowLeft, CalendarClock, Clock3, Package } from 'lucide-react';
import EnviarScreen from './EnviarScreen';

type EnviarEntryScreenProps = { onBack: () => void };

export default function EnviarEntryScreen({ onBack }: EnviarEntryScreenProps) {
  const [mode, setMode] = useState<'now' | 'schedule' | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  if (mode === 'now' || confirmed) return <EnviarScreen onBack={onBack} />;

  return <main className="screen enviar-entry-screen">
    <button className="screen-back" onClick={onBack} aria-label="Voltar"><ArrowLeft size={20} /></button>
    <div className="enviar-entry-icon"><Package size={28} /></div>
    <span className="eyebrow">ENVIAR</span>
    <h1>Quando queres que seja entregue?</h1>
    <p>Escolhe se queres enviar agora ou agendar a entrega para uma data e hora específicas.</p>
    <div className="schedule-choice-grid">
      <button className={`schedule-choice ${mode === 'now' ? 'selected' : ''}`} onClick={() => setMode('now')}><Clock3 size={22} /><strong>Agora</strong><small>Enviar assim que houver estafeta disponível.</small></button>
      <button className={`schedule-choice ${mode === 'schedule' ? 'selected' : ''}`} onClick={() => setMode('schedule')}><CalendarClock size={22} /><strong>Agendar</strong><small>Escolher o dia e o horário da entrega.</small></button>
    </div>
    {mode === 'schedule' && <section className="schedule-form"><label>Data<input type="date" value={date} min={new Date().toISOString().slice(0, 10)} onChange={e => setDate(e.target.value)} /></label><label>Horário<input type="time" value={time} onChange={e => setTime(e.target.value)} /></label><button className="primary" disabled={!date || !time} onClick={() => setConfirmed(true)}>Confirmar entrega agendada</button><small>O horário ficará associado ao envio. A disponibilidade final será confirmada pelo sistema operacional.</small></section>}
  </main>;
}
