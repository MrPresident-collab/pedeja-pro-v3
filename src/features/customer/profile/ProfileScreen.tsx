import { ChevronRight, CreditCard, FileText, Headphones, LogOut, MapPin, Bell, Phone, ShieldCheck, UserRound, UserPlus, Store, Truck, Trash2 } from 'lucide-react';

type ProfileScreenProps = { onSignOut?: () => void };

function Row({ icon: Icon, title, detail, danger = false, onClick }: { icon: typeof UserRound; title: string; detail?: string; danger?: boolean; onClick?: () => void }) {
  return <button className={`profile-row ${danger ? 'danger' : ''}`} onClick={onClick}><span className="profile-row-icon"><Icon size={19} /></span><span><strong>{title}</strong>{detail && <small>{detail}</small>}</span><ChevronRight size={17} /></button>;
}

export default function ProfileScreen({ onSignOut }: ProfileScreenProps) {
  return <main className="screen profile-screen">
    <header className="profile-heading"><div className="profile-avatar"><UserRound size={25} /></div><div><span className="eyebrow">PERFIL</span><h1>A tua conta</h1><p>Gere os teus dados e experiências Pedejá.</p></div></header>
    <section className="profile-section"><h2>Dados pessoais</h2><div className="profile-list"><Row icon={UserRound} title="Informação pessoal" detail="Nome e dados da conta" /><Row icon={Phone} title="Número de telefone" detail="+244 · Conta Pedejá" /><Row icon={MapPin} title="Moradas" detail="Casa, Trabalho e outras" /><Row icon={CreditCard} title="Métodos de pagamento" detail="Dinheiro, cartão e Multicaixa" /><Row icon={Bell} title="Conta e notificações" detail="Preferências e alertas" /></div></section>
    <section className="profile-section"><h2>Ajuda</h2><div className="profile-list"><Row icon={Headphones} title="Suporte" detail="Ajuda e contacto Pedejá" /></div></section>
    <section className="profile-section opportunities"><h2>Oportunidades</h2><p className="section-intro">Queres fazer parte do ecossistema Pedejá?</p><div className="profile-list"><Row icon={Truck} title="Tornar-me Estafeta" detail="Fazer entregas com a Pedejá" /><Row icon={Store} title="Tornar-me Parceiro" detail="Para negócios locais e comércio informal" /><Row icon={UserPlus} title="Registar um negócio" detail="Para organizações, cadeias e franquias" /></div></section>
    <section className="profile-section"><h2>Legal e conta</h2><div className="profile-list"><Row icon={FileText} title="Termos e condições" /><Row icon={ShieldCheck} title="Privacidade" /><Row icon={LogOut} title="Terminar sessão" onClick={onSignOut} /><Row icon={Trash2} title="Eliminar conta" danger /></div></section>
    <footer className="profile-footer">Pedejá · A promessa que se move</footer>
  </main>;
}
