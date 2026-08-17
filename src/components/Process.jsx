import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { PROCESS, INVEST_MIN, INVEST_MAX, INVEST_REF } from '../data'
import SectionHead from './SectionHead'
import ProcessChart from './ProcessChart'

gsap.registerPlugin(ScrollTrigger)

// Fator de entrega: quanto do alvo a obra atinge conforme o investimento mensal.
// Ancorado em 1,0 no investimento de referência (R$ 8.000) — então no padrão o
// gráfico mostra exatamente os números da oferta; abaixo entrega menos, acima um
// pouco mais (retornos decrescentes). Faixa do slider: INVEST_MIN–INVEST_MAX (data.js).
function deliveryFactor(invest) {
  const f =
    invest <= INVEST_REF
      ? 0.55 + 0.45 * ((invest - INVEST_MIN) / (INVEST_REF - INVEST_MIN))
      : 1 + 0.14 * ((invest - INVEST_REF) / (INVEST_MAX - INVEST_REF))
  return Math.max(0.55, Math.min(1.14, f))
}

export default function Process({ reducedMotion, invest = 8000 }) {
  const rootRef = useRef(null)
  const factor = deliveryFactor(invest)

  // O recuo de escala e o escurecimento SÓ existem onde há empilhamento, ou
  // seja, no desktop. No mobile os cards ficam um abaixo do outro em fluxo
  // normal: nada cobre nada, então escurecer o card anterior não faria sentido.
  // O matchMedia NÃO pode ficar dentro de um gsap.context — o revert do context
  // derruba os registros do matchMedia e os efeitos param de rodar (foi o que
  // aconteceu no Manifesto). Por isso o escopo do seletor vem por rootRef.
  useEffect(() => {
    if (reducedMotion) return
    const mm = gsap.matchMedia()
    mm.add('(min-width: 768px)', () => {
      const cards = gsap.utils.toArray('.process-card', rootRef.current)
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
    })
    return () => mm.revert()
  }, [reducedMotion])

  return (
    <section id="processo" ref={rootRef} className="relative z-[3] px-5 md:px-10 py-32">
      <SectionHead index="07" kicker="04 etapas" title="Protocolo" accent="de construção" className="mb-10" />

      {/* Os indicadores de cada etapa reagem ao investimento definido na
          Calculadora de Retorno, logo acima (estado `invest` compartilhado). */}
      {/* EMPILHAMENTO — só no DESKTOP: o card gruda pelo topo, com offset
          crescente, e o seguinte sobe por cima formando a cascata.
          MOBILE: sem empilhamento. O card é MAIS ALTO que a viewport (texto +
          gráfico passam de 800px numa tela de ~730px) e, grudado, o rodapé
          nunca chegava a aparecer — o card travava e o seguinte cobria
          justamente o trecho ainda não lido. Aqui eles ficam um abaixo do
          outro, em fluxo normal e com respiro entre eles: cada card rola
          inteiro e nada cobre nada. */}
      <div>
        {PROCESS.map((step, i) => (
          <div
            key={step.num}
            className="process-card card-wave group relative mb-6 last:mb-0 md:mb-0 md:sticky md:top-[var(--stick-top)] bg-obsidian-deep border border-ivory/10 rounded-2xl p-7 md:p-12 origin-top md:will-change-transform overflow-hidden"
            style={{ '--stick-top': `calc(5rem + ${i * 1.1}rem)` }}
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
