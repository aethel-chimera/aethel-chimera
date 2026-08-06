import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONTACT, waLink } from '../data'
import LiquidButton from './LiquidButton'

gsap.registerPlugin(ScrollTrigger)

export default function FinalCTA({ reducedMotion }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.cta-reveal',
        { opacity: 0, y: 50 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          stagger: 0.12,
          ease: 'power3.out',
          scrollTrigger: { trigger: rootRef.current, start: 'top 65%' },
        }
      )
    }, rootRef)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section
      id="contato"
      ref={rootRef}
      className="relative z-[3] flex flex-col items-center text-center px-5 py-32"
    >
      <div className="relative z-10 w-full max-w-3xl flex flex-col items-center">
        <div className="cta-reveal flex items-center justify-center gap-4 mb-8">
          <span className="mono-label text-amber">[ SEC 10 ]</span>
          <span className="h-px w-12 bg-ivory/15" aria-hidden="true" />
          <span className="mono-label text-titanium/60">O próximo capítulo é o seu</span>
        </div>

        <h2 className="cta-reveal font-display font-semibold uppercase tracking-tightest leading-[0.98] text-[clamp(2.2rem,6.5vw,5rem)] text-ivory">
          Pronto para evoluir de site para{' '}
          <span className="font-serif italic normal-case text-amber tracking-normal">organismo?</span>
        </h2>

        {/* O LiquidButton usa mix-blend-mode no texto, que quebra sob um
            ancestral com transform/opacity — por isso fica fora do Magnetic e
            da animação .cta-reveal. reduced-motion cai no link simples. */}
        <div className="mt-14">
          {reducedMotion ? (
            <a
              href={CONTACT.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mono-label inline-block rounded-full border-2 border-ivory text-ivory px-14 py-6 text-sm hover:bg-ivory hover:text-obsidian transition-colors duration-400"
            >
              Iniciar projeto
            </a>
          ) : (
            <LiquidButton
              viscosity={10}
              approach={160}
              deform={10}
              bounce={7}
              organic={10}
              fillTime={3250}
              minSpeed={400}
              snapSpeed={1900}
              shape="pill"
              color="#F4F2EC"
              aria-label="Iniciar projeto pelo WhatsApp"
              onClick={() => window.open(CONTACT.whatsappUrl, '_blank', 'noopener,noreferrer')}
            >
              Iniciar projeto
            </LiquidButton>
          )}
        </div>

        {/* canais oficiais — todos com link funcional (wa.me / mailto / instagram) */}
        <div className="cta-reveal mt-12 flex flex-wrap justify-center gap-x-8 gap-y-4">
          {CONTACT.phones.map((p) => (
            <a
              key={p.e164}
              href={waLink(p.e164)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-sm text-titanium hover:text-amber transition-colors link-underline"
            >
              WhatsApp {p.label}
            </a>
          ))}
          <a href={CONTACT.emailUrl} className="font-mono text-sm text-titanium hover:text-amber transition-colors link-underline">
            {CONTACT.email}
          </a>
          <a
            href={CONTACT.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm text-titanium hover:text-amber transition-colors link-underline"
          >
            {CONTACT.instagram}
          </a>
        </div>
      </div>
    </section>
  )
}
