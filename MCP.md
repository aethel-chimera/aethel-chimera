# MCP — Mapa de Contexto do Projeto · Aethel Chimera

> Documento de referência da estrutura, arquitetura e estado do site-vitrine
> da **Aethel Chimera**. Serve de contexto compartilhado para continuar o
> desenvolvimento. Mantenha-o atualizado quando a arquitetura mudar.
>
> Última revisão: **2026-06-23** · Branch principal: `main`

---

## 1. O que é

Site-vitrine e **catálogo vivo** da Aethel Chimera — agência de "engenharia de
presença digital" (landing pages, reestruturação de sites, manutenção mensal,
social media, tráfego pago, integrações). Não é um site institucional comum: é
uma **experiência imersiva de scroll** (escola Active Theory / Igloo / Lusion)
com um mundo WebGL ao fundo, narrativa por seção, áudio sintetizado e um
catálogo 3D clicável.

- **Idioma:** PT-BR (`<html lang="pt-BR">`).
- **Tese da marca:** o site como **ativo vivo**, não despesa estática — ver
  [src/components/Manifesto.jsx](src/components/Manifesto.jsx).
- **Identidade visual:** monograma `Æ` + quimera; estética obsidiana/âmbar,
  "gramática de console" técnica (colchetes, mono, índices `SEC 0X`).

---

## 2. Stack técnica

| Camada | Tecnologia | Observações |
|---|---|---|
| Build/dev | **Vite 6** | `npm run dev/build/preview` |
| UI | **React 19** | `StrictMode`, lazy + Suspense para o 3D |
| Estilo | **Tailwind 3.4** + CSS custom | tokens em [tailwind.config.js](tailwind.config.js); animações/efeitos em [src/index.css](src/index.css) (669 linhas) |
| Animação | **GSAP 3 + ScrollTrigger** | pins, reveals, counters |
| Scroll | **Lenis** | smooth scroll, integrado ao ScrollTrigger; âncoras passam por ele |
| 3D | **Three 0.171** + **@react-three/fiber 9** + **@react-three/drei 10** + **@react-three/postprocessing** | um único `<Canvas>` de fundo |
| Ícones | **lucide-react** | |
| Áudio | **Web Audio API puro** | sem assets; blips sintetizados ([src/audio.js](src/audio.js)) |

> **Atenção R3F v9:** sensível a cópias duplicadas de React. O
> [vite.config.js](vite.config.js) faz `dedupe` de `react`, `react-dom`,
> `@react-three/fiber` e pré-bundla `three`/drei. Não remover sem motivo —
> evita o `Invalid hook call`.

Chunks manuais no build: `three` e `motion` (gsap+lenis) separados.

---

## 3. Estrutura de arquivos

```
aethel-chimera/
├── index.html              # meta/OG, fontes async, boot-splash estático (FCP), monta #root
├── vite.config.js          # dedupe R3F, manualChunks (three, motion)
├── tailwind.config.js      # tokens de cor/fonte da marca
├── postcss.config.js
├── package.json            # scripts: dev / build / preview
├── README.md               # guia curto (rodar + onde editar conteúdo)
├── MCP.md                  # ESTE documento
│
├── public/
│   ├── logo-white.png      # logo completa branca (header)
│   ├── logo-mark.png       # só o símbolo da quimera (favicon + amostragem de pixels do logo de partículas)
│   ├── og.png              # Open Graph
│   ├── robots.txt
│   ├── models/             # GLB do mundo 3D
│   │   ├── tree.glb        # bonsai do catálogo (4,4 MB, otimizado)
│   │   ├── creature.glb    # criatura do hero (2,8 MB) — NÃO usado (removido do hero); pode ser deletado
│   │   └── README.md       # como incorporar/otimizar GLB
│   ├── video/
│   │   └── chimera-logo-3d-video.mp4   # logo animada do rodapé/CTA
│   └── portfolio/          # gravações .mp4 dos cases (nome = slug); ignoradas no git
│       └── README.md
│
└── src/
    ├── main.jsx            # entrypoint React
    ├── App.jsx             # orquestra preloader, Lenis, ScrollTrigger, gate 3D, todas as seções
    ├── data.js             # TODO o conteúdo editável (ver §7)
    ├── scrollBus.js        # canal DOM ↔ 3D (progresso, tint, cardHits, openProject)
    ├── audio.js            # som sintetizado (mudo por padrão)
    ├── index.css           # base + utilidades + keyframes/efeitos
    └── components/         # ver §6
```

