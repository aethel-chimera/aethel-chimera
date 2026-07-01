import { Check } from 'lucide-react'
import { PLANS } from '../data'
import LiquidButton from './LiquidButton'
import SectionHead from './SectionHead'

// rola até o contato respeitando o smooth scroll (Lenis), com fallback nativo
function scrollToContact() {
  const el = document.querySelector('#contato')
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -64 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

export default function Plans() {
  return (
    <section id="planos" className="relative z-[3] px-5 md:px-10 py-32">
      <div className="mb-16 max-w-2xl">
        <SectionHead index="09" kicker="Operação contínua" title="Manutenção" accent="mensal" className="mb-6" />
        <p className="text-titanium leading-relaxed">
          O site não termina no lançamento. Escolha o nível de operação contínua para manter o
          organismo saudável e em evolução.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6 items-stretch">
        {PLANS.map((plan) => (
          // wrapper SEM overflow para o selo poder sair acima do card sem ser cortado
          <div key={plan.name} className={`relative ${plan.featured ? 'md:-translate-y-4' : ''}`}>
            {plan.badge && (
              <span className="absolute -top-3 left-8 z-10 mono-label text-[0.6rem] bg-amber text-obsidian rounded-full px-4 py-1.5">
                {plan.badge}
              </span>
            )}
            {/* card COM overflow-hidden (a linha de luz do topo acompanha os
                cantos arredondados). O pb-28 reserva o espaço onde o botão fica. */}
            <div
              className={`card-wave overflow-hidden relative rounded-2xl px-8 md:px-10 pt-8 md:pt-10 pb-36 h-full flex flex-col ${
                plan.featured
                  ? 'bg-ivory text-obsidian'
                  : 'bg-obsidian-deep border border-ivory/10 text-ivory'
              }`}
            >
              <p className={`mono-label mb-6 ${plan.featured ? 'text-obsidian/60' : 'text-titanium/60'}`}>{plan.name}</p>
              <p className="font-display font-semibold text-4xl mb-1">
                {plan.price}
                <span className={`text-base font-normal ${plan.featured ? 'text-obsidian/60' : 'text-titanium/70'}`}>
                  {plan.period}
                </span>
              </p>
              <ul className="mt-8 space-y-3 flex-1">
                {plan.items.map((item) => (
                  <li key={item} className={`flex gap-3 text-sm leading-relaxed ${plan.featured ? 'text-obsidian/80' : 'text-titanium'}`}>
                    <Check size={16} className={`shrink-0 mt-0.5 ${plan.featured ? 'text-obsidian' : 'text-amber'}`} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* botão FORA do card (o wrapper externo não tem overflow), sobreposto
                na base. Assim o canvas do efeito transborda sem ser recortado.
                Card claro (featured): efeito ESCURO + texto que inverte (mix-blend). */}
            <div className="absolute inset-x-0 bottom-9 md:bottom-10 flex justify-center">
              <LiquidButton
                width={268}
                height={48}
                pad={30}
                fontSize={12}
                viscosity={4}
                approach={80}
                deform={3}
                bounce={2}
                organic={10}
                fillTime={3250}
                minSpeed={400}
                snapSpeed={1900}
                sigma={50}
                shape="pill"
                color={plan.featured ? '#0B0B10' : '#F4F4F5'}
                textColor={plan.featured ? '#F4F4F5' : undefined}
                aria-label={plan.cta}
                onClick={scrollToContact}
              >
                {plan.cta}
              </LiquidButton>
            </div>
          </div>
        ))}
      </div>

      <p className="mono-label text-titanium/70 mt-12 text-center">
        Todos os planos incluem monitoramento de uptime, backups e relatório mensal.
      </p>
    </section>
  )
}
