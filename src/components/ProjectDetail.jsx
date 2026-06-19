import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { X, ArrowRight, ArrowLeft, ArrowUpRight } from 'lucide-react'
import { CATALOG } from '../data'

// Seção interna do projeto (estilo "case" imersivo): a gravação do site toca
// em tela cheia, com a info ao lado. Sem o vídeo, mostra a imagem (poster).
export default function ProjectDetail({ index, onClose, onNav }) {
  const project = CATALOG[index]
  const rootRef = useRef(null)
  const [videoFailed, setVideoFailed] = useState(false)

  // entrada animada + trava de scroll (Lenis) enquanto aberto
  useEffect(() => {
    setVideoFailed(false)
    const lenis = window.__lenis
    lenis?.stop()
    document.body.style.overflow = 'hidden'
    const ctx = gsap.context(() => {
      gsap.fromTo(rootRef.current, { opacity: 0 }, { opacity: 1, duration: 0.4, ease: 'power2.out' })
      gsap.fromTo('.detail-reveal', { y: 28, opacity: 0 }, { y: 0, opacity: 1, duration: 0.7, stagger: 0.07, ease: 'power3.out', delay: 0.1 })
    }, rootRef)
    return () => {
      ctx.revert()
      lenis?.start()
      document.body.style.overflow = ''
    }
  }, [index])

  // teclado: Esc fecha, setas navegam
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onNav((index + 1) % CATALOG.length)
      else if (e.key === 'ArrowLeft') onNav((index - 1 + CATALOG.length) % CATALOG.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, onClose, onNav])

  const hasVideo = project.video && !videoFailed

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[200] bg-obsidian-deep/95 backdrop-blur-sm overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`Projeto ${project.name}`}
    >
      {/* HUD de canto */}
      <span className="hud-corner tl" aria-hidden="true" />
      <span className="hud-corner tr" aria-hidden="true" />
      <span className="hud-corner bl" aria-hidden="true" />
      <span className="hud-corner br" aria-hidden="true" />

      {/* barra superior */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-5 md:px-10 h-16 bg-gradient-to-b from-obsidian-deep to-transparent">
        <span className="mono-label text-amber">
          [ {String(index + 1).padStart(2, '0')} / {String(CATALOG.length).padStart(2, '0')} ] // CASE
        </span>
        <button onClick={onClose} className="mono-label text-titanium hover:text-ivory flex items-center gap-2" aria-label="Fechar projeto">
          Fechar <X size={16} aria-hidden="true" />
        </button>
      </div>

      <div className="px-5 md:px-10 pb-24 pt-4 max-w-7xl mx-auto">
        {/* player / poster */}
        <div className="detail-reveal relative rounded-xl overflow-hidden border border-ivory/12 bg-obsidian aspect-video">
          {hasVideo ? (
            <video
              key={project.slug}
              className="w-full h-full object-cover"
              src={project.video}
              poster={project.image}
              autoPlay
              muted
              loop
              playsInline
              controls
              onError={() => setVideoFailed(true)}
            />
          ) : (
            <>
              <img src={project.image} alt={`Site da ${project.name}`} className="w-full h-full object-cover" />
              <span className="absolute bottom-4 left-4 mono-label text-[0.6rem] text-titanium/70 bg-obsidian/70 rounded-full px-3 py-1.5">
                gravação em breve
              </span>
            </>
          )}
        </div>

        {/* info */}
        <div className="grid md:grid-cols-[1.4fr_1fr] gap-10 mt-10">
          <div>
            <p className="detail-reveal mono-label text-amber mb-3">{project.segment} · {project.year}</p>
            <h2 className="detail-reveal font-display font-semibold text-[clamp(2.2rem,5vw,4rem)] text-ivory leading-none mb-6">
              {project.name}
            </h2>
            <p className="detail-reveal text-titanium text-lg leading-relaxed max-w-2xl">{project.summary}</p>
            <a
              href={project.url}
              target="_blank"
              rel="noopener noreferrer"
              className="detail-reveal arrow-link mt-8 inline-flex"
            >
              Visitar site <ArrowUpRight size={14} aria-hidden="true" />
            </a>
          </div>

          <div className="detail-reveal">
            <p className="mono-label text-titanium/60 mb-4">Resultados</p>
            <ul className="space-y-3 mb-8">
              {project.metrics.map((m) => (
                <li key={m} className="font-mono text-sm text-amber flex items-center gap-2">
                  <span className="text-amber/50">+</span> {m}
                </li>
              ))}
            </ul>
            <p className="mono-label text-titanium/60 mb-3">Integrações</p>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((t) => (
                <span key={t} className="mono-label text-[0.6rem] border border-ivory/15 rounded-full px-3 py-1.5 text-titanium">
                  {t}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* navegação entre projetos */}
        <div className="detail-reveal flex items-center justify-between border-t border-ivory/10 mt-16 pt-8">
          <button onClick={() => onNav((index - 1 + CATALOG.length) % CATALOG.length)} className="arrow-link group">
            <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-1" aria-hidden="true" /> Anterior
          </button>
          <button onClick={() => onNav((index + 1) % CATALOG.length)} className="mono-label text-titanium hover:text-ivory inline-flex items-center gap-2 group">
            Próximo <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  )
}
