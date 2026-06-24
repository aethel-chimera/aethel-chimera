import { useState } from 'react'
import { CATALOG } from '../data'
import { blip } from '../audio'
import SectionHead from './SectionHead'

const FILTERS = ['Todos', 'WhatsApp', 'Pix', 'Agendamento', 'CRM']

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
          <button
            onClick={() => onOpen?.(index)}
            className="mono-label inline-flex items-center gap-3 rounded-full border border-amber/60 text-amber px-6 py-3 hover:bg-amber hover:text-obsidian transition-colors duration-300"
          >
            Ver case do projeto →
          </button>
        </div>
      </div>
    </article>
  )
}

export default function Catalog({ onOpenProject }) {
  const [filter, setFilter] = useState('Todos')
  const matches = (p) => filter === 'Todos' || p.tags.includes(filter)

  const onFilter = (f) => {
    setFilter(f)
    blip(330, 0.04, 'sine')
  }

  return (
    <section id="catalogo" className="relative z-[3] px-5 md:px-10 py-32">
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