---

## 4. Arquitetura de runtime (fluxo)

1. **`index.html`** pinta um **boot-splash** estático (o `Æ`) antes do JS rodar
   — FCP/LCP baixos. Fontes (Space Grotesk, Instrument Serif, JetBrains Mono)
   carregam de forma assíncrona (`preload as=style` + swap).
2. **`main.jsx`** monta `<App>` em `#root` dentro de `<StrictMode>`.
3. **[App.jsx](src/App.jsx)** é o orquestrador:
   - **Preloader** ([Preloader.jsx](src/components/Preloader.jsx)) mede carga
     real e só roda **uma vez por sessão** (`sessionStorage['aethel-preloaded']`).
   - Instancia **Lenis** + casa com **ScrollTrigger** (a menos de
     `prefers-reduced-motion`). Expõe `window.__lenis`.
   - **Gate de 3D** (`enable3D`): desliga o mundo WebGL em **mobile**
     (`max-width:767px` ou `pointer:coarse`) e em **reduced-motion**, trocando
     por um fallback estático (gradiente radial). Mantém o Lighthouse mobile alto.
   - **`ImmersiveWorld`** é **`lazy()`** + `<Suspense>` — não bloqueia o paint.
   - Estado **`detail`** controla a abertura do case de projeto
     (`<ProjectDetail>`), alimentado por `onOpenProject` do catálogo.
   - Ordem das seções (`<main>`): Hero → Manifesto → Services → Catalog →
     Process → RoiDashboard → Results → Plans → FinalCTA. `Footer` fora do main.

### Sincronização DOM ↔ 3D — [scrollBus.js](src/scrollBus.js)

Objeto `bus` mutável (sem estado React, por performance — escrito por frame):

| Campo | Quem escreve | Quem lê | Para quê |
|---|---|---|---|
| `catalogP` | Catalog (ScrollTrigger) | ImmersiveWorld | progresso 0..1 do catálogo move os painéis 3D |
| `tint` | seção/projeto ativo | árvore 3D + aurora DOM | cor reativa coesa |
| `cardHits` | ImmersiveWorld (por frame, `worldPos.project(camera)`) | Catalog (`CardHitAreas`) | posiciona áreas clicáveis sobre **todos** os cards 3D visíveis |
| `openProject(i)` | App/Catalog | — | abre o `ProjectDetail` do índice `i` |

---

## 5. O mundo imersivo — [ImmersiveWorld.jsx](src/components/ImmersiveWorld.jsx) (1585 linhas)

Um único `<Canvas>` de fundo, coreografado por uma narrativa de **atos por
seção** (`ACTS`), com pesos que ligam/desligam elementos conforme o scroll:

- **Hero** — `glass:1` sinaliza "hero ativo" → poeira/brasas atmosféricas
  (a criatura GLB do hero foi **removida**; `glass` segue só adensando a poeira).
- **Catálogo** — `panels:1` sinaliza "catálogo ativo" → **árvore GLB**
  (`tree.glb`, `CatalogTreeGLB`) com os **cards orbitando** em hélice; o card
  frontal sobe ao centro (`y→0`) e a seção segura (HOLD ~15%) antes de soltar.
- **Contato/Rodapé** — `logo:1`, âmbar da marca.

**Infra GLB genérica:** `GLBModel` + `SceneModels` + registro `GLB_MODELS`
(`{key,url,section,position,scale,rotation}`), com `useGLTF.preload()`
automático e decode Draco/Meshopt (drei). Para adicionar modelo: ver §11 e
[public/models/README.md](public/models/README.md).

**Atmosfera:** `AtmosphereDust` = brasas que sobem/cintilam na página inteira,
tingidas por `tint`; pós-processamento `Bloom` (~1.0) + `Noise` + `Vignette`.

**Aterramento:** `GroundShadow` (plano com gradiente radial) ancora a árvore.

> ⚠️ **Dívida técnica viva:** código **procedural** antigo (`DnaHelix`,
> `Tree3D`, `NervousSystem`) e o `Fluid` (logo de partículas) ainda existem no
> arquivo **sem render** (tree-shaken). Podem ser apagados numa limpeza.
> O logo de partículas foi substituído por **vídeo** no DOM (ver Footer/FinalCTA).

### [ChimeraCore.jsx](src/components/ChimeraCore.jsx) (487 linhas)

