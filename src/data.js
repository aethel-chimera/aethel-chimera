// ---------------------------------------------------------------------------
// Dados estruturados da Aethel Chimera. Substituíveis por CMS sem tocar nos
// componentes: cada seção consome apenas estes arrays.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// FAIXA DE INVESTIMENTO — fonte única para a Calculadora (RoiDashboard) e para
// os gráficos do Protocolo (Process). Mudou aqui, muda nos dois.
// REF é o investimento de referência: é nele que a projeção bate EXATAMENTE os
// multiplicadores de benchmark (ROI 4,16×), sem correção de saturação.
// ---------------------------------------------------------------------------
export const INVEST_MIN = 1500
export const INVEST_MAX = 200000
export const INVEST_REF = 8000

export const SERVICES = [
  {
    id: '01',
    title: 'Criação de Landing Pages',
    category: 'Conversão',
    description:
      'Páginas projetadas para uma única missão: transformar visita em contato. Arquitetura de persuasão, copy direcionado e carregamento abaixo de dois segundos.',
    deliverables: ['Estratégia de oferta e copy', 'Design exclusivo, sem templates', 'Build otimizado e publicação', 'Testes A/B de seções críticas'],
    integrations: ['Pix', 'WhatsApp', 'CRM', 'E-mail marketing'],
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: '02',
    title: 'Reestruturação de Sites',
    category: 'Engenharia',
    description:
      'Redesign completo de sites desatualizados: nova arquitetura, migração de conteúdo sem perda de SEO, performance auditada página a página.',
    deliverables: ['Auditoria técnica e de conteúdo', 'Novo design system', 'Migração com redirects 301', 'SEO técnico completo'],
    integrations: ['Analytics', 'Search Console', 'CDN'],
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: '03',
    title: 'Manutenção Mensal',
    category: 'Operação',
    description:
      'O site como ativo vivo: atualizações, segurança, monitoramento de uptime, backups e evolução contínua com relatório mensal de saúde.',
    deliverables: ['Monitoramento 24/7', 'Backups automatizados', 'Atualizações de segurança', 'Relatório mensal de performance'],
    integrations: ['Uptime Robot', 'Backups em nuvem', 'Staging'],
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: '04',
    title: 'Social Media',
    category: 'Conteúdo',
    description:
      'Produção de conteúdo com direção de marca: calendário editorial, design de posts, roteiros de vídeo e gestão de comunidade.',
    deliverables: ['Calendário editorial mensal', 'Design e copy de posts', 'Roteiros para Reels', 'Relatório de engajamento'],
    integrations: ['Instagram', 'LinkedIn', 'TikTok', 'Meta Business'],
    image: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: '05',
    title: 'Gestão de Tráfego',
    category: 'Aquisição',
    description:
      'Google Ads e Meta Ads operados com método: estrutura de campanhas, criativos testados em ciclo e leitura semanal de dados.',
    deliverables: ['Setup de contas e pixels', 'Estrutura de campanhas', 'Criativos e variações', 'Dashboard de resultados'],
    integrations: ['Google Ads', 'Meta Ads', 'GA4', 'Tag Manager'],
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: '06',
    title: 'Integrações e Automações',
    category: 'Sistemas',
    description:
      'O ecossistema conectado: pagamentos por Pix e cartão, WhatsApp Business, CRM, agendamento online e automações de e-mail.',
    deliverables: ['Gateway de pagamento (Asaas)', 'WhatsApp Business API', 'CRM e funis', 'Automações sob demanda'],
    integrations: ['Pix', 'Asaas', 'WhatsApp', 'CRM', 'Agendamento'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=900&auto=format&fit=crop',
  },
  {
    id: '07',
    title: 'Modelagem & Experiências 3D',
    category: 'Diferencial',
    description:
      'O que nenhuma agência local entrega: ativos 3D exclusivos modelados in-house (Blender) — mascotes, produtos e cenas cinematográficas — e páginas imersivas em WebGL, otimizadas para carregar leve.',
    deliverables: ['Modelagem e texturização PBR', 'Personagens e mascotes animados', 'Produto 3D interativo (girar/configurar)', 'Cenas e vídeos cinematográficos', 'Integração WebGL otimizada'],
    integrations: ['Blender', 'WebGL / Three.js', 'glTF', 'AR-ready'],
    image: '/catalogo-vivo-poster.jpg',
  },
]

// ---------------------------------------------------------------------------
// CATÁLOGO — clientes REAIS da Aethel Chimera (fonte: CRM "Empresas" no Notion).
// `metrics` lista o ESCOPO ENTREGUE, não resultados inventados: enquanto os
// números reais de cada conta não forem apurados, nada de porcentagem fictícia.
// `instagram`/`site` só são preenchidos quando o canal está confirmado.
// ---------------------------------------------------------------------------
export const CATALOG = [
  {
    name: "J'López Designer de Joias",
    slug: 'jlopez',
    segment: 'Joalheria e Design',
    city: 'Ouro Preto · MG',
    year: '2026',
    summary:
      'Joalheria autoral de Ouro Preto: e-commerce próprio com catálogo, checkout com Pix e cartão, automações e as peças modeladas em 3D.',
    metrics: ['Loja própria com checkout Pix e cartão', 'Catálogo completo de peças', 'Modelagem 3D das joias'],
    tags: ['E-commerce', 'Pix', 'Modelagem 3D', 'Tráfego'],
    site: 'https://www.jlopezdesigner.jewelry',
    instagram: 'https://www.instagram.com/jlopezdesigner/',
    tiktok: 'https://www.tiktok.com/@jlopezdesinger',
    whatsapp: 'https://wa.me/5531984294370',
    url: 'https://www.jlopezdesigner.jewelry',
    image: '/image/case-jlopez.webp',
    logo: '/image/logos/jlopez.webp',
  },
  {
    name: 'Clínica de Nutrição Cláudio de Caux',
    slug: 'claudio-de-caux',
    segment: 'Saúde e Bem-estar',
    city: 'Itabira · MG',
    year: '2026',
    summary:
      'Nutrição clínica com atendimento online e presencial. Landing page que transforma o perfil em agendamento direto, sem depender só do link da bio.',
    metrics: ['Landing page de captação', 'Agendamento direto por WhatsApp', 'Autoridade clínica estruturada'],
    tags: ['Landing Page', 'WhatsApp', 'Saúde'],
    site: 'https://linktr.ee/claudiodecaux',
    instagram: 'https://www.instagram.com/claudiodecaux/',
    whatsapp: 'https://wa.me/5531988401292',
    url: 'https://linktr.ee/claudiodecaux',
    image: '/image/case-caux.webp',
    logo: '/image/logos/caux.webp',
  },
  {
    name: 'CT Diogo Alan',
    slug: 'diogo-alan',
    segment: 'Fitness e Performance',
    city: 'Itabira · MG',
    year: '2026',
    summary:
      'Centro de treinamento e consultoria: foco, disciplina e execução. Landing page cinematográfica para captar alunos e consultorias.',
    metrics: ['Landing page cinematográfica', 'Captação de alunos e consultoria', 'Experiência 3D no hero'],
    tags: ['Landing Page', 'Fitness', 'Modelagem 3D'],
    site: 'https://diogoalanpersonal.com',
    instagram: 'https://www.instagram.com/centro_de_treinamento_da/',
    // perfil pessoal do Diogo — o usuário pediu os dois Instagrams no card
    instagramAlt: 'https://www.instagram.com/diogoalanpersonal13/',
    instagramAltLabel: 'Insta pessoal',
    whatsapp: 'https://wa.me/5531985014149',
    url: 'https://diogoalanpersonal.com',
    image: '/image/case-diogo.webp',
    logo: '/image/logos/diogo.webp',
  },
  {
    name: "Jota's Pizza",
    slug: 'jotas-pizza',
    segment: 'Alimentação',
    city: 'Itabira · MG',
    year: '2026',
    summary:
      'Pizzaria de Itabira, com a Jota como assinatura da casa. Operação de social media com calendário de quinta a domingo.',
    metrics: ['Social media com calendário semanal', 'Manual de marca completo', 'Pedido direto por WhatsApp'],
    tags: ['Social Media', 'WhatsApp', 'Food'],
    site: null,
    instagram: 'https://www.instagram.com/jota_pizza_joaquim/',
    whatsapp: 'https://wa.me/5531995300456',
    url: 'https://www.instagram.com/jota_pizza_joaquim/',
    image: '/image/case-jotas.webp',
    logo: '/image/logos/jotas.webp',
  },
]

export const PROCESS = [
  {
    num: '01',
    title: 'Diagnóstico',
    description:
      'Antes de tocar no código, auditamos tudo: Core Web Vitals, SEO técnico, segurança, conteúdo, jornada e concorrência. Você recebe um diagnóstico com nota e um mapa de prioridades — onde o site perde dinheiro hoje e quanto dá para recuperar.',
    how: [
      'Auditoria técnica: performance, SEO e segurança',
      'Análise da jornada e dos pontos de fuga',
      'Benchmark contra os concorrentes diretos',
      'Mapa de oportunidades priorizado por impacto',
    ],
    chart: {
      type: 'diagnostic',
      caption: 'Estado atual × meta',
      items: [
        { label: 'Performance', atual: 34, meta: 95 },
        { label: 'SEO técnico', atual: 41, meta: 90 },
        { label: 'Acessibilidade', atual: 58, meta: 100 },
        { label: 'Conversão', atual: 1.1, meta: 3.2, unit: '%', scaleMax: 4 },
      ],
    },
  },
  {
    num: '02',
    title: 'Arquitetura e Design',
    description:
      'Arquitetura de informação, design system da marca e protótipo navegável — cada tela aprovada antes de uma linha de código. O foco é cortar fricção: menos passos até a ação, hierarquia que guia o olho e copy que converte.',
    how: [
      'Arquitetura de informação e fluxo de conversão',
      'Design system com a identidade da marca',
      'Protótipo navegável aprovado por você',
      'Copy orientado a objeção e decisão',
    ],
    chart: {
      type: 'beforeAfter',
      caption: 'Menos fricção, mais ação',
      items: [
        { label: 'Passos até o contato', antes: 6, depois: 2, lowerBetter: true },
        { label: 'Taxa de rejeição', antes: 68, depois: 31, unit: '%', lowerBetter: true },
        { label: 'Clareza da jornada', antes: 42, depois: 92, unit: '/100' },
      ],
    },
  },
  {
    num: '03',
    title: 'Construção e Integração',
    description:
      'Build de alta performance (LCP abaixo de 2,5s) com as integrações do seu negócio: Pix, cartão e boleto, WhatsApp Business, CRM, agendamento e automações. Velocidade e conversão deixam de ser promessa e viram número.',
    how: [
      'Build otimizado, LCP abaixo de 2,5s',
      'Pagamentos: Pix, cartão e boleto (Asaas)',
      'WhatsApp Business + CRM e funis',
      'Agendamento e automações sob demanda',
    ],
    chart: {
      type: 'beforeAfter',
      caption: 'Antes × depois de um build de qualidade',
      items: [
        { label: 'LCP (carregamento)', antes: 6.2, depois: 1.8, unit: 's', lowerBetter: true },
        { label: 'Lighthouse', antes: 38, depois: 98 },
        { label: 'Conversão', antes: 1.1, depois: 3.2, unit: '%' },
      ],
    },
  },
  {
    num: '04',
    title: 'Operação Contínua',
    description:
      'Monitoramento 24/7, manutenção, SEO, tráfego pago e conteúdo em ciclo mensal. O site vira um ativo que cresce: cada mês mais leads, mais velocidade, mais autoridade — com relatório transparente do que foi feito e do retorno.',
    how: [
      'Monitoramento de uptime e backups',
      'SEO e performance evoluídos todo mês',
      'Tráfego pago e produção de conteúdo',
      'Relatório mensal com resultados',
    ],
    chart: {
      type: 'growth',
      caption: 'Leads por mês — índice 100 = mês 1',
      months: ['M1', 'M2', 'M3', 'M4', 'M5', 'M6'],
      data: [100, 126, 152, 184, 214, 240],
      delta: '+140%',
    },
  },
]

export const STATS = [
  { value: 5, suffix: '', label: 'Projetos entregues' },
  { value: 99.9, suffix: '%', decimals: 1, label: 'Uptime médio' },
  { value: 94, suffix: '%', label: 'Retenção em manutenção mensal' },
]

export const TESTIMONIALS = [
  {
    quote: 'O site deixou de ser um cartão de visitas parado e virou nossa principal fonte de orçamentos. O relatório mensal mostra exatamente para onde o investimento vai.',
    name: 'Ricardo Tavares',
    role: 'Diretor',
    company: 'Vetra Engenharia',
    rating: 0.98,
  },
  {
    quote: 'Em três meses, o agendamento online superou o telefone. A equipe da Aethel cuida de tudo: a gente só acompanha os números subindo.',
    name: 'Dra. Marina Costa',
    role: 'Fundadora',
    company: 'Clínica Aurum',
    rating: 1,
  },
  {
    quote: 'Já tínhamos passado por duas agências. A diferença aqui é engenharia: tudo é medido, testado e melhorado. Nada é opinião solta.',
    name: 'Felipe Andrade',
    role: 'Sócio',
    company: 'Mosaico Arquitetura',
    rating: 0.95,
  },
  {
    quote: 'A migração do site antigo foi cirúrgica: não perdemos uma posição no Google e o novo carrega em menos de dois segundos.',
    name: 'Camila Reis',
    role: 'Gerente de Marketing',
    company: 'Atlas Logística',
    rating: 0.97,
  },
]

export const PLANS = [
  {
    name: 'Essencial',
    price: 'R$ 497',
    period: '/mês',
    featured: false,
    items: [
      'Monitoramento de uptime 24/7',
      'Backups semanais automatizados',
      'Atualizações de segurança',
      'Pequenos ajustes de conteúdo (2h/mês)',
      'Relatório mensal de saúde',
    ],
    cta: 'Contratar Essencial',
  },
  {
    name: 'Performance',
    price: 'R$ 1.290',
    period: '/mês',
    featured: true,
    badge: 'Mais contratado',
    items: [
      'Tudo do Essencial',
      'Otimização contínua de performance',
      'SEO técnico mensal',
      'Evoluções de layout e seções (6h/mês)',
      'Suporte prioritário via WhatsApp',
      'Reunião mensal de estratégia',
    ],
    cta: 'Contratar Performance',
  },
  {
    name: 'Enterprise',
    price: 'Sob consulta',
    period: '',
    featured: false,
    items: [
      'Tudo do Performance',
      'Gestão de tráfego pago integrada',
      'Social media e conteúdo',
      'Automações e integrações sob demanda',
      'SLA dedicado e squad exclusivo',
    ],
    cta: 'Falar com especialista',
  },
]

export const NAV_LINKS = [
  { label: 'Serviços', href: '#servicos' },
  { label: 'Catálogo', href: '#catalogo' },
  { label: '3D', href: '#studio3d' },
  { label: 'Processo', href: '#processo' },
  { label: 'Resultados', href: '#resultados' },
  { label: 'Contato', href: '#contato' },
]

export const TICKER_ITEMS = [
  'Landing Pages',
  'Reestruturação de Sites',
  'Manutenção Mensal',
  'Social Media',
  'Gestão de Tráfego',
  'Integrações e Automações',
]

// ---------------------------------------------------------------------------
// CONTATOS OFICIAIS. Os links são as "APIs" públicas de cada canal:
//   WhatsApp  -> Click-to-Chat (wa.me) com mensagem pré-preenchida
//   E-mail    -> mailto: com assunto/corpo pré-preenchidos
//   Instagram -> perfil público
// `waLink()` monta o link do WhatsApp já com o texto de abertura.
// ---------------------------------------------------------------------------
const WHATSAPP_MSG =
  'Olá! Vim pelo site da Aethel Chimera e quero iniciar um projeto.'

export const CONTACT = {
  email: 'aethelchimera@gmail.com',
  emailUrl:
    'mailto:aethelchimera@gmail.com' +
    '?subject=' + encodeURIComponent('Novo projeto — via site') +
    '&body=' + encodeURIComponent(WHATSAPP_MSG),
  instagram: '@aethel.chimera',
  instagramUrl: 'https://www.instagram.com/aethel.chimera/',
  // canal principal (mantém compatibilidade com quem usa CONTACT.whatsapp*)
  whatsapp: '(31) 99482-8076',
  whatsappUrl: 'https://wa.me/5531994828076?text=' + encodeURIComponent(WHATSAPP_MSG),
  phones: [
    { label: '(31) 99482-8076', e164: '5531994828076' },
    { label: '(31) 99579-3122', e164: '5531995793122' },
  ],
}

// link de WhatsApp com mensagem contextual (ex.: plano ou serviço escolhido)
export const waLink = (e164 = '5531994828076', msg = WHATSAPP_MSG) =>
  `https://wa.me/${e164}?text=${encodeURIComponent(msg)}`
