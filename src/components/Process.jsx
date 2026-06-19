import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROCESS } from '../data'
import SectionHead from './SectionHead'

gsap.registerPlugin(ScrollTrigger)

// micro-animações SVG por etapa
function StepAnim({ type }) {
  if (type === 'scan')
    return (
      <svg viewBox="0 0 120 100" className="w-28 h-24" aria-hidden="true">
        {[0, 1, 2, 3].map((r) =>
          [0, 1, 2, 3, 4].map((c) => (
            <rect key={`${r}-${c}`} x={8 + c * 22} y={8 + r * 22} width="16" height="16" rx="2" fill="none" stroke="#C8CAD0" strokeOpacity="0.25" />
          ))
        )}
        <rect className="scan-line" x="4" y="6" width="112" height="20" rx="3" fill="#E0A458" opacity="0.18" />
      </svg>
    )
  if (type === 'wireframe')
    return (
      <svg viewBox="0 0 120 100" className="w-28 h-24" aria-hidden="true">
        <path className="draw-path" d="M10 14 H110 M10 14 V90 H110 V14 M10 34 H110 M48 34 V90 M10 60 H48" fill="none" stroke="#E0A458" strokeWidth="1.5" />
      </svg>
    )
  if (type === 'blocks')
    return (
      <svg viewBox="0 0 120 100" className="w-28 h-24" aria-hidden="true">
        <rect className="block-pulse" x="10" y="36" width="26" height="26" rx="3" fill="#E0A458" />
        <rect className="block-pulse" x="48" y="36" width="26" height="26" rx="3" fill="#E0A458" />
        <rect className="block-pulse" x="86" y="36" width="26" height="26" rx="3" fill="#E0A458" />
        <line className="block-pulse" x1="36" y1="49" x2="48" y2="49" stroke="#C8CAD0" strokeWidth="2" />
        <line className="block-pulse" x1="74" y1="49" x2="86" y2="49" stroke="#C8CAD0" strokeWidth="2" />
      </svg>
    )
  return (
    <svg viewBox="0 0 120 100" className="w-28 h-24" aria-hidden="true">
      <path className="ekg-path" d="M0 50 H30 L40 30 L52 70 L62 42 L70 50 H120" fill="none" stroke="#3DDC97" strokeWidth="2" />
    </svg>
  )
}

export default function Process({ reducedMotion }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.process-card')
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return
        const next = cards[i + 1]
        const dim = card.querySelector('.process-dim')
        // O card só escurece/encolhe enquanto o PRÓXIMO sobe sobre ele:
        // começa quando o próximo entra na metade de baixo e termina quando
        // já cobriu o atual. Sem blur — escurecimento limpo via overlay.
        gsap.to(card, {
          scale: 0.93,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 78%', end: 'top 18%', scrub: true },
        })
        gsap.to(dim, {
          opacity: 0.72,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 78%', end: 'top 18%', scrub: true },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section id="processo" ref={rootRef} className="relative z-[3] px-5 md:px-10 py-32">
      <SectionHead index="05" kicker="04 etapas" title="Protocolo" accent="de construção" className="mb-16" />

      <div className="space-y-6 md:space-y-0">
        {PROCESS.map((step, i) => (
          <div
            key={step.num}
            className="process-card relative md:sticky bg-obsidian-deep border border-ivory/10 rounded-2xl p-8 md:p-14 origin-top will-change-transform overflow-hidden"
            style={{ top: `calc(5rem + ${i * 1.25}rem)` }}
          >
            <div className="grid md:grid-cols-[auto_1fr_auto] gap-8 items-center">
              <span aria-hidden="true" data-num={step.num} className="ghost-num font-mono text-6xl md:text-8xl text-ivory/10 font-bold leading-none" />
              <div>
                <h3 className="font-display font-semibold text-2xl md:text-4xl text-ivory mb-3">{step.title}</h3>
                <p className="text-titanium leading-relaxed max-w-xl">{step.description}</p>
              </div>
              <div className="hidden md:block">
                <StepAnim type={step.anim} />
              </div>
            </div>
            {/* overlay de escurecimento progressivo (substitui o blur) */}
            <div
              className="process-dim pointer-events-none absolute inset-0 rounded-2xl opacity-0 bg-gradient-to-b from-obsidian-deep/40 to-obsidian-deep"
              aria-hidden="true"
            />
          </div>
        ))}
      </div>
    </section>
  )
}