Implementação alternativa de um mundo de ~28k partículas que morfam entre seis
formas (a última amostrada dos pixels de `logo-mark.png`). Descrita no
[README.md](README.md) como "a assinatura", mas a versão **em uso** é o
`ImmersiveWorld` com GLB + vídeo. Confirmar antes de mexer: pode ser legado.

---

## 6. Componentes — [src/components/](src/components/)

| Componente | Linhas | Papel |
|---|---|---|
| [ImmersiveWorld](src/components/ImmersiveWorld.jsx) | 1585 | Mundo WebGL de fundo (atos, GLB, cards 3D, atmosfera) |
| [ChimeraCore](src/components/ChimeraCore.jsx) | 487 | Quimera de partículas (provável legado — ver §5) |
| [Catalog](src/components/Catalog.jsx) | 281 | Catálogo pinado; filtros; `CardHitAreas` (botões DOM sobre cards 3D) |
| [ProcessChart](src/components/ProcessChart.jsx) | 199 | Gráficos SVG (diagnóstico / antes→depois / crescimento) |
| [RoiDashboard](src/components/RoiDashboard.jsx) | 183 | Calculadora de ROI ("Índice de Retorno Aethel") por canal |
| [Results](src/components/Results.jsx) | 155 | Contadores animados (STATS) + depoimentos |
| [Services](src/components/Services.jsx) | 150 | Seis dossiês de serviço, accent por serviço |
| [ProjectDetail](src/components/ProjectDetail.jsx) | 143 | Case do projeto (vídeo/poster, resultados, nav), trava o scroll |
| [Preloader](src/components/Preloader.jsx) | 142 | Carregamento real; 1×/sessão |
| [Navbar](src/components/Navbar.jsx) | 131 | Header (logo + Æ), menu, estado scrolled |
| [ConsoleHUD](src/components/ConsoleHUD.jsx) | 118 | Chrome de "console" (cantos, log vivo: seção/scroll/relógio) |
| [Hero](src/components/Hero.jsx) | 105 | Dobra inicial, dica de scroll |
| [FinalCTA](src/components/FinalCTA.jsx) | 95 | CTA final |
| [Footer](src/components/Footer.jsx) | 91 | Rodapé, relógio de Brasília, vídeo da quimera |
| [Process](src/components/Process.jsx) | 89 | Etapas do processo (cards) |
| [Plans](src/components/Plans.jsx) | 70 | Planos de manutenção |
| [Scramble](src/components/Scramble.jsx) | 63 | Texto decode/scramble ao entrar na viewport |
| [Manifesto](src/components/Manifesto.jsx) | 60 | Texto-tese, keywords em âmbar |
| [Cursor](src/components/Cursor.jsx) | 50 | Cursor custom (ponto+anel, rótulos `data-cursor`) |
| [Magnetic](src/components/Magnetic.jsx) | 40 | Wrapper magnético (botões/links) |
| [AudioToggle](src/components/AudioToggle.jsx) | 26 | Liga/desliga áudio (mudo por padrão) |
| [SectionHead](src/components/SectionHead.jsx) | 24 | Cabeçalho unificado (`SEC 0X`, kicker mono, título serif âmbar) |

---

## 7. Conteúdo — [src/data.js](src/data.js) (fonte única, "CMS-ready")

Todo o conteúdo editável vive aqui; os componentes só consomem estes arrays.

| Export | Conteúdo |
|---|---|
| `SERVICES` | 6 dossiês: `id, title, category, description, deliverables[], integrations[], image` |
| `CATALOG` | projetos: `name, slug, segment, year, summary, metrics[], tags[], url, image, video` |
| `PROCESS` | etapas do processo |
| `STATS` | números animados (Results) |
| `TESTIMONIALS` | depoimentos (`quote, name, role, company, rating`) |
| `PLANS` | Essencial / Performance (featured) / Enterprise |
| `NAV_LINKS` | âncoras do menu |
| `TICKER_ITEMS` | itens do ticker |
| `CONTACT` | `email`, `whatsapp`, `whatsappUrl` |

**Vídeos de case:** colocar `.mp4` em `public/portfolio/<slug>.mp4` (ex.:
`vetra.mp4`); sem o arquivo, a seção mostra a `image`. Os `.mp4` são
**ignorados no git** (binários grandes — adicionar no deploy).

> Placeholders a trocar antes de publicar: `url: '#'` nos projetos, imagens
> Unsplash, e o `CONTACT` (e-mail/WhatsApp ainda fictícios: `+55 11 90000-0000`).

