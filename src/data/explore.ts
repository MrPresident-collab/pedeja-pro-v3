import { external } from '@/config/external';

export type ExploreAboutItem = {
  key: string;
  title: string;
  // TODO(website): preencher quando o site do Pedejá estiver disponível.
  href: string;
};

export type ExploreVideoItem = {
  key: string;
  title: string;
  description: string;
  // TODO(video): preencher sourceUrl com o URL do vídeo hospedado (MP4 ou serviço de vídeo seguro).
  sourceUrl?: string;
};

export type ExploreBusinessCategory = {
  id: 'comida' | 'comerciantes' | 'lojas';
  title: string;
  description: string;
  // "Isto inclui:" — itens de exemplo; vazio quando a categoria não tem lista incluída.
  includes: string[];
};

export type ExploreApprovalStep = {
  title: string;
  detail?: string;
};

export type ExploreRegistrationFlow = {
  title: string;
  description: string;
  stepsLabel: string;
  secondaryInfo: string;
  ctaLabel: string;
  steps: ExploreApprovalStep[];
  // TODO(media): substituir o placeholder por uma imagem local real.
  imageLabel: string;
};

export type ExploreEstafetaFlow = {
  headline: string;
  requirementsLabel: string;
  stepsLabel: string;
  ctaLabel: string;
  requirements: string[];
  steps: ExploreApprovalStep[];
  activationNote: string;
  // TODO(media): substituir o placeholder por uma imagem local real.
  imageLabel: string;
};

export type ExploreFaqItem = {
  q: string;
  a: string[];
};

export type ExploreAccountSecurity = {
  question: string;
  rules: string[];
};

export type ExploreLegalDoc = {
  key: string;
  title: string;
};

export type ExploreSocialLink = {
  id: 'facebook' | 'instagram' | 'linkedin';
  label: string;
  // TODO(external): preencher com os URLs oficiais dos perfis quando disponíveis.
  url: string;
};

export const exploreAboutItems: ExploreAboutItem[] = [
  { key: 'quem-e', title: 'Quem é o Pedejá?', href: external.website.quemEOPedeja },
  { key: 'missao', title: 'A nossa missão', href: external.website.missao },
  { key: 'valores', title: 'Os nossos valores', href: external.website.valores },
  { key: 'construcao', title: 'O que estamos a construir?', href: external.website.construcao },
  { key: 'promessa', title: 'A promessa que se move', href: external.website.promessa },
];

// TODO(blueprint): validar estes textos com os fundamentos do "Fundador, Livro 1" quando disponíveis.

export const exploreNegociosIntro =
  'Junta-te à rede Pedejá e permite que mais clientes descubram e recebam os teus produtos.';

export const exploreVideos: ExploreVideoItem[] = [
  {
    key: 'como-fazer-pedido',
    title: 'Como fazer um pedido',
    description: 'Escolher, adicionar ao cesto e receber em casa em poucos passos.',
  },
  {
    key: 'como-enviar-encomenda',
    title: 'Como enviar uma encomenda',
    description: 'Da origem ao destino: como funciona a opção Enviar.',
  },
  {
    key: 'pos-entrega-estafeta',
    title: 'O que acontece depois de o estafeta sair com a tua encomenda?',
    description: 'Cada momento do percurso — da recolha à entrega — explicado.',
  },
];

export const exploreBusinessCategories: ExploreBusinessCategory[] = [
  {
    id: 'comida',
    title: 'Comida',
    description: 'Preparas ou vendes alimentos e bebidas prontos para consumo.',
    includes: [
      'Restaurantes',
      'Take-aways',
      'Fast foods',
      'Comida local',
      'Padarias',
      'Smoothie bars',
      'Etc.',
    ],
  },
  {
    id: 'comerciantes',
    title: 'Comerciantes',
    description: 'Vendes produtos do dia a dia e artigos de compra rápida.',
    includes: [
      'Lojas de conveniência',
      'Farmácias',
      'Lojas de acessórios',
      'Lojas locais',
      'Mercearias',
      'Etc.',
    ],
  },
  {
    id: 'lojas',
    title: 'Lojas',
    description: 'Supermercados, centros comerciais, franquias e outros grandes retalhistas.',
    includes: [],
  },
];

export const exploreBusinessRegistration: ExploreRegistrationFlow = {
  title: 'Junta-te à rede Pedejá',
  description: 'Permite que mais clientes descubram e recebam os teus produtos.',
  stepsLabel: 'Como funciona o registo',
  secondaryInfo: 'Depois da aprovação, o teu negócio acede à plataforma Pedejá Merchant.',
  ctaLabel: 'Registar negócio',
  imageLabel: 'Imagem de negócio em breve',
  steps: [
    { title: 'Envia os dados do negócio.' },
    { title: 'Nós analisamos o pedido.' },
    { title: 'O vosso negócio é aprovado.' },
    { title: 'Recebes acesso à plataforma Pedejá Merchant.' },
    { title: 'Configuras o catálogo, horários, preços e pedidos.' },
  ],
};

