import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROCESS } from '../data'
import SectionHead from './SectionHead'
import ProcessChart from './ProcessChart'

gsap.registerPlugin(ScrollTrigger)

// Fator de entrega: quanto do alvo a obra atinge conforme o investimento mensal.
// Ancorado em 1,0 no investimento de referência (R$ 8.000) — então no padrão o
// gráfico mostra exatamente os números da oferta; abaixo entrega menos, acima um
// pouco mais (retornos decrescentes). Faixa do slider: R$ 1.500–50.000.
function deliveryFactor(invest) {
  const REF = 8000
  const f =
    invest <= REF
      ? 0.55 + 0.45 * ((invest - 1500) / (REF - 1500))
      : 1 + 0.14 * ((invest - REF) / (50000 - REF))
  return Math.max(0.55, Math.min(1.14, f))
}

export default function Process({ reducedMotion, invest = 8000 }) {
  const rootRef = useRef(null)
  const factor = deliveryFactor(invest)

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray('.process-card')
      cards.forEach((card, i) => {
        if (i === cards.length - 1) return
        const next = cards[i + 1]
        const dim = card.querySelector('.process-dim')
        gsap.to(card, {
          scale: 0.95,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 80%', end: 'top 20%', scrub: true },
        })
        gsap.to(dim, {
          opacity: 0.7,
          ease: 'none',
          scrollTrigger: { trigger: next, start: 'top 80%', end: 'top 20%', scrub: true },
        })
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section id="processo" ref={rootRef} className="relative z-[3] px-5 md:px-10 py-32">
      <SectionHead index="06" kicker="04 etapas" title="Protocolo" accent="de construção" className="mb-10" />

      {/* Os indicadores de cada etapa reagem ao investimento definido na
          Calculadora de Retorno, logo acima (estado `invest` compartilhado). */}
      <div className="space-y-6 md:space-y-0">
        {PROCESS.map((step, i) => (
          <div
            key={step.num}
            className="process-card card-wave group relative md:sticky bg-obsidian-deep border border-ivory/10 rounded-2xl p-7 md:p-12 origin-top will-change-transform overflow-hidden"
            style={{ top: `calc(5rem + ${i * 1.1}rem)` }}
          >
            <div className="grid md:grid-cols-[1.05fr_0.95fr] gap-8 md:gap-12 items-center">
              {/* conteúdo */}
              <div>
                <div className="flex items-center gap-4 mb-4">
                  <span
                    aria-hidden="true"
                    data-num={step.num}
                    className="ghost-num font-mono text-5xl md:text-7xl text-ivory/10 font-bold leading-none"
                  />
                  <h3 className="font-display font-semibold text-2xl md:text-4xl text-ivory">{step.title}</h3>
                </div>
                <p className="text-titanium leading-relaxed mb-6 max-w-xl">{step.description}</p>
                <ul className="space-y-2.5">
                  {step.how.map((h) => (
                    <li key={h} className="flex gap-2.5 text-sm text-titanium/85 leading-snug">
                      <span className="text-amber mt-px shrink-0" aria-hidden="true">+</span>
                      {h}
                    </li>
                  ))}
                </ul>
              </div>

              {/* painel de diagnóstico / gráfico */}
              <div className="relative rounded-xl border border-ivory/10 bg-obsidian/50 p-6 md:p-7">
                <span className="panel-tick" style={{ top: 8, left: 8, borderTopWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
                <span className="panel-tick" style={{ top: 8, right: 8, borderTopWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
                <span className="panel-tick" style={{ bottom: 8, left: 8, borderBottomWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
                <span className="panel-tick" style={{ bottom: 8, right: 8, borderBottomWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
                <ProcessChart chart={step.chart} factor={factor} />
              </div>
            </div>

            {/* overlay de escurecimento progressivo (empilhamento) */}
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
