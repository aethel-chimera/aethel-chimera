import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CATALOG } from '../data'
import { blip } from '../audio'
import SectionHead from './SectionHead'
import { bus } from '../scrollBus'

gsap.registerPlugin(ScrollTrigger)

const FILTERS = ['Todos', 'WhatsApp', 'Pix', 'Agendamento', 'CRM']

// Áreas clicáveis (DOM) que seguem cada card 3D na tela: o mundo 3D publica a
// posição/visibilidade de cada card em bus.cardHits a cada frame, e aqui um rAF
// reposiciona os botões. Assim QUALQUER card visível é clicável (não só o central).
function CardHitAreas({ count, onOpen }) {
  const refs = useRef([])
  useEffect(() => {
    let raf
    const tick = () => {
      for (let i = 0; i < count; i++) {
        const el = refs.current[i]
        if (!el) continue
        const h = bus.cardHits[i]
        if (!h || h.vis < 0.12) {
          el.style.opacity = '0'
          el.style.pointerEvents = 'none'
        } else {
          el.style.left = `${h.x}%`
          el.style.top = `${h.y}%`
          el.style.width = `${7 + h.front * 11}%`
          el.style.height = `${9 + h.front * 20}%`
          el.style.opacity = '1'
          el.style.pointerEvents = 'auto'
        }
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [count])
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <button
          key={i}
          ref={(el) => (refs.current[i] = el)}
          onClick={() => onOpen?.(i)}
          aria-label={`Abrir case do projeto ${i + 1}`}
          className="group absolute z-[3] -translate-x-1/2 -translate-y-1/2 cursor-pointer border-0 bg-transparent outline-none focus:outline-none appearance-none"
          style={{ outline: 'none', opacity: 0, pointerEvents: 'none', WebkitTapHighlightColor: 'transparent' }}
        >
          <span className="pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:-translate-y-1 absolute -top-3 left-1/2 -translate-x-1/2 -translate-y-full mono-label text-[0.55rem] text-amber bg-obsidian/80 backdrop-blur-sm rounded-full px-4 py-2 whitespace-nowrap">
            abrir case →
          </span>
        </button>
      ))}
    </>
  )
}