export const exploreEstafetaRegistration: ExploreEstafetaFlow = {
  headline: 'Tens um veículo? Ganha dinheiro extra enquanto conduzes, no teu próprio horário.',
  requirementsLabel: 'Requisitos',
  stepsLabel: 'Processo de adesão',
  ctaLabel: 'Registar-me como Estafeta',
  requirements: ['Documentos de identificação válidos.', 'Veículo em boas condições de utilização.'],
  steps: [
    { title: 'Preenche o formulário de candidatura.' },
    { title: 'Envia os documentos necessários.' },
    { title: 'Recebemos e verificamos os dados.' },
    { title: 'A tua candidatura é aprovada.' },
    { title: 'Fica online e começa a ganhar.' },
  ],
  activationNote:
    'A inscrição não é ativação. Só participas na rede depois da análise e aprovação da nossa equipa.',
  imageLabel: 'Imagem de Estafeta em breve',
};

export const exploreFaq: ExploreFaqItem[] = [
  {
    q: 'O que é o Pedejá?',
    a: [
      'Uma plataforma angolana de entregas e envios. Liga clientes, negócios e estafetas e leva comida, compras e encomendas até ti.',
    ],
  },
  {
    q: 'Que tipos de pedidos posso fazer?',
    a: [
      'Podes pedir em negócios de Comida, Comerciantes e Lojas, e enviar encomendas de um ponto ao outro da rede.',
    ],
  },
  {
    q: 'Como registar o meu negócio?',
    a: [
      'Pelo fluxo "Registar negócio" em Explorar. Envias os dados, a nossa equipa analisa o pedido e, se aprovado, o teu negócio recebe acesso à plataforma Pedejá Merchant.',
    ],
  },
  {
    q: 'Como posso tornar-me Estafeta?',
    a: [
      'Pelo fluxo "Registar-me como Estafeta" em Explorar. A tua candidatura é verificada e só depois da aprovação ficas online na rede.',
    ],
  },
  {
    q: 'Que tipos de veículos são aceites?',
    a: ['Moto, triciclo, carro e carrinha, desde que cumpram os requisitos da rede.'],
  },
  {
    q: 'Como acompanho o meu pedido?',
    a: [
      'Em Pedidos, acompanhas o estado do pedido — preparação, recolha e entrega — até à chegada.',
    ],
  },
  {
    q: 'Como envio uma encomenda?',
    a: [
      'Indicas a origem e o destino, descreves a encomenda e o tamanho, e um estafeta faz a recolha e a entrega. Acompanhas tudo dentro do pedido.',
    ],
  },
  {
    q: 'Que produtos posso enviar?',
    a: [
      'Os produtos permitidos pelas regras da rede e pelas determinações de segurança. A lista de itens proibidos será comunicada quando disponível.',
    ],
  },
  {
    q: 'Como funcionam os pagamentos?',
    a: [
      'Pagas pelo serviço que utilizas, pelo valor apresentado no pedido, sem valores fora da plataforma. Os métodos disponíveis são indicados antes de confirmares.',
    ],
  },
  {
    q: 'Posso pagar em dinheiro?',
    a: ['Sim, em dinheiro à entrega, conforme as condições do pedido e a disponibilidade na tua região.'],
  },
  {
    q: 'O que acontece se o destinatário não estiver disponível?',
    a: [
      'O estafeta tenta contactar o destinatário pelos meios indicados no pedido. Se não for possível, seguem-se as instruções da rede para essa situação.',
    ],
  },
  {
    q: 'Como posso cancelar um pedido?',
    a: ['Antes da recolha, podes cancelar pelo próprio pedido. Depois da recolha, contacta o suporte.'],
  },
  {
    q: 'Como posso pedir um reembolso?',
    a: ['Contacta o suporte com os dados do pedido. Cada caso é analisado pela equipa Pedejá'],
  },
  {
    q: 'Como entro em contacto com o suporte?',
    a: ['Pelos canais oficiais de apoio dentro da aplicação.'],
  },
];

export const exploreAccountSecurity: ExploreAccountSecurity = {
  question: 'Como protejo a minha conta?',
  rules: [
    'Não partilhes a tua conta com pessoas desconhecidas.',
    'Nunca partilhes o teu código OTP com ninguém.',
    'Se notares atividade desconhecida na tua conta, contacta imediatamente o suporte.',
    'O Pedejá nunca te pedirá dinheiro fora desta plataforma.',
    'Só pagas pelo serviço que utilizas.',
    'Denuncia qualquer estafeta que te peça um valor superior ao pagamento apresentado na plataforma.',
  ],
};

export const exploreLegalDocs: ExploreLegalDoc[] = [
  { key: 'privacidade', title: 'Política de Privacidade' },
  { key: 'termos', title: 'Termos de Uso' },
  { key: 'responsabilidade', title: 'Responsabilidade' },
  { key: 'reembolsos', title: 'Reembolsos' },
  { key: 'encomendas', title: 'Política de Encomendas' },
  { key: 'cancelamento', title: 'Política de Cancelamento' },
];

export const exploreSocialLinks: ExploreSocialLink[] = [
  { id: 'facebook', label: 'Facebook', url: external.social.facebook },
  { id: 'instagram', label: 'Instagram', url: external.social.instagram },
  { id: 'linkedin', label: 'LinkedIn', url: external.social.linkedin },
];