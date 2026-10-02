import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { blip } from '../audio'

// Card de um case do catálogo. Entra na tela com a coreografia do antigo
// overlay (voo da profundidade, rack-focus, rastro RGB, micro-pop, varredura,
// ignição da borda e decode do texto), agora disparada pelo scroll.
const ENTER_DUR = 0.62
const STAGGER = 0.14 // atraso entre um card e o próximo na mesma leva
const DEPTH_Z = -820
const TURN_DEG = -16
const START_BLUR = 11
const RGB_SPLIT = 7
const DECODE_MS = 620
const AMETHYST_FLASH = true
const AMETHYST = '154, 123, 216' // violeta oficial do manual (#9A7BD8)

const GLYPHS = '日Æ01<>/{}#*-+=•▒░█ΛΞΣΦΨ'

function DecodeText({ text, trigger, className = '', as: Tag = 'span', duration = DECODE_MS }) {
  const [disp, setDisp] = useState(text)
  useEffect(() => {
    if (!trigger || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisp(text)
      return
    }
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min((now - start) / duration, 1)
      const reveal = Math.floor(p * text.length)
      let out = ''
      for (let i = 0; i < text.length; i++) {
        if (text[i] === ' ') out += ' '
        else if (i < reveal) out += text[i]
        else out += GLYPHS[(Math.random() * GLYPHS.length) | 0]
      }
      setDisp(out)
      if (p < 1) raf = requestAnimationFrame(tick)
      else setDisp(text)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [trigger, text, duration])
  return (
    <Tag className={className}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{disp}</span>
    </Tag>
  )
}

const LINK_CLASS = 'mono-label !text-[0.55rem] text-titanium hover:text-amber transition-colors'

function ExternalLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className={LINK_CLASS}>
      {children} ↗
    </a>
  )
}

