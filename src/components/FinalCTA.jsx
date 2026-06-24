import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CONTACT } from '../data'
import Magnetic from './Magnetic'
import { useMotionTint } from '../useMotionTint'

gsap.registerPlugin(ScrollTrigger)

// feather (alpha) das bordas do vídeo → dissolve na grade de fundo tingida (--mt),
// sem aresta dura; ênfase no topo/base (eixo vertical mais aberto).
const FADE = 'radial-gradient(ellipse 84% 94% at 50% 50%, #000 46%, transparent 96%)'
const EDGE_FADE = { WebkitMaskImage: FADE, maskImage: FADE }

export default function FinalCTA({ reducedMotion }) {
  const rootRef = useRef(null)
  const videoRef = useRef(null)

  // o fundo da seção acompanha a cor média do vídeo (cromo → ouro → violeta)
  useMotionTint(videoRef, rootRef, { fallback: '200, 150, 92' })

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
      className="relative z-[3] flex flex-col items-center text-center px-5 py-32 overflow-hidden"
    >
      {/* GRADE DE FUNDO que ACOMPANHA a cor do vídeo (--mt): o vídeo dissolve
          (máscara) nesta grade tingida, então fundo e vídeo mudam de cor juntos.
          Base = obsidiana (identidade) + tinta do vídeo; topo/base fundem nas
          seções vizinhas com sombreamento. */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0" style={{ background: 'rgb(var(--mt))' }} />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-obsidian/[0.84]" />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: 'radial-gradient(ellipse 72% 62% at 50% 46%, rgba(var(--mt),0.26), transparent 70%)' }}
      />
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-obsidian via-transparent to-obsidian" />

      <div className="relative z-10 w-full max-w-5xl flex flex-col items-center">
        <div className="cta-reveal flex items-center justify-center gap-4 mb-8">
          <span className="mono-label text-amber">[ SEC 09 ]</span>
          <span className="h-px w-12 bg-ivory/15" aria-hidden="true" />
          <span className="mono-label text-titanium/60">O próximo capítulo é o seu</span>
        </div>

        <h2 className="cta-reveal font-display font-semibold uppercase tracking-tightest leading-[0.98] text-[clamp(2.2rem,6.5vw,5rem)] text-ivory max-w-4xl">
          Pronto para evoluir de site para{' '}
          <span className="font-serif italic normal-case text-amber tracking-normal">organismo?</span>
        </h2>

        {/* VÍDEO da Quimera — FULL-BLEED (largura da viewport), QHD, SEM moldura:
            a vinheta dissolve as bordas na obsidiana (sem retângulo genérico) e o
            entorno acompanha a cor do vídeo (--mt). reduced-motion → poster. */}
        <figure className="cta-reveal relative mt-10 md:mt-14 w-screen max-w-none">
          <div className="relative w-full aspect-[1600/874]">
            {reducedMotion ? (
              <img src="/video/chimera-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover" style={EDGE_FADE} />
            ) : (
              <video
                ref={videoRef}
                className="absolute inset-0 h-full w-full object-cover"
                style={EDGE_FADE}
                src="/video/chimera-loop.mp4"
                poster="/video/chimera-poster.jpg"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
            )}
          </div>
        </figure>

        <div className="cta-reveal mt-14">
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

        <div className="cta-reveal mt-12 flex flex-col sm:flex-row gap-4 sm:gap-10">
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
      </div>
    </section>
  )
}
