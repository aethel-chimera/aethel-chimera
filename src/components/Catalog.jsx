import { useEffect, useId, useRef, useState } from 'react'
import { CATALOG } from '../data'
import { blip } from '../audio'
import SectionHead from './SectionHead'
import CatalogCardOverlay from './CatalogCardOverlay'

const FILTERS = ['Todos', 'WhatsApp', 'Pix', 'Agendamento', 'CRM']

// CTA do case com efeito "TV estragada": no hover, ruído de TV + fantasma RGB +
// scanlines piscam em espasmos aleatórios e independentes (dois temporizadores).
// Keyframes em index.css. Fundo escuro no hover para o mix-blend-screen render.
function GlitchCaseButton({ onClick, children }) {
  const [hovered, setHovered] = useState(false)
  const [sNoise, setSNoise] = useState(0) // trilha do ruído de TV
  const [sGhost, setSGhost] = useState(0) // trilha do fantasma RGB + scanlines
  const alive = useRef(false)
  const timers = useRef([])
  const filterId = `glitch-snow-${useId().replace(/[^a-zA-Z0-9]/g, '')}`
  const I = 0.55 // intensidade dos espasmos

  useEffect(() => {
    if (!hovered) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return
    alive.current = true
    timers.current = []

    const tick = (setter) => {
      if (!alive.current) return
      const gap = 280 + Math.random() * (1200 - 600 * I) // pausa aleatória
      const t1 = setTimeout(() => {
        if (!alive.current) return
        setter(0.55 + Math.random() * 0.45) // força aleatória da rajada
        const t2 = setTimeout(() => {
          if (!alive.current) return
          setter(0)
          tick(setter)
        }, 45 + Math.random() * 110) // duração aleatória da rajada
        timers.current.push(t2)
      }, gap)
      timers.current.push(t1)
    }

    tick(setSNoise)
    tick(setSGhost)

    return () => {
      alive.current = false
      timers.current.forEach(clearTimeout)
      setSNoise(0)
      setSGhost(0)
    }
  }, [hovered])

  const ghostOp = sGhost > 0 ? (0.5 + 0.4 * I) * sGhost : 0
  const noiseOp = sNoise > 0 ? (0.3 + 0.5 * I) * sNoise : 0
  const scanOp = sGhost > 0 ? 0.55 * sGhost : 0
  const snap = { transition: 'opacity 30ms linear' }

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      className="mono-label relative isolate inline-flex items-center gap-3 overflow-hidden rounded-full border border-amber/60 px-6 py-3 text-amber transition-[border-color,box-shadow] duration-150 hover:border-amber hover:shadow-[0_0_0_1px_rgba(216,216,218,.22),0_8px_28px_rgba(0,0,0,.6)]"
    >
      <span className="relative z-[2]">{children}</span>

      {hovered && (
        <>
          {/* fantasmas RGB (trilha 'ghost') */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[4] grid place-items-center text-[#ff0033] mix-blend-screen"
            style={{ ...snap, opacity: ghostOp, animation: 'glitch-rgbA .2s steps(3,end) infinite' }}
          >
            {children}
          </span>
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[4] grid place-items-center text-[#00ffe6] mix-blend-screen"
            style={{ ...snap, opacity: ghostOp, animation: 'glitch-rgbB .2s steps(3,end) infinite' }}
          >
            {children}
          </span>

          {/* ruído de TV (trilha 'noise') */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[3] mix-blend-screen"
            style={{ ...snap, opacity: noiseOp }}
          >
            <svg className="block h-full w-full" preserveAspectRatio="none">
              <filter id={filterId}>
                <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch">
                  <animate
                    attributeName="seed"
                    values="1;5;9;3;12;7;15;2"
                    dur="0.5s"
                    repeatCount="indefinite"
                    calcMode="discrete"
                  />
                </feTurbulence>
                <feColorMatrix type="saturate" values="0" />
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.7" />
                </feComponentTransfer>
              </filter>
              <rect width="100%" height="100%" filter={`url(#${filterId})`} />
            </svg>
          </div>

          {/* scanlines (acompanham a trilha 'ghost') */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 z-[5] mix-blend-overlay"
            style={{
              ...snap,
              opacity: scanOp,
              backgroundImage: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 1px, rgba(0,0,0,.5) 1px 3px)',
              animation: 'glitch-scan .3s linear infinite',
            }}
          />
        </>
      )}
    </button>
  )
}

// Card de projeto (imagem + dados). Grade responsiva — sem 3D.
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
          <GlitchCaseButton onClick={() => onOpen?.(index)}>Ver case do projeto →</GlitchCaseButton>
        </div>
      </div>
    </article>
  )
}

export default function Catalog({ onOpenProject, reducedMotion }) {
  const [filter, setFilter] = useState('Todos')
  const matches = (p) => filter === 'Todos' || p.tags.includes(filter)

  const onFilter = (f) => {
    setFilter(f)
    blip(330, 0.04, 'sine')
  }

  // Cinemático "catálogo vivo": a cena 3D (espadachim com a Lune Améthyste) toca
  // em LOOP — o personagem gira a espada e dispara o pulso de energia ametista (o
  // "lançamento"). SEM cards no vídeo: os cards são adicionados aqui como DOM
  // (data-driven via CATALOG), sobre o lado direito do vídeo, sincronizados ao
  // tempo do `videoRef` se desejar. Reprodução sequencial = suave (sem scrubbing).
  const videoRef = useRef(null)

  return (
    <section id="catalogo" className="relative z-[3] px-5 md:px-10 py-32">
      {/* ---- Cinemático FULL-SCREEN: a Lune Améthyste girando + pulso de energia (loop) ----
           h-screen + object-cover -> preenche a viewport inteira (vídeo widescreen 2.75:1).
           -mt-32 cancela o padding-top da seção pra a cena começar no topo. */}
      <div className="relative -mx-5 md:-mx-10 -mt-32 mb-24 h-screen overflow-hidden bg-obsidian">
        <video
          ref={videoRef}
          src="/catalogo-vivo.mp4"
          poster="/catalogo-vivo-poster.jpg"
          muted
          playsInline
          preload="auto"
          autoPlay={!reducedMotion || undefined}
          loop={!reducedMotion || undefined}
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* CARD OVERLAY (esqueleto editável) — card sobre o vídeo, data-driven via CATALOG.
            Ajuste tempos/posição dentro de CatalogCardOverlay.jsx (LAUNCH_T / EXIT_T / right-[5%]). */}
        <CatalogCardOverlay videoRef={videoRef} onOpenProject={onOpenProject} />
      </div>

      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-14">
        <SectionHead index="04" title="Catálogo" accent="vivo" />
        <div className="flex flex-col gap-2">
          <p className="mono-label text-titanium/60">O que você procura?</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1 md:justify-end">
            {FILTERS.map((f) => (
              <button key={f} onClick={() => onFilter(f)} className={`arrow-link ${filter === f ? '!text-amber' : ''}`}>
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
        {CATALOG.map((proj, i) => (
          <ProjectCard key={proj.name} project={proj} index={i} dimmed={!matches(proj)} onOpen={onOpenProject} />
        ))}
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
