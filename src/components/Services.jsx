import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { Plus } from 'lucide-react'
import { SERVICES } from '../data'
import SectionHead from './SectionHead'

gsap.registerPlugin(ScrollTrigger)

// cor premium distinta por serviço (tons joia/metálico, coesos com a marca)
const SERVICE_ACCENTS = ['#D6D6DA', '#C2C2C6', '#A6AAAE', '#A2A2AA', '#B2AEAC', '#C6C2C0']

// suavização do preview seguindo o cursor: menor = mais delay/lag (segue mais atrasado)
const PREVIEW_FOLLOW = 0.045

export default function Services({ reducedMotion }) {
  const rootRef = useRef(null)
  const previewRef = useRef(null)
  const [openId, setOpenId] = useState(null)
  const [hoverImage, setHoverImage] = useState(null)

  // entrada das linhas
  useEffect(() => {
    if (reducedMotion) return
    const ctx = gsap.context(() => {
      gsap.utils.toArray('.service-row').forEach((row) => {
        gsap.fromTo(
          row,
          { opacity: 0, y: 40 },
          {
            opacity: 1,
            y: 0,
            duration: 0.9,
            ease: 'power3.out',
            scrollTrigger: { trigger: row, start: 'top 88%' },
          }
        )
      })
    }, rootRef)
    return () => ctx.revert()
  }, [reducedMotion])

  // preview flutuante seguindo o cursor com lerp
  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return
    const pos = { x: 0, y: 0 }
    const cur = { x: 0, y: 0 }
    let raf
    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
    }
    const tick = () => {
      cur.x += (pos.x - cur.x) * PREVIEW_FOLLOW
      cur.y += (pos.y - cur.y) * PREVIEW_FOLLOW
      if (previewRef.current) {
        // preview ao lado direito do cursor, centralizado na vertical (altura 160 -> -80)
        previewRef.current.style.transform = `translate(${cur.x + 24}px, ${cur.y - 80}px)`
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('mousemove', onMove)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
    }
  }, [reducedMotion])

  return (
    <section id="servicos" ref={rootRef} className="relative z-[3] px-5 md:px-10 py-32">
      <SectionHead index="03" kicker="07 disciplinas" title="Serviços" accent="como dossiês" className="mb-16" />

      <ul>
        {SERVICES.map((s, i) => {
          const isOpen = openId === s.id
          return (
            <li
              key={s.id}
              className="service-row card-wave relative border-t border-ivory/10 last:border-b"
              style={{ '--accent': SERVICE_ACCENTS[i % SERVICE_ACCENTS.length] }}
            >
              <button
                className="w-full flex items-center gap-6 py-7 text-left group"
                onClick={() => setOpenId(isOpen ? null : s.id)}
                onMouseEnter={() => setHoverImage(s.image)}
                onMouseLeave={() => setHoverImage(null)}
                aria-expanded={isOpen}
              >
                <span className="service-num font-mono text-sm w-8 shrink-0">{s.id}</span>
                <span className="service-title font-display font-medium text-[clamp(1.3rem,3.2vw,2.4rem)] text-ivory flex-1">
                  {s.title}
                </span>
                <span className="service-cat mono-label text-titanium/60 hidden sm:block">{s.category}</span>
                <Plus
                  size={20}
                  className={`text-titanium transition-transform duration-500 ${isOpen ? 'rotate-45' : ''}`}
                  aria-hidden="true"
                />
              </button>

              <div
                className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.65,0,0.35,1)]"
                style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
              >
                <div className="overflow-hidden">
                  <div className="pb-10 pl-14 grid md:grid-cols-3 gap-8 max-w-5xl">
                    <p className="text-titanium leading-relaxed md:col-span-1">{s.description}</p>
                    <div>
                      <p className="mono-label text-amber mb-3">Entregáveis</p>
                      <ul className="space-y-2">
                        {s.deliverables.map((d) => (
                          <li key={d} className="text-sm text-titanium flex gap-2">
                            <span className="text-amber" aria-hidden="true">—</span> {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="mono-label text-amber mb-3">Integrações típicas</p>
                      <div className="flex flex-wrap gap-2">
                        {s.integrations.map((tag) => (
                          <span key={tag} className="mono-label text-[0.6rem] border border-ivory/15 rounded-full px-3 py-1.5 text-titanium">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* preview flutuante (desktop) */}
      <div
        ref={previewRef}
        aria-hidden="true"
        style={{
          boxShadow:
            '0 50px 100px -20px rgba(0, 0, 0, 0.95), 0 25px 55px -25px rgba(0, 0, 0, 0.9), 0 0 70px -5px rgba(0, 0, 0, 0.85)',
        }}
        className={`fixed top-0 left-0 z-[80] w-64 h-40 rounded-lg overflow-hidden pointer-events-none transition-opacity duration-300 hidden md:block ${
          hoverImage ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {hoverImage && <img src={hoverImage} alt="" className="w-full h-full object-cover" loading="lazy" />}
      </div>
    </section>
  )
}
