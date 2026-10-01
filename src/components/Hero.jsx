import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowDown } from 'lucide-react'
import { TICKER_ITEMS } from '../data'
import PillButton from './PillButton'
import Scramble from './Scramble'
import HalftoneBackground from './HalftoneBackground'

const HERO_FADE = 'linear-gradient(to bottom, #000 25%, rgba(0,0,0,0.55) 62%, transparent 100%)'

// rola até o contato respeitando o smooth scroll (Lenis), com fallback nativo
function scrollToContact() {
  const el = document.querySelector('#contato')
  if (!el) return
  if (window.__lenis) window.__lenis.scrollTo(el, { offset: -64 })
  else el.scrollIntoView({ behavior: 'smooth' })
}

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
    <section id="hero" ref={rootRef} className="relative min-h-[100dvh] flex flex-col z-[3] overflow-hidden">
      {/* sem fundo próprio e com máscara na base: o efeito some aos poucos e
          a página segue sem emenda para a próxima seção */}
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
        style={{ maskImage: HERO_FADE, WebkitMaskImage: HERO_FADE }}
        aria-hidden="true"
      >
        <HalftoneBackground reducedMotion={reducedMotion} />
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/60 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 flex-1 flex items-end px-5 md:px-10 pb-28 pt-32">
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
            <PillButton width={200} height={52} fontSize={13} aria-label="Iniciar projeto" onClick={scrollToContact}>
              Iniciar projeto
            </PillButton>
            <a
              href="#catalogo"
              className="hero-cta mono-label group inline-flex items-center gap-3 pb-1 text-titanium hover:text-ivory transition-colors link-underline"
            >
              Ver catálogo
              <ArrowDown size={14} className="transition-transform duration-300 group-hover:translate-y-0.5" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      {/* dica de interação: cue de scroll (só desktop - no mobile colide com os CTAs) */}
      <div
        className="hero-cta pointer-events-none absolute z-10 left-1/2 -translate-x-1/2 bottom-24 hidden md:flex flex-col items-center gap-3 transition-opacity duration-500"
        style={{ opacity: hideHint ? 0 : 1 }}
        aria-hidden="true"
      >
        <span className="mono-label text-titanium/70">role para explorar</span>
        <span className="scroll-cue" />
      </div>

      {/* ticker de serviços */}
      <div className="hero-ticker relative z-10 border-t border-ivory/10 py-4 overflow-hidden" aria-hidden="true">
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
