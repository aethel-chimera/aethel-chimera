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
    <div className="overflow-hidden select-none touch-pan-y" data-cursor="ARRASTE">
      <div ref={trackRef} className="flex gap-6 will-change-transform">
        {TESTIMONIALS.map((t) => (
          <figure
            key={t.name}
            className="shrink-0 w-[85vw] md:w-[34rem] bg-obsidian-deep border border-ivory/10 rounded-2xl p-8 md:p-12"
          >
            <blockquote className="font-serif italic text-xl md:text-2xl text-ivory leading-relaxed mb-8">
              “{t.quote}”
            </blockquote>
            <figcaption className="flex items-end justify-between gap-6">
              <div>
                <p className="mono-label text-ivory">{t.name}</p>
                <p className="mono-label text-titanium/60 mt-1">
                  {t.role} — {t.company}
                </p>
              </div>
              {/* avaliação como barra preenchida, não estrelas */}
              <div className="w-24">
                <div className="h-px bg-ivory/15">
                  <div className="h-full bg-amber" style={{ width: `${t.rating * 100}%` }} />
                </div>
                <p className="font-mono text-[0.6rem] text-titanium/60 mt-2 text-right">
                  {(t.rating * 5).toFixed(1).replace('.', ',')} / 5,0
                </p>
              </div>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

export default function Results({ reducedMotion }) {
  return (
    <section id="resultados" className="relative z-[3] px-5 md:px-10 py-32">
      <SectionHead index="06" kicker="Prova" title="Resultados" accent="medidos" className="mb-20" />

      {/* faixa de números */}
      <div className="grid md:grid-cols-3 gap-12 border-y border-ivory/10 py-16 mb-24">
        {STATS.map((stat) => (
          <div key={stat.label}>
            <Counter stat={stat} reducedMotion={reducedMotion} />
            <p className="mono-label text-titanium/70 mt-4">{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="mono-label text-titanium/60 mb-8">O que as afiliadas dizem — arraste</p>
      <TestimonialCarousel />
    </section>
  )
}
