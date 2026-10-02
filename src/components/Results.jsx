import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { STATS, TESTIMONIALS } from '../data'
import SectionHead from './SectionHead'

gsap.registerPlugin(ScrollTrigger)

function Counter({ stat, reducedMotion }) {
  const ref = useRef(null)

  useEffect(() => {
    if (reducedMotion) return
    const el = ref.current
    const obj = { val: 0 }
    const decimals = stat.decimals || 0
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: stat.value,
        duration: 2,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%' },
        onUpdate: () => {
          el.textContent = obj.val.toFixed(decimals).replace('.', ',') + stat.suffix
        },
      })
    })
    return () => ctx.revert()
  }, [stat, reducedMotion])

  return (
    <span ref={ref} className="font-display font-semibold text-[clamp(3rem,7vw,5.5rem)] text-ivory leading-none tabular-nums">
      {reducedMotion ? String(stat.value).replace('.', ',') + stat.suffix : '0' + stat.suffix}
    </span>
  )
}

// Carrossel arrastável com inércia: velocidade registrada no pointermove,
// decaimento aplicado após o pointerup. Sem setas.
// degradê igual nos dois lados, do tamanho da margem lateral da seção (--fade)
const EDGE_FADE = 'linear-gradient(to right, transparent 0, #000 var(--fade), #000 calc(100% - var(--fade)), transparent 100%)'

function TestimonialCarousel() {
  const trackRef = useRef(null)

  useEffect(() => {
    const track = trackRef.current
    if (!track) return

    let isDown = false
    let startX = 0
    let scrollStart = 0
    let velocity = 0
    let lastX = 0
    let raf

    const maxScroll = () => track.scrollWidth - track.clientWidth

    const pos = { x: 0 }
    const apply = () => {
      pos.x = Math.max(0, Math.min(maxScroll(), pos.x))
      track.style.transform = `translateX(${-pos.x}px)`
    }

    const onDown = (e) => {
      isDown = true
      startX = e.clientX
      scrollStart = pos.x
      lastX = e.clientX
      velocity = 0
      cancelAnimationFrame(raf)
    }
    const onMove = (e) => {
      if (!isDown) return
      velocity = lastX - e.clientX
      lastX = e.clientX
      pos.x = scrollStart + (startX - e.clientX)
      apply()
    }
    const inertia = () => {
      velocity *= 0.94
      pos.x += velocity
      apply()
      if (Math.abs(velocity) > 0.3) raf = requestAnimationFrame(inertia)
    }
    const onUp = () => {
      if (!isDown) return
      isDown = false
      raf = requestAnimationFrame(inertia)
    }

    const parent = track.parentElement
    parent.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => {
      cancelAnimationFrame(raf)
      parent.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    }
  }, [])

  return (
    // a faixa ocupa também a margem da seção (-mx) e o degradê fica só nela:
    // parado, o primeiro card começa alinhado ao título e sem corte
    <div
      className="-mx-5 md:-mx-10 [--fade:20px] md:[--fade:40px] overflow-hidden select-none touch-pan-y"
      data-cursor="ARRASTE"
      style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE }}
    >
      <div ref={trackRef} className="flex gap-6 px-5 md:px-10 will-change-transform">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.slug}
            className="shrink-0 w-[85vw] md:w-[34rem] px-panel relative bg-obsidian-deep rounded-xl p-8 md:p-12 flex flex-col"
          >
            {/* Com depoimento colhido, o card vira citação. Sem, mostra o que
                foi ENTREGUE - nada de frase inventada em nome de cliente real. */}
            {t.quote ? (
              <blockquote className="font-serif italic text-xl md:text-2xl text-ivory leading-relaxed mb-8">
                “{t.quote}”
              </blockquote>
            ) : (
              <div className="mb-8 flex-1">
                <p className="mono-label text-amber mb-4">O que entregamos</p>
                <ul className="space-y-2.5">
                  {t.delivered.map((d) => (
                    <li key={d} className="flex gap-2.5 text-ivory text-base md:text-lg leading-snug">
                      <span className="text-amber mt-1 shrink-0" aria-hidden="true">+</span>
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <figcaption className="flex items-end justify-between gap-6 border-t border-ivory/10 pt-6">
              <div className="min-w-0">
                {t.quote && <p className="mono-label text-ivory">{t.person}</p>}
                <p className="mono-label text-ivory truncate">{t.company}</p>
                <p className="mono-label text-titanium/60 mt-1 truncate">
                  {t.quote ? `${t.role} - ${t.segment}` : `${t.segment} · ${t.city}`}
                </p>
              </div>
              {t.logo && (
                <img
                  src={t.logo}
                  alt=""
                  loading="lazy"
                  className="h-12 w-20 object-cover rounded-lg border border-ivory/10 shrink-0"
                />
              )}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export default function Results({ reducedMotion }) {
  return (
    <section id="resultados" className="relative z-[3] px-page py-32">
      <SectionHead index="07" kicker="Prova" title="Resultados" accent="medidos" className="mb-20" />

      {/* faixa de números */}
      <div className="grid md:grid-cols-3 gap-12 border-y border-ivory/10 py-16 mb-24">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <Counter stat={stat} reducedMotion={reducedMotion} />
            <p className="mono-label text-titanium/70 mt-4">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="mono-label text-titanium/60 mb-8">Clientes que a Aethel construiu - arraste</p>
      <TestimonialCarousel />
    </section>
  )
}
