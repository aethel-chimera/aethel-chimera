import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ArrowDown } from 'lucide-react'
import { TICKER_ITEMS } from '../data'
import LiquidButton from './LiquidButton'
import Scramble from './Scramble'

// tríptico do hero: 3 vídeos retrato lado a lado, como uma tela única.
const HERO_VIDEOS = [
  { src: '/video/leao-cyber.mp4', poster: '/video/leao-cyber-poster.jpg', alt: 'Leão cibernético' },
  { src: '/video/mid-hero.mp4', poster: '/video/mid-hero-poster.jpg', alt: 'Quimera central' },
  { src: '/video/mulher-cyber.mp4', poster: '/video/mulher-cyber-poster.jpg', alt: 'Mulher cibernética', flip: true },
]

// largura da zona de cross-fade sobre cada costura, em % da largura da tela.
// 0 = sem sobreposição (vídeos encostados lado a lado, cada um no seu terço).
const HERO_BLEND = 4

// Layout de cada painel do tríptico. Em vez de 3 vídeos encostados (que deixam
// uma linha de corte dura na emenda), cada vídeo estende além do seu terço e
// invade a costura. O painel da direita de cada costura entra POR CIMA com
// fade-in, enquanto o da esquerda continua opaco POR BAIXO: cross-fade sem
// faixa escura no meio (a cobertura total permanece 100% em toda a largura).
function heroPanelLayout(i, count) {
  const slot = 100 / count
  const left = i === 0 ? 0 : i * slot - HERO_BLEND / 2
  const right = i === count - 1 ? 100 : (i + 1) * slot + HERO_BLEND / 2
  const width = right - left
  return {
    left,
    width,
    fade: (HERO_BLEND / width) * 100, // largura do fade em % do próprio painel
    hasFade: i > 0, // o primeiro fica totalmente opaco; os demais entram por cima
  }
}

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
      {/* TRÍPTICO: 3 vídeos retrato lado a lado (leão · meio · mulher) compondo
          uma tela única, em loop. reduced-motion → posters. Scrims garantem a
          leitura do texto sobre os vídeos. */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden="true">
        <div className="absolute inset-0">
          {HERO_VIDEOS.map((v, i) => {
            const { left, width, fade, hasFade } = heroPanelLayout(i, HERO_VIDEOS.length)
            // o gradiente é espelhado junto com o vídeo no flip (scaleX), então
            // invertemos a direção (to left) para o fade cair sempre na costura.
            const dir = v.flip ? 'to left' : 'to right'
            const maskImage = hasFade
              ? `linear-gradient(${dir}, transparent 0%, #000 ${fade.toFixed(2)}%, #000 100%)`
              : undefined
            const style = {
              left: `${left}%`,
              width: `${width}%`,
              transform: v.flip ? 'scaleX(-1)' : undefined,
              WebkitMaskImage: maskImage,
              maskImage,
            }
            return reducedMotion ? (
              <img key={v.src} src={v.poster} alt="" style={style} className="absolute top-0 h-full object-cover" />
            ) : (
              <video
                key={v.src}
                style={style}
                className="absolute top-0 h-full object-cover"
                src={v.src}
                poster={v.poster}
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
              />
            )
          })}
        </div>
        {/* base escurece (texto/CTA/ticker) e topo livre (rostos visíveis) */}
        <div className="absolute inset-0 bg-gradient-to-t from-obsidian via-obsidian/55 to-obsidian/15" />
        {/* leve reforço à esquerda p/ o título */}
        <div className="absolute inset-0 bg-gradient-to-r from-obsidian/70 via-transparent to-transparent" />
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
            {/* CTA líquido. Fora do Magnetic e sem a classe hero-cta porque
                ambos aplicam transform, que quebra o mix-blend do texto. A
                margem esquerda negativa compensa a folga do canvas, alinhando
                o pill com o título à esquerda. */}
            <LiquidButton
              width={200}
              height={52}
              pad={40}
              fontSize={13}
              viscosity={4}
              approach={80}
              deform={2}
              bounce={4}
              organic={10}
              fillTime={3250}
              minSpeed={400}
              snapSpeed={1900}
              sigma={50}
              shape="pill"
              color="#F4F4F5"
              aria-label="Iniciar projeto"
              onClick={scrollToContact}
              style={{ marginLeft: -40 }}
            >
              Iniciar projeto
            </LiquidButton>
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

      {/* dica de interação: cue de scroll (só desktop — no mobile colide com os CTAs) */}
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
