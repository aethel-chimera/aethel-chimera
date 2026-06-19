// ---------------------------------------------------------------------------
// Dados estruturados da Aethel Chimera. Substituíveis por CMS sem tocar nos
// componentes: cada seção consome apenas estes arrays.
// ---------------------------------------------------------------------------

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
]

// CATÁLOGO: cada projeto tem uma `image` (poster/fallback) e um `video`
// (gravação do site, opcional). Coloque os .mp4 em /public/portfolio/ com o
// nome do `slug` — ex.: public/portfolio/vetra.mp4 — e a seção interna toca
// automaticamente; sem o arquivo, ela mostra a imagem.
export const CATALOG = [
  {
    name: 'Vetra Engenharia',
    slug: 'vetra',
    segment: 'Engenharia Civil',
    year: '2025',
    summary: 'Site de captação de orçamentos com formulário inteligente e funil direto no WhatsApp.',
    metrics: ['+140% tráfego orgânico', '1.8s LCP', '32% conversão em orçamentos'],
    tags: ['WhatsApp', 'CRM', 'Formulário inteligente'],
    url: '#',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=1600&auto=format&fit=crop',
    video: '/portfolio/vetra.mp4',
  },
  {
    name: 'Clínica Aurum',
    slug: 'aurum',
    segment: 'Saúde e Estética',
    year: '2025',
    summary: 'Agendamento online integrado, pagamento por Pix e prova social — do clique à consulta.',
    metrics: ['+210% agendamentos online', '2.1s LCP', '4.9 avaliação média'],
    tags: ['Agendamento', 'Pix', 'WhatsApp'],
    url: '#',
    image: 'https://images.unsplash.com/photo-1629909613654-28e377c37b09?q=80&w=1600&auto=format&fit=crop',
    video: '/portfolio/aurum.mp4',
  },
  {
    name: 'Mosaico Arquitetura',
    slug: 'mosaico',
    segment: 'Arquitetura',
    year: '2024',
    summary: 'Portfólio dinâmico que valoriza cada projeto e nutre leads por newsletter e CRM.',
    metrics: ['+95% tempo de sessão', '1.6s LCP', '3x leads qualificados'],
    tags: ['Portfólio dinâmico', 'CRM', 'Newsletter'],
    url: '#',
    image: 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=1600&auto=format&fit=crop',
    video: '/portfolio/mosaico.mp4',
  },
  {
    name: 'Forja Performance',
    slug: 'forja',
    segment: 'Fitness',
    year: '2024',
    summary: 'Matrícula com pagamento recorrente e agendamento de aula experimental sem fricção.',
    metrics: ['+180% matrículas', '1.9s LCP', '41% conversão em trial'],
    tags: ['Pagamento recorrente', 'Pix', 'Agendamento'],
    url: '#',
    image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1600&auto=format&fit=crop',
    video: '/portfolio/forja.mp4',
  },
  {
    name: 'Lume Odontologia',
    slug: 'lume',
    segment: 'Odontologia',
    year: '2025',
    summary: 'Captação por Google Ads aterrissando em página de alta conversão com WhatsApp.',
    metrics: ['+120% pacientes novos', '2.0s LCP', '28% conversão WhatsApp'],
    tags: ['WhatsApp', 'Agendamento', 'Google Ads'],
    url: '#',
    image: 'https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?q=80&w=1600&auto=format&fit=crop',
    video: '/portfolio/lume.mp4',
  },
  {
    name: 'Atlas Logística',
    slug: 'atlas',
    segment: 'Logística B2B',
    year: '2024',
    summary: 'Cotação online e automações que encurtam o ciclo comercial e retêm clientes.',
    metrics: ['+160% cotações', '1.7s LCP', '52% retenção de clientes'],
    tags: ['CRM', 'Cotação online', 'Automações'],
    url: '#',
    image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?q=80&w=1600&auto=format&fit=crop',
    video: '/portfolio/atlas.mp4',
  },
]

export const PROCESS = [
  {
    num: '01',
    title: 'Diagnóstico',
    description: 'Auditoria completa da presença atual: técnica, conteúdo, concorrência e funil. Saímos com um mapa, não com achismos.',
    anim: 'scan',
  },
  {
    num: '02',
    title: 'Arquitetura e Design',
    description: 'Wireframes, design system e protótipo navegável. Cada tela aprovada antes de uma linha de código.',
    anim: 'wireframe',
  },
  {
    num: '03',
    title: 'Construção e Integração',
    description: 'Build de alta performance com as integrações do seu negócio: pagamentos, WhatsApp, CRM, agendamento.',
    anim: 'blocks',
  },
  {
    num: '04',
    title: 'Operação Contínua',
    description: 'Monitoramento, manutenção, tráfego e conteúdo em ciclo mensal. O organismo evolui todos os meses.',
    anim: 'ekg',
  },
]

export const STATS = [
  { value: 47, suffix: '+', label: 'Projetos entregues' },
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

export const CONTACT = {
  email: 'contato@aethelchimera.com.br',
  whatsapp: '+55 11 90000-0000',
  whatsappUrl: 'https://wa.me/5511900000000',
}