---

## 8. Design system

**Cores** ([tailwind.config.js](tailwind.config.js)):
`obsidian #0B0B10` · `obsidian-deep #07070B` · `titanium #C8CAD0` ·
`ivory #F4F2EC` · `amber #E0A458` · `signal #3DDC97`.

**Fontes:** `display` = Space Grotesk · `serif` = Instrument Serif (destaque
âmbar nos títulos) · `mono` = JetBrains Mono (rótulos técnicos).

**Accents por serviço/seção:** `['#E0A458','#C9A66B','#5FA391','#9A85C4','#C77B4A','#D9A38E']`.

**Tracking:** `tightest -0.04em`, `wide2 0.18em`.

Efeitos globais (em [index.css](src/index.css)): `noise-overlay`, `vignette`,
animações `chimera-drift`/`chimera-hue` do vídeo do rodapé, keyframes diversos.

---

## 9. Performance & acessibilidade (regras a respeitar)

- **`prefers-reduced-motion`** desativa Lenis, pins e o 3D animado; conteúdo
  permanece completo e legível.
- **Gate mobile:** WebGL pesado **não** carrega em mobile/coarse pointer.
- **`ImmersiveWorld` é lazy** — nunca torná-lo import síncrono no caminho do LCP.
- **Boot-splash** estático no HTML pinta antes do JS — não remover.
- **GLB:** sempre otimizar antes de commitar (ver §11). GitHub bloqueia >100 MB.
- Catálogo horizontal pinado → vira **pilha vertical** abaixo de 768px.

---

## 10. Como rodar

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # produção → dist/
npm run preview   # serve o build
```

---

## 11. Receitas de evolução

**Adicionar/editar um serviço, plano, depoimento ou stat:** editar o array
correspondente em [src/data.js](src/data.js). Nada nos componentes.

**Adicionar um projeto ao catálogo:**
1. Novo objeto em `CATALOG` ([data.js](src/data.js)) com `slug` único.
2. Gravação em `public/portfolio/<slug>.mp4` (opcional; senão usa `image`).
3. Trocar `url:'#'` pelo link real e `image` pelo screenshot real.

**Incorporar um modelo GLB no mundo 3D:**
1. Otimizar o GLB cru (obrigatório — referência: bonsai foi de **134 MB → 4,4 MB**):
   ```bash
   npx @gltf-transform/cli simplify in.glb mid.glb --ratio 0.25 --error 0.008
   npx @gltf-transform/cli optimize mid.glb out.glb \
     --simplify false --compress draco --texture-compress webp --texture-size 1024
   ```
   Apagar cru/intermediários; commitar só o otimizado.
2. Soltar em `public/models/` e registrar em `GLB_MODELS`
   ([ImmersiveWorld.jsx](src/components/ImmersiveWorld.jsx)) com
   `{key,url,section,position,scale,rotation}`. Detalhes em
   [public/models/README.md](public/models/README.md).

**Mexer no fundo 3D:** trabalhar em `ACTS` (pesos por seção) e nos componentes
do `ImmersiveWorld`. Lembrar que `bus.cardHits` é o que mantém os cards 3D
clicáveis — se mudar a projeção, ajustar `CardHitAreas` no Catalog.

---

## 12. Estado atual & pendências

**Entregue / funcionando:**
- Narrativa por seção, preloader, HUD de console, cursor, áudio sintetizado.
- Catálogo 3D com árvore GLB real, cards orbitando, **todos clicáveis** →
  `ProjectDetail`. Logo da quimera no header; vídeo da quimera no rodapé.
- ROI Dashboard, gráficos SVG, contadores, planos.

**Pendências conhecidas** (memória do projeto):
- **Limpeza:** remover do `ImmersiveWorld` o código procedural morto
  (`DnaHelix`, `Tree3D`, `NervousSystem`, `Fluid`) que não renderiza mais.
- **Confirmar o papel de `ChimeraCore.jsx`** — provável legado da abordagem
  anterior (partículas) substituída por GLB+vídeo; o README ainda o descreve
  como "a assinatura". Decidir manter ou remover.
- **Conteúdo placeholder:** `CONTACT`, `url:'#'` dos projetos, imagens Unsplash,
  gravações `.mp4` reais do portfólio.
- Histórico de insatisfação com a árvore/cards-folha já foi endereçado pela
  virada para GLB; validar visualmente a versão atual.
```
