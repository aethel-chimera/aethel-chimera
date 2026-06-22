import { Check } from 'lucide-react'
import { PLANS } from '../data'
import Magnetic from './Magnetic'
import SectionHead from './SectionHead'

export default function Plans() {
  return (
    <section id="planos" className="relative z-[3] px-5 md:px-10 py-32">
      <div className="mb-16 max-w-2xl">
        <SectionHead index="07" kicker="Operação contínua" title="Manutenção" accent="mensal" className="mb-6" />
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
            <div
              className={`card-wave overflow-hidden relative rounded-2xl p-8 md:p-10 h-full flex flex-col ${
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
              <ul className="mt-8 mb-10 space-y-3 flex-1">
                {plan.items.map((item) => (
                  <li key={item} className={`flex gap-3 text-sm leading-relaxed ${plan.featured ? 'text-obsidian/80' : 'text-titanium'}`}>
                    <Check size={16} className={`shrink-0 mt-0.5 ${plan.featured ? 'text-obsidian' : 'text-amber'}`} aria-hidden="true" />
                    {item}
                  </li>
                ))}
              </ul>
              <Magnetic className="w-full">
                <a
                  href="#contato"
                  className={`mono-label block text-center rounded-full px-6 py-4 transition-colors duration-300 ${
                    plan.featured
                      ? 'bg-obsidian text-ivory hover:bg-amber hover:text-obsidian'
                      : 'border border-ivory/25 text-ivory hover:bg-ivory hover:text-obsidian'
                  }`}
                >
                  {plan.cta}
                </a>
              </Magnetic>
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
