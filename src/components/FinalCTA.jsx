import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONTACT } from '../data'
import Magnetic from './Magnetic'

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
      className="relative z-[3] min-h-[92dvh] flex flex-col items-center justify-center text-center px-5 py-32"
    >
      {/* scrim radial: garante leitura do título sobre a logo de partículas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(40rem,90vw)] h-[28rem] rounded-full"
        style={{ background: 'radial-gradient(ellipse at center, rgba(11,11,16,0.82) 0%, rgba(11,11,16,0.5) 45%, transparent 72%)' }}
      />
      <div className="cta-reveal relative flex items-center justify-center gap-4 mb-8">
        <span className="mono-label text-amber">[ SEC 08 ]</span>
        <span className="h-px w-12 bg-ivory/15" aria-hidden="true" />
        <span className="mono-label text-titanium/60">O próximo capítulo é o seu</span>
      </div>
      <h2 className="cta-reveal relative font-display font-semibold uppercase tracking-tightest leading-[0.98] text-[clamp(2.2rem,6.5vw,5.5rem)] text-ivory max-w-5xl">
        Pronto para evoluir de site para{' '}
        <span className="font-serif italic normal-case text-amber tracking-normal">organismo?</span>
      </h2>

      <div className="cta-reveal relative mt-14">
        <Magnetic strength={16}>
          <a
            href={CONTACT.whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mono-label inline-block rounded-full border-2 border-ivory text-ivory px-14 py-6 text-sm hover:bg-ivory hover:text-obsidian transition-colors duration-400"
          >
            Iniciar projeto
          </a>
        </Magnetic>
      </div>

      <div className="cta-reveal relative mt-16 flex flex-col sm:flex-row gap-4 sm:gap-10">
        <a href={`mailto:${CONTACT.email}`} className="font-mono text-sm text-titanium hover:text-ivory link-underline">
          {CONTACT.email}
        </a>
        <a
          href={CONTACT.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-titanium hover:text-ivory link-underline"
        >
          {CONTACT.whatsapp}
        </a>
      </div>
    </section>
  )
}
