import { Check } from 'lucide-react'
import { PLANS, waLink } from '../data'
import PixelButton from './PixelButton'
import SectionHead from './SectionHead'

// abre o WhatsApp já dizendo QUAL plano o cliente quer (mensagem contextual)
function openPlanWhatsApp(plan) {
  const msg = `Olá! Vim pelo site da Aethel Chimera e quero contratar o plano ${plan.name} (${plan.price}${plan.period}).`
  window.open(waLink(undefined, msg), '_blank', 'noopener,noreferrer')
}

export default function Plans() {
  return (
    <section id="planos" className="relative z-[3] px-page py-32">
      <div className="mb-16 max-w-2xl">
        <SectionHead index="08" kicker="Operação contínua" title="Manutenção" accent="mensal" className="mb-6" />
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
              <span className="absolute -top-3 left-8 z-10 mono-label text-[0.6rem] bg-amber text-obsidian rounded-lg px-4 py-1.5">
                {plan.badge}
              </span>
            )}
            {/* card COM overflow-hidden (a linha de luz do topo acompanha os
                cantos arredondados). O pb-28 reserva o espaço onde o botão fica. */}
            <div
              className={`card-wave overflow-hidden relative rounded-xl px-8 md:px-10 pt-8 md:pt-10 pb-36 h-full flex flex-col ${
                plan.featured
                  ? 'px-panel px-panel--light bg-ivory text-obsidian'
                  : 'px-panel bg-obsidian-deep text-ivory'
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

            {/* card claro (featured): botão escuro */}
            <div className="absolute inset-x-0 bottom-9 md:bottom-10 flex justify-center">
              <PixelButton
                variant={plan.featured ? 'dark' : 'light'}
                aria-label={plan.cta}
                onClick={() => openPlanWhatsApp(plan)}
              >
                {plan.cta}
              </PixelButton>
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
