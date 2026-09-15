import { useState } from 'react';
import {
  ArrowRight, Bike, Building2, CircleHelp, Compass, Gem, Globe, Hammer, Info,
  MapPin, Package, Play, Scale, ShieldCheck, Target, UserRound, Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { repositories } from '@/repositories';
import { external } from '@/config/external';
import { exploreNegociosIntro } from '@/data/explore';
import type { ExploreAboutItem } from '@/data/explore';
import { ExploreSection } from '@/components/explore/ExploreSection';
import { ExploreLinkRow } from '@/components/explore/ExploreLinkRow';
import { BusinessCategoryCard } from '@/components/explore/BusinessCategoryCard';
import { FaqAccordion } from '@/components/explore/FaqAccordion';
import { SocialLinks } from '@/components/explore/SocialLinks';
import { ExploreFooter } from '@/components/explore/ExploreFooter';

type Props = {
  onRegisterBusiness: () => void;
  onRegisterEstafeta: () => void;
  onOpenLegal: (key: string) => void;
};

const aboutIcons: Record<string, LucideIcon> = {
  'quem-e': Info,
  missao: Target,
  valores: Gem,
  construcao: Hammer,
  promessa: Zap,
};

const aboutCopy: Record<string, string> = {
  'quem-e': 'Uma rede angolana que liga clientes, negócios e estafetas para devolver tempo às pessoas.',
  missao: 'Simplificar o dia a dia através de entregas rápidas, acessíveis e feitas com responsabilidade.',
  valores: 'Fiabilidade, honestidade, respeito, segurança, comunidade, cuidado e responsabilidade.',
  construcao: 'Uma infraestrutura local de comércio e logística: comprar, enviar, acompanhar e resolver num só lugar.',
  promessa: 'Cada entrega é uma promessa cumprida. A tecnologia existe para tornar esse movimento simples e humano.',
};

const howItWorks = [
  { icon: Compass, title: 'Escolhe', detail: 'Encontra um negócio ou escolhe Enviar para mover uma encomenda de um ponto para outro.' },
  { icon: MapPin, title: 'Indica onde', detail: 'Confirma a recolha, o destino e as instruções que ajudam o estafeta a chegar ao lugar certo.' },
  { icon: Package, title: 'Acompanha', detail: 'O pedido passa pela rede Pedejá até chegar ao destino, com estados e suporte quando necessário.' },
];

export function ExploreView({ onRegisterBusiness, onRegisterEstafeta, onOpenLegal }: Props) {
  const repo = repositories.explore;
  const about = repo.getAbout();
  const businessCategories = repo.getBusinessCategories();
  const businessRegistration = repo.getBusinessRegistration();
  const estafeta = repo.getEstafetaRegistration();
  const faq = repo.getFaq();
  const accountSecurity = repo.getAccountSecurity();
  const legal = repo.getLegal();
  const social = repo.getSocial();
  const [activeAbout, setActiveAbout] = useState<string | null>(null);

  const openAbout = (item: ExploreAboutItem) => {
    if (item.href) window.open(item.href, '_blank', 'noopener,noreferrer');
    else setActiveAbout((current) => current === item.key ? null : item.key);
  };

  return (
    <main className="page inner-page explore-page">
      <header className="inner-header explore-header">
        <p className="eyebrow">EXPLORAR</p>
        <h1>Conhece o Pedejá<span className="brand-dot">.</span></h1>
        <p>Mais do que uma entrega: uma rede feita para devolver tempo, ligar negócios e fazer Angola mover-se.</p>
      </header>

      <section className="explore-intro-card">
        <div className="explore-intro-icon"><Globe size={22} /></div>
        <div>
          <strong>A promessa que se move</strong>
          <p>O Pedejá existe para reduzir deslocações desnecessárias e aproximar o que precisas de onde estás.</p>
        </div>
      </section>

      <ExploreSection title="Sobre nós" icon={<Info size={17} />}>
        <div className="explore-links">
          {about.map((item) => {
            const Icon = aboutIcons[item.key];
            return (
              <div key={item.key}>
                <ExploreLinkRow
                  title={item.title}
                  icon={Icon ? <Icon size={17} /> : undefined}
                  href={item.href || undefined}
                  onClick={() => openAbout(item)}
                />
                {activeAbout === item.key && (
                  <p className="explore-inline-detail">{aboutCopy[item.key]}</p>
                )}
              </div>
            );
          })}
        </div>
      </ExploreSection>

      <ExploreSection title="Como funciona" description="Um fluxo simples para comprar, enviar e acompanhar." icon={<Play size={17} />}>
        <div className="explore-feature-grid">
          {howItWorks.map(({ icon: Icon, title, detail }) => (
            <article className="explore-feature-card" key={title}>
              <span className="explore-feature-icon"><Icon size={20} /></span>
              <strong>{title}</strong>
              <p>{detail}</p>
            </article>
          ))}
        </div>
        <div className="explore-flow-note">
          <ShieldCheck size={18} />
          <span>Quando algo sai do esperado, a rede investiga o atraso em vez de simplesmente culpar alguém.</span>
        </div>
      </ExploreSection>

      <ExploreSection title="Para negócios" description={exploreNegociosIntro} icon={<Building2 size={17} />}>
        <div className="explore-join-card">
          <div>
            <strong>{businessRegistration.title}</strong>
            <p>{businessRegistration.description}</p>
          </div>
          <button type="button" className="btn-primary" onClick={onRegisterBusiness}>{businessRegistration.ctaLabel} <ArrowRight size={17} /></button>
        </div>
        <p className="explore-label">Como funciona</p>
        <ol className="explore-numbered-list">
          {businessRegistration.steps.map((step) => <li key={step.title}><span>{businessRegistration.steps.indexOf(step) + 1}</span><div><strong>{step.title}</strong>{step.detail && <small>{step.detail}</small>}</div></li>)}
        </ol>
        <p className="explore-secondary-info">{businessRegistration.secondaryInfo}</p>
        <p className="explore-label">Categorias de negócio</p>
        <div className="explore-category-grid">
          {businessCategories.map((category) => <BusinessCategoryCard key={category.id} category={category} />)}
        </div>
      </ExploreSection>

      <ExploreSection title="Torna-te Estafeta" description={estafeta.headline} icon={<Bike size={17} />}>
        <div className="explore-join-card rider">
          <div><strong>Conduz. Entrega. Ganha.</strong><p>Escolhe quando estar online e participa na rede apenas depois da aprovação.</p></div>
          <button type="button" className="btn-primary" onClick={onRegisterEstafeta}>{estafeta.ctaLabel} <ArrowRight size={17} /></button>
        </div>
        <p className="explore-label">Requisitos</p>
        <ul className="requirement-list">{estafeta.requirements.map((requirement) => <li key={requirement}>{requirement}</li>)}</ul>
        <p className="explore-label">Processo de adesão</p>
        <ol className="explore-numbered-list">{estafeta.steps.map((step, i) => <li key={step.title}><span>{i + 1}</span><div><strong>{step.title}</strong>{step.detail && <small>{step.detail}</small>}</div></li>)}</ol>
        <p className="register-note">{estafeta.activationNote}</p>
      </ExploreSection>

      <ExploreSection title="Perguntas frequentes" icon={<CircleHelp size={17} />}><FaqAccordion items={faq} /></ExploreSection>

      <ExploreSection title="Segurança da conta" description={accountSecurity.question} icon={<ShieldCheck size={17} />}>
        <ul className="requirement-list">{accountSecurity.rules.map((rule) => <li key={rule}>{rule}</li>)}</ul>
        <div className="explore-flow-note"><UserRound size={18} /><span>O suporte é o primeiro ponto de contacto. Casos operacionais são encaminhados para a equipa de Operações.</span></div>
      </ExploreSection>

      <ExploreSection title="Legal" description="Consulta as políticas que explicam os teus direitos, responsabilidades e o funcionamento da rede." icon={<Scale size={17} />}>
        <div className="explore-links">{legal.map((doc) => <ExploreLinkRow key={doc.key} title={doc.title} detail="Ler documento" onClick={() => onOpenLegal(doc.key)} />)}</div>
      </ExploreSection>

      <ExploreSection title="Segue o movimento" icon={<Globe size={17} />}>
        {social.some((link) => Boolean(link.url)) ? <SocialLinks links={social} /> : <div className="explore-flow-note"><Globe size={18} /><span>Os canais oficiais estarão ligados aqui quando estiverem configurados. Para falar connosco agora, <button className="inline-link" onClick={() => window.open(external.whatsapp, '_blank', 'noopener,noreferrer')}>contacta o Pedejá no WhatsApp</button>.</span></div>}
      </ExploreSection>
      <ExploreFooter />
    </main>
  );
}