export default function CatalogCard({ project, index, order, reducedMotion, onOpen }) {
  const [decodeKey, setDecodeKey] = useState(0)

  const cardRef = useRef(null)
  const bloomRef = useRef(null)
  const sweepRef = useRef(null)
  const ringRef = useRef(null)

  useEffect(() => {
    const card = cardRef.current
    if (!card || reducedMotion) return

    const setFx = (blurPx, splitPx) => {
      card.style.filter =
        `blur(${blurPx.toFixed(2)}px)` +
        ` drop-shadow(${splitPx.toFixed(2)}px 0 0 rgba(255,0,51,.5))` +
        ` drop-shadow(${(-splitPx).toFixed(2)}px 0 0 rgba(0,255,230,.5))`
    }

    gsap.set(card, { autoAlpha: 0 })

    let tl
    const playEnter = () => {
      const fx = { blur: START_BLUR, split: RGB_SPLIT }
      setFx(fx.blur, fx.split)

      tl = gsap.timeline({
        delay: order * STAGGER,
        onStart: () => setDecodeKey((k) => k + 1),
        // o filtro sai no fim: drop-shadow parado deixa o hover mais pesado
        onComplete: () => { card.style.filter = '' },
      })
      tl.set(card, { transformPerspective: 1200, z: DEPTH_Z, rotateY: TURN_DEG, xPercent: -34, yPercent: 12, scale: 1 })
      tl.to(card, { duration: ENTER_DUR, z: 0, rotateY: 0, xPercent: 0, yPercent: 0, autoAlpha: 1, ease: 'power3.out' }, 0)
      tl.to(fx, { duration: ENTER_DUR, blur: 0, split: 0, ease: 'power3.out', onUpdate: () => setFx(fx.blur, fx.split) }, 0)
      tl.to(card, { duration: 0.1, scale: 1.025, ease: 'power2.out' }, ENTER_DUR - 0.05)
      tl.to(card, { duration: 0.16, scale: 1, ease: 'power2.inOut' }, '>')

      if (AMETHYST_FLASH && bloomRef.current) {
        tl.fromTo(bloomRef.current, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 0.9, scale: 1.05, duration: 0.16, ease: 'power2.out' }, 0)
        tl.to(bloomRef.current, { autoAlpha: 0, scale: 1.55, duration: 0.55, ease: 'power2.in' }, 0.16)
      }
      if (sweepRef.current) {
        tl.fromTo(sweepRef.current, { autoAlpha: 0.9, yPercent: -120 }, { yPercent: 260, duration: 0.5, ease: 'power1.in' }, ENTER_DUR * 0.5)
        tl.to(sweepRef.current, { autoAlpha: 0, duration: 0.12 }, '>-0.08')
      }
      if (ringRef.current) {
        tl.fromTo(ringRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, ENTER_DUR * 0.7)
        tl.to(ringRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '>')
      }
      tl.add(() => blip(170, 0.05, 'triangle'), ENTER_DUR * 0.6)
      tl.add(() => blip(320, 0.03, 'sine'), ENTER_DUR * 0.6 + 0.05)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return
        io.disconnect()
        playEnter()
      },
      { threshold: 0.2 }
    )
    io.observe(card)

    return () => {
      io.disconnect()
      tl?.kill()
    }
  }, [order, reducedMotion])

  const open = () => onOpen?.(index)

  return (
    <div className="relative [perspective:1200px]">
      {AMETHYST_FLASH && (
        <div
          ref={bloomRef}
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[35%] -z-10 rounded-full"
          style={{
            opacity: 0,
            background: `radial-gradient(closest-side, rgba(${AMETHYST},0.55), rgba(${AMETHYST},0.12) 55%, transparent 76%)`,
          }}
        />
      )}

      <article
        ref={cardRef}
        onClick={open}
        onKeyDown={(e) => {
          if (e.target !== e.currentTarget) return
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            open()
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={`Abrir case ${project.name}`}
        style={{ transformStyle: 'preserve-3d' }}
        className="h-full cursor-pointer rounded-xl focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-amber"
      >
        <div className="at-panel card-wave catalog-card relative flex h-full flex-col overflow-hidden rounded-xl">
          <span className="panel-scanlines" aria-hidden="true" />

          <span
            ref={ringRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-[3] rounded-xl"
            style={{ opacity: 0, boxShadow: 'inset 0 0 0 1px rgba(200,202,208,.9), 0 0 30px rgba(200,202,208,.35)' }}
          />
          <span
            ref={sweepRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-1/3"
            style={{
              opacity: 0,
              background: 'linear-gradient(to bottom, transparent, rgba(200,202,208,.16) 60%, rgba(200,202,208,.5))',
            }}
          />

          {/* placas 1280x800: a caixa segue a mesma proporção para a logo não ser cortada */}
          <div className="panel-media relative w-full aspect-[16/10] overflow-hidden bg-gradient-to-b from-ivory to-[#E8E6DE]">
            <img
              src={project.logo || project.image}
              alt={`Logo ${project.name}`}
              className="absolute inset-0 h-full w-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="flex flex-1 flex-col p-5 md:p-6">
            <p className="mono-label !text-[0.6rem] text-titanium/70 md:!text-[0.68rem]">
              {project.segment}
              {project.city ? ` · ${project.city}` : ''} · {project.year}
            </p>
            <DecodeText
              text={project.name}
              trigger={decodeKey}
              as="h3"
              className="font-display font-semibold text-xl md:text-2xl text-ivory mt-1 mb-4 block"
            />
            <ul className="space-y-2 mb-4">
              {project.metrics.map((m) => (
                <li key={m} className="font-mono text-xs text-amber flex items-center gap-2">
                  <span className="text-amber/50">+</span>
                  <DecodeText text={m} trigger={decodeKey} />
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-2">
              {project.tags.map((tg) => (
                <span key={tg} className="mono-label !text-[0.55rem] border border-ivory/15 rounded-lg px-3 py-1.5 text-titanium">
                  {tg}
                </span>
              ))}
            </div>

            {(project.instagram || project.tiktok || project.site || project.whatsapp) && (
              <div className="mt-auto pt-5">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ivory/10 pt-4">
                  {project.instagram && <ExternalLink href={project.instagram}>Instagram</ExternalLink>}
                  {project.instagramAlt && (
                    <ExternalLink href={project.instagramAlt}>{project.instagramAltLabel || 'Instagram 2'}</ExternalLink>
                  )}
                  {project.tiktok && <ExternalLink href={project.tiktok}>TikTok</ExternalLink>}
                  {project.site && <ExternalLink href={project.site}>Site</ExternalLink>}
                  {project.whatsapp && <ExternalLink href={project.whatsapp}>WhatsApp</ExternalLink>}
                </div>
              </div>
            )}
          </div>
        </div>
      </article>
    </div>
  )
}
