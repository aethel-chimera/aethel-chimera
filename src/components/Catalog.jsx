import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CATALOG } from '../data'
import { blip } from '../audio'
import SectionHead from './SectionHead'
import { bus } from '../scrollBus'

gsap.registerPlugin(ScrollTrigger)

// Filtros do menu-comando (estilo AT "WHAT ARE YOU LOOKING FOR?").
const FILTERS = ['Todos', 'WhatsApp', 'Pix', 'Agendamento', 'CRM']

function ProjectCard({ project, index, dimmed }) {
  const cardRef = useRef(null)
  const frameRef = useRef(null)

  // tilt 3D que segue o mouse — sensação de painel flutuante no espaço
  useEffect(() => {
    const card = cardRef.current
    const frame = frameRef.current
    if (!card || !frame || !window.matchMedia('(pointer: fine)').matches) return

    const target = { rx: 0, ry: 0 }
    const cur = { rx: 0, ry: 0 }
    let raf
    let active = false

    const onMove = (e) => {
      const r = card.getBoundingClientRect()
      target.ry = ((e.clientX - r.left) / r.width - 0.5) * 12
      target.rx = -((e.clientY - r.top) / r.height - 0.5) * 9
      active = true
    }
    const onLeave = () => {
      target.rx = 0
      target.ry = 0
    }
    const tick = () => {
      cur.rx += (target.rx - cur.rx) * 0.08
      cur.ry += (target.ry - cur.ry) * 0.08
      if (active) frame.style.transform = `perspective(1100px) rotateX(${cur.rx}deg) rotateY(${cur.ry}deg)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    card.addEventListener('mousemove', onMove)
    card.addEventListener('mouseleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      card.removeEventListener('mousemove', onMove)
      card.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <article
      ref={cardRef}
      data-tags={project.tags.join('|')}
      data-cursor="VER"
      className="catalog-card shrink-0 w-[88vw] md:w-[72vw] max-w-5xl transition-all duration-500"
      style={{ opacity: dimmed ? 0.28 : 1, filter: dimmed ? 'grayscale(0.7)' : 'none' }}
    >
      <div ref={frameRef} className="at-panel rounded-xl will-change-transform">
        <span className="panel-scanlines" aria-hidden="true" />
        {/* ticks de canto */}
        <span className="panel-tick" style={{ top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
        <span className="panel-tick" style={{ top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
        <span className="panel-tick" style={{ bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
        <span className="panel-tick" style={{ bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />

        <div className="grid md:grid-cols-[1.5fr_1fr]">
          {/* mídia com moldura de navegador */}
          <div className="panel-media border-r border-ivory/10">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-ivory/10">
              <span className="font-mono text-[0.55rem] text-amber">{String(index + 1).padStart(2, '0')}</span>
              <span className="w-1.5 h-1.5 rounded-full bg-ivory/20" />
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

          {/* dados */}
          <div className="p-7 md:p-9 flex flex-col">
            <p className="mono-label text-titanium/70">
              {project.segment} · {project.year}
            </p>
            <h3 className="font-display font-semibold text-2xl md:text-3xl text-ivory mt-2 mb-6">{project.name}</h3>
            <ul className="space-y-2 mb-6">
              {project.metrics.map((m) => (
                <li key={m} className="font-mono text-xs text-amber flex items-center gap-2">
                  <span className="text-amber/50">+</span> {m}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2 mb-8 mt-auto">
              {project.tags.map((t) => (
                <span key={t} className="mono-label text-[0.55rem] border border-ivory/15 rounded-full px-3 py-1.5 text-titanium">
                  {t}
                </span>
              ))}
            </div>
            <a href={project.url} className="arrow-link">
              Visitar site
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}

export default function Catalog({ reducedMotion }) {
  const sectionRef = useRef(null)
  const trackRef = useRef(null)
  const progressRef = useRef(null)
  const [filter, setFilter] = useState('Todos')

  const matches = (p) => filter === 'Todos' || p.tags.includes(filter)

  useEffect(() => {
    if (reducedMotion) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      const track = trackRef.current
      const getDistance = () => track.scrollWidth - window.innerWidth
      gsap.to(track, {
        x: () => -getDistance(),
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          pin: true,
          scrub: 1,
          end: () => '+=' + getDistance(),
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            if (progressRef.current) progressRef.current.style.transform = `scaleX(${self.progress})`
            bus.catalogP = self.progress // alimenta os painéis 3D do fundo
          },
        },
      })
    })
    return () => mm.revert()
  }, [reducedMotion])

  const onFilter = (f) => {
    setFilter(f)
    blip(330, 0.04, 'sine')
  }

  return (
    <section
      id="catalogo"
      ref={sectionRef}
      className="relative z-[3] py-24 md:py-0 md:min-h-screen md:flex md:flex-col md:justify-center overflow-hidden"
    >
      <div className="px-5 md:px-10 mb-10 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <SectionHead index="04" title="Catálogo" accent="vivo" />

        {/* menu-comando estilo Active Theory */}
        <div className="flex flex-col gap-2">
          <p className="mono-label text-titanium/60">O que você procura?</p>
          <div className="flex flex-wrap gap-x-5 gap-y-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => onFilter(f)}
                className={`arrow-link ${filter === f ? '!text-amber' : ''}`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* desktop: stream horizontal pinado / mobile: pilha vertical */}
      <div ref={trackRef} className="flex flex-col gap-14 px-5 md:flex-row md:gap-10 md:px-10 md:w-max md:items-center">
        {CATALOG.map((p, i) => (
          <ProjectCard key={p.name} project={p} index={i} dimmed={!matches(p)} />
        ))}
      </div>

      {/* barra de progresso do stream */}
      <div className="hidden md:block mx-10 mt-10 h-px bg-ivory/10">
        <div ref={progressRef} className="h-full bg-amber origin-left" style={{ transform: 'scaleX(0)' }} />
      </div>
    </section>
  )
}
