import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowRight, ArrowDown } from 'lucide-react'
import { TICKER_ITEMS } from '../data'
import Magnetic from './Magnetic'
import Scramble from './Scramble'

export default function Hero({ ready, reducedMotion }) {
  const rootRef = useRef(null)
  const [hideHint, setHideHint] = useState(false)

  // a dica de scroll some assim que o usuário começa a rolar
  useEffect(() => {
    const onScroll = () => setHideHint(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!ready || reducedMotion) return
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })
      tl.fromTo('.hero-line > span', { yPercent: 110 }, { yPercent: 0, duration: 1.1, stagger: 0.12 })
        .fromTo('.hero-sub', { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.5')
        .fromTo('.hero-cta', { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06 }, '-=0.4')
        .fromTo('.hero-ticker', { opacity: 0 }, { opacity: 1, duration: 0.8 }, '-=0.3')
    }, rootRef)
    return () => ctx.revert()
  }, [ready, reducedMotion])

  // ticker infinito: conteúdo duplicado, xPercent -50 em loop linear
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.to('.ticker-track', { xPercent: -50, duration: 28, ease: 'none', repeat: -1 })
    }, rootRef)
    return () => ctx.revert()
  }, [reducedMotion])

  const tickerContent = [...TICKER_ITEMS, ...TICKER_ITEMS]

  return (
    <section id="hero" ref={rootRef} className="relative min-h-[100dvh] flex flex-col z-[3]">
      <div className="flex-1 flex items-end px-5 md:px-10 pb-28 pt-32">
        <div className="max-w-[44rem]">
          <div className="flex items-center gap-4 mb-6 hero-sub">
            <span className="mono-label text-amber whitespace-nowrap">[ SEC 01 ]</span>
            <span className="h-px w-12 bg-ivory/15" aria-hidden="true" />
            <Scramble text="Estúdio de engenharia de presença digital" className="mono-label text-titanium/70" as="span" />
          </div>
          <h1 className="font-display font-semibold uppercase tracking-tightest leading-[0.95] text-[clamp(2.6rem,8vw,6.5rem)] text-ivory">
            <span className="mask-line hero-line"><span>Presença digital</span></span>
            <span className="mask-line hero-line"><span>é engenharia,</span></span>
            <span className="mask-line hero-line">
              <span className="font-serif italic normal-case text-amber tracking-normal">não acaso.</span>
            </span>
          </h1>
          <p className="hero-sub mt-8 text-titanium text-lg max-w-xl leading-relaxed">
            A Aethel Chimera projeta, constrói e mantém o ecossistema digital completo da sua
            empresa: site, tráfego, conteúdo e evolução contínua.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-5">
            <Magnetic className="hero-cta">
              <a
                href="#contato"
                className="mono-label inline-flex items-center gap-3 rounded-full bg-ivory text-obsidian px-8 py-4 hover:bg-amber transition-colors duration-300"
              >
                Iniciar projeto <ArrowRight size={14} aria-hidden="true" />
              </a>
            </Magnetic>
            <a
              href="#catalogo"
              className="hero-cta mono-label group inline-flex items-center gap-3 text-titanium hover:text-ivory transition-colors link-underline"
            >
              Ver catálogo
              <ArrowDown size={14} className="transition-transform duration-300 group-hover:translate-y-1" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* dica de interação: cue de scroll (intuitivo, some ao rolar) */}
      <div
        className="hero-cta pointer-events-none absolute left-1/2 -translate-x-1/2 bottom-24 flex flex-col items-center gap-3 transition-opacity duration-500"
        style={{ opacity: hideHint ? 0 : 1 }}
        aria-hidden="true"
      >
        <span className="mono-label text-titanium/70">role para explorar</span>
        <span className="scroll-cue" />
      </div>

      {/* ticker de serviços */}
      <div className="hero-ticker border-t border-ivory/10 py-4 overflow-hidden" aria-hidden="true">
        <div className="ticker-track flex w-max whitespace-nowrap">
          {tickerContent.map((item, i) => (
            <span key={i} className="mono-label text-titanium/70 flex items-center">
              <span className="px-6">{item}</span>
              <span className="text-amber">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
