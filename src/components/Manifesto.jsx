import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const TEXT =
  'A maioria das empresas trata o site como despesa estática. Nós tratamos como ativo vivo: medido, mantido e evoluído todos os meses. Da primeira visita ao tráfego que converte, da arquitetura à manutenção, um único organismo.'

// palavras que acendem em âmbar
const KEYWORDS = new Set(['ativo', 'vivo:', 'organismo.'])

export default function Manifesto({ reducedMotion }) {
  const rootRef = useRef(null)

  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      const words = rootRef.current.querySelectorAll('.manifesto-word')
      gsap.to(words, {
        opacity: 1,
        ease: 'none',
        stagger: 0.06,
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.6,
        },
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reducedMotion])

  return (
    <section id="manifesto" ref={rootRef} className="relative z-[3] min-h-[100dvh] flex items-center px-5 md:px-10">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-10">
          <span className="mono-label text-amber">[ SEC 02 ]</span>
          <span className="h-px w-12 md:w-24 bg-ivory/15" aria-hidden="true" />
          <span className="mono-label text-titanium/60">Manifesto</span>
        </div>
        <p className="font-display font-medium text-[clamp(1.6rem,4vw,3.2rem)] leading-snug text-ivory">
          {TEXT.split(' ').map((word, i) => (
            <span
              key={i}
              className={`manifesto-word inline-block mr-[0.32em] ${
                KEYWORDS.has(word) ? 'text-amber font-serif italic' : ''
              }`}
              style={{ opacity: reducedMotion ? 1 : 0.6 }}
            >
              {word}
            </span>
          ))}
        </p>
      </div>
    </section>
  )
}