// Card usado APENAS no mobile (onde não há mundo 3D): mantém a imagem.
function ProjectCard({ project, index, dimmed, onOpen }) {
  return (
    <article
      data-tags={project.tags.join('|')}
      className="catalog-card transition-all duration-500"
      style={{ opacity: dimmed ? 0.28 : 1, filter: dimmed ? 'grayscale(0.7)' : 'none' }}
    >
      <div className="at-panel rounded-xl">
        <span className="panel-scanlines" aria-hidden="true" />
        <div className="panel-media">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-ivory/10">
            <span className="font-mono text-[0.55rem] text-amber">{String(index + 1).padStart(2, '0')}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-ivory/20" />
            <span className="w-1.5 h-1.5 rounded-full bg-amber/60" />
            <span className="mono-label text-[0.5rem] text-titanium/70 ml-2 truncate">
              {project.name.toLowerCase().replace(/\s/g, '')}.com.br
            </span>
          </div>
          <img
            src={project.image}
            alt={`Mockup do site da ${project.name}`}
            className="w-full aspect-[16/10] object-cover"
            loading="lazy"
          />
        </div>
        <div className="p-7">
          <p className="mono-label text-titanium/70">
            {project.segment} · {project.year}
          </p>
          <h3 className="font-display font-semibold text-2xl text-ivory mt-2 mb-5">{project.name}</h3>
          <ul className="space-y-2 mb-5">
            {project.metrics.map((m) => (
              <li key={m} className="font-mono text-xs text-amber flex items-center gap-2">
                <span className="text-amber/50">+</span> {m}
              </li>
            ))}
          </ul>
          <div className="flex flex-wrap gap-2 mb-6">
            {project.tags.map((t) => (
              <span key={t} className="mono-label text-[0.55rem] border border-ivory/15 rounded-full px-3 py-1.5 text-titanium">
                {t}
              </span>
            ))}
          </div>
          <button
            onClick={() => onOpen(index)}
            data-no-drag
            className="mono-label inline-flex items-center gap-3 rounded-full border border-amber/60 text-amber px-6 py-3 hover:bg-amber hover:text-obsidian transition-colors duration-300"
          >
            Ver case do projeto →
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Catalog({ reducedMotion, onOpenProject }) {
  const sectionRef = useRef(null)
  const progressRef = useRef(null)
  const stRef = useRef(null)
  const [filter, setFilter] = useState('Todos')
  const [active, setActive] = useState(0)

  const matches = (p) => filter === 'Todos' || p.tags.includes(filter)
  const N = CATALOG.length

  // Desktop: a seção pina e o progresso do scroll percorre os slides 3D do
  // mundo WebGL (que ficam atrás). Cada slide ganha ~1 viewport de scroll.
  useEffect(() => {
    if (reducedMotion) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      // HOLD no fim: o último ~15% do scroll mantém o card centralizado (já
      // chegou ao centro) ANTES da seção soltar e descer. O ciclo dos cards
      // ocorre nos primeiros 85%; depois segura no último card centrado.
      const HOLD = 0.15
      // Envelope de presença da cena 3D: entra (0→1) no começo do pin, sai (1→0)
      // perto do fim. FORÇADO a 0 fora do pin (callbacks), p/ a árvore/cards nunca
      // vazarem nas seções vizinhas — nem vindo de Serviços, nem indo p/ Processo.
      const FADE_IN = 0.05 // fade-in nos primeiros 5% do pin
      const EXIT_START = 0.85 // começa a sair aos 85%
      const EXIT_END = 0.95 // some por completo aos 95% (resta 5% de respiro limpo)
      const setShow = (v) => {
        bus.catalogShow = Math.max(0, Math.min(1, v))
      }
      const st = ScrollTrigger.create({
        trigger: sectionRef.current,
        pin: true,
        start: 'top top',
        end: () => '+=' + Math.round((N + 0.6) * window.innerHeight),
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const pr = self.progress
          const p = Math.min(1, pr / (1 - HOLD)) // chega a 1 aos 85% e segura
          bus.catalogP = p
          // SAÍDA: dissolve/recua entre EXIT_START e EXIT_END
          bus.catalogExit = Math.max(0, Math.min(1, (pr - EXIT_START) / (EXIT_END - EXIT_START)))
          // PRESENÇA: 0→1 (fade-in) · 1 (meio) · 1→0 (saída)
          let show = 1
          if (pr < FADE_IN) show = pr / FADE_IN
          else if (pr >= EXIT_END) show = 0
          else if (pr > EXIT_START) show = 1 - (pr - EXIT_START) / (EXIT_END - EXIT_START)
          setShow(show)
          if (progressRef.current) progressRef.current.style.transform = `scaleX(${p})`
          setActive(Math.round(p * (N - 1)))
        },
        // fora do pin a cena 3D do catálogo NÃO existe (sem vazamento):
        onLeave: () => { setShow(0); bus.catalogExit = 1 }, // passou do fim → Processo
        onLeaveBack: () => { setShow(0); bus.catalogExit = 0 }, // voltou p/ Serviços
      })
      stRef.current = st
      return () => st.kill()
    })
    return () => mm.revert()
  }, [reducedMotion, N])

  const onFilter = (f) => {
    setFilter(f)
    blip(330, 0.04, 'sine')
    // desktop: rola até o primeiro projeto que casa com o filtro
    const st = stRef.current
    if (st && f !== 'Todos') {
      const idx = CATALOG.findIndex((p) => p.tags.includes(f))
      if (idx >= 0) {
        const targetScroll = st.start + (idx / (N - 1)) * (st.end - st.start)
        if (window.__lenis) window.__lenis.scrollTo(targetScroll)
        else window.scrollTo(0, targetScroll)
      }
    }
  }

  const p = CATALOG[active]

  return (
    <section id="catalogo" ref={sectionRef} className="relative z-[3] overflow-hidden py-24 md:py-0 md:h-screen">
      {/* ===================== DESKTOP: galeria de slides 3D ===================== */}
      <div className="hidden md:block">
        {/* áreas CLICÁVEIS sobre CADA card 3D visível (rastreiam a posição na
            tela) → clicar em qualquer card visível abre o case dele. */}
        <CardHitAreas count={N} onOpen={onOpenProject} />

        {/* topo: título + menu-comando */}
        <div className="absolute top-0 inset-x-0 px-10 pt-24 flex items-end justify-between gap-6 z-[4]">
          <SectionHead index="04" title="Catálogo" accent="vivo" />
          <div className="flex flex-col gap-2">
            <p className="mono-label text-titanium/60">O que você procura?</p>
            <div className="flex flex-wrap gap-x-5 gap-y-1 justify-end">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => onFilter(f)} className={`arrow-link ${filter === f ? '!text-amber' : ''}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* info do slide ativo — sem bloco escuro; legibilidade por sombra */}
        <div className="catalog-info absolute left-10 bottom-16 z-[4] max-w-md">
          <div key={active} className="catalog-active">
            {/* índice + segmento na MESMA linha (base alinhada) — sem o número
                gigante grudando no texto; mais visível (âmbar) e organizado */}
            <div className="flex items-baseline gap-3 mb-3">
              <span className="font-display font-semibold text-[clamp(2.2rem,3vw,3rem)] text-amber leading-none tabular-nums select-none">
                {String(active + 1).padStart(2, '0')}
              </span>
              <span className="h-px w-7 bg-amber/40 mb-2" aria-hidden="true" />
              <p className="mono-label text-amber/90">
                {p.segment} · {p.year}
              </p>
            </div>
            <h3 className="font-display font-semibold text-4xl text-ivory mb-4 leading-[1.05]">{p.name}</h3>
            <ul className="space-y-1 mb-5">
              {p.metrics.map((m) => (
                <li key={m} className="font-mono text-xs text-amber flex items-center gap-2">
                  <span className="text-amber/50">+</span> {m}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mb-5">
              {p.tags.map((t) => (
                <span key={t} className="mono-label text-[0.55rem] border border-ivory/15 rounded-full px-3 py-1.5 text-titanium">
                  {t}
                </span>
              ))}
            </div>
            <button
              onClick={() => onOpenProject?.(active)}
              data-no-drag
              className="mono-label mt-1 inline-flex items-center gap-3 rounded-full border border-amber/60 text-amber px-7 py-3.5 hover:bg-amber hover:text-obsidian transition-colors duration-300"
            >
              Ver case do projeto →
            </button>
          </div>
        </div>

        {/* contador + barra de progresso */}
        <div className="absolute right-10 bottom-16 z-[4] text-right">
          <p className="mono-label text-titanium/70 mb-3">
            {String(active + 1).padStart(2, '0')} / {String(N).padStart(2, '0')}
          </p>
          <div className="w-40 h-px bg-ivory/10 ml-auto">
            <div ref={progressRef} className="h-full bg-amber origin-left" style={{ transform: 'scaleX(0)' }} />
          </div>
        </div>

        {/* dica de scroll */}
        <p className="absolute left-1/2 -translate-x-1/2 bottom-7 z-[4] mono-label text-titanium/40">role para percorrer</p>
      </div>

      {/* ===================== MOBILE: pilha vertical (com imagem) ===================== */}
      <div className="md:hidden">
        <div className="px-5 mb-8">
          <SectionHead index="04" title="Catálogo" accent="vivo" />
          <div className="mt-6">
            <p className="mono-label text-titanium/60 mb-2">O que você procura?</p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {FILTERS.map((f) => (
                <button key={f} onClick={() => { setFilter(f); blip(330, 0.04, 'sine') }} className={`arrow-link ${filter === f ? '!text-amber' : ''}`}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-14 px-5">
          {CATALOG.map((proj, i) => (
            <ProjectCard key={proj.name} project={proj} index={i} dimmed={!matches(proj)} onOpen={onOpenProject} />
          ))}
        </div>
      </div>

      {/* SEO/acessibilidade: catálogo textual completo */}
      <ul className="sr-only">
        {CATALOG.map((proj) => (
          <li key={proj.name}>
            {proj.name} — {proj.segment}, {proj.year}. {proj.metrics.join(', ')}.{' '}
            <a href={proj.url}>Visitar site</a>
          </li>
        ))}
      </ul>
    </section>
  )
}
