import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { CATALOG } from '../data'
import { blip } from '../audio'

// ---------------------------------------------------------------------------
// Card do "catálogo vivo" sobreposto ao vídeo da cena 3D (espadachim + Lune
// Améthyste). O card é ARREMESSADO junto com o golpe: vem LÁ DO FUNDO (perto do
// personagem) e voa pra frente/lado direito, nascendo no instante do pulso de
// energia (LAUNCH_T) e saindo perto do fim do loop (EXIT_T), trocando de
// projeto a cada volta do vídeo.
//
// Coreografia (timeline GSAP) — efeitos escolhidos por casarem com a estética
// da página (HUD/engenharia, monocromático, glitch/RGB-split, decode):
//   • profundidade real (translateZ) + rack-focus (blur->nítido)
//   • giro sutil pra câmera (rotateY) + assentamento mecânico seco (micro-pop)
//   • rastro em RGB SPLIT (aberração cromática que converge) — mesma língua do
//     glitch dos CTAs, não um motion-blur genérico
//   • DECODE do texto (nome + métricas) ao pousar — assinatura da marca
//   • power-on de scanline + ignição da borda
//   • flash AMETISTA no lançamento (único respiro de cor; atrás de uma flag)
//   • saída em GLITCH-OUT (ruído de TV + RGB split dispersando)
//   • blip curto no impacto (silencioso até o usuário ligar o som)
//
// AJUSTE FINO — tudo editável aqui em cima (tempos em s, clipe ~7s):
const LAUNCH_T = 3.3 // a lâmina dispara o pulso -> o card é lançado
const EXIT_T = 6.6 // perto do fim do loop -> o card sai
const ENTER_DUR = 0.62 // duração do voo de entrada
const EXIT_DUR = 0.42 // duração da saída (glitch-out)
const DEPTH_Z = -820 // quão "no fundo" o card começa (px de translateZ)
const TURN_DEG = -16 // rotateY inicial (giro pra câmera)
const START_BLUR = 11 // desfoque inicial do rack-focus (px)
const RGB_SPLIT = 7 // separação inicial do rastro RGB (px)
const DECODE_MS = 620 // duração do decode do texto
const AMETHYST_FLASH = true // FLAG: respiro de cor ametista no lançamento (false = 100% monocromático)
const AMETHYST = '139, 92, 246' // rgb do flash (a Lune Améthyste)
// ---------------------------------------------------------------------------

const GLYPHS = '日Æ01<>/{}#*-+=•▒░█ΛΞΣΦΨ'

// Texto que "decifra" a cada launch (trigger muda -> re-roda). Versão
// re-disparável do <Scramble>, que só toca uma vez por viewport.
function DecodeText({ text, trigger, className = '', as: Tag = 'span', duration = DECODE_MS }) {
  const [disp, setDisp] = useState(text)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
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

export default function CatalogCardOverlay({ videoRef, onOpenProject }) {
  const [index, setIndex] = useState(0)
  const [launchKey, setLaunchKey] = useState(0)
  const [active, setActive] = useState(false) // interativo só enquanto visível

  const cardRef = useRef(null)
  const bloomRef = useRef(null)
  const sweepRef = useRef(null)
  const ringRef = useRef(null)
  const noiseRef = useRef(null)
  const lastT = useRef(0)
  const phase = useRef('idle') // idle | in | out
  const tlRef = useRef(null)
  const reduced = useRef(false)

  // compõe blur + aberração cromática (rastro RGB) num único filter
  const setFx = (blurPx, splitPx) => {
    const c = cardRef.current
    if (!c) return
    c.style.filter =
      `blur(${blurPx.toFixed(2)}px)` +
      ` drop-shadow(${splitPx.toFixed(2)}px 0 0 rgba(255,0,51,.5))` +
      ` drop-shadow(${(-splitPx).toFixed(2)}px 0 0 rgba(0,255,230,.5))`
  }

  // ENTRADA: voa do fundo, foca, gira pra câmera, assenta seco; bloom ametista,
  // power-on de scanline, ignição da borda, decode do texto e blip de impacto.
  const playEnter = () => {
    const card = cardRef.current
    if (!card) return
    tlRef.current?.kill()
    setActive(true)
    setLaunchKey((k) => k + 1) // re-dispara o decode

    const fx = { blur: START_BLUR, split: RGB_SPLIT }
    setFx(fx.blur, fx.split) // aplica já no 1º frame (evita flash sem filtro)

    const tl = gsap.timeline()
    tlRef.current = tl

    tl.set(card, {
      transformPerspective: 1200,
      z: DEPTH_Z,
      rotateY: TURN_DEG,
      xPercent: -34,
      yPercent: 12,
      scale: 1,
      autoAlpha: 0,
    })
    // voo da profundidade + rack-focus (transform e filtro convergem juntos)
    tl.to(card, { duration: ENTER_DUR, z: 0, rotateY: 0, xPercent: 0, yPercent: 0, autoAlpha: 1, ease: 'power3.out' }, 0)
    tl.to(fx, { duration: ENTER_DUR, blur: 0, split: 0, ease: 'power3.out', onUpdate: () => setFx(fx.blur, fx.split) }, 0)
    // assentamento mecânico SECO (micro-pop, sem mola)
    tl.to(card, { duration: 0.1, scale: 1.025, ease: 'power2.out' }, ENTER_DUR - 0.05)
    tl.to(card, { duration: 0.16, scale: 1, ease: 'power2.inOut' }, '>')

    // flash AMETISTA (único respiro de cor) — o card nasce do pulso
    if (AMETHYST_FLASH && bloomRef.current) {
      tl.fromTo(bloomRef.current, { autoAlpha: 0, scale: 0.4 }, { autoAlpha: 0.9, scale: 1.05, duration: 0.16, ease: 'power2.out' }, 0)
      tl.to(bloomRef.current, { autoAlpha: 0, scale: 1.55, duration: 0.55, ease: 'power2.in' }, 0.16)
    }
    // power-on: varredura de scanline descendo uma vez
    if (sweepRef.current) {
      tl.fromTo(
        sweepRef.current,
        { autoAlpha: 0.9, yPercent: -120 },
        { yPercent: 260, duration: 0.5, ease: 'power1.in' },
        ENTER_DUR * 0.5
      )
      tl.to(sweepRef.current, { autoAlpha: 0, duration: 0.12 }, '>-0.08')
    }
    // ignição da borda no pouso
    if (ringRef.current) {
      tl.fromTo(ringRef.current, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.1 }, ENTER_DUR * 0.7)
      tl.to(ringRef.current, { autoAlpha: 0, duration: 0.5, ease: 'power2.out' }, '>')
    }
    // blip de impacto (grave + tick agudo) — mudo até o usuário ligar o som
    tl.add(() => blip(170, 0.05, 'triangle'), ENTER_DUR * 0.6)
    tl.add(() => blip(320, 0.03, 'sine'), ENTER_DUR * 0.6 + 0.05)
  }

  // SAÍDA: burst de RGB split + ruído de TV, recua pro fundo e dissolve.
  const playExit = () => {
    const card = cardRef.current
    if (!card) return
    tlRef.current?.kill()
    setActive(false)

    const fx = { blur: 0, split: 0 }
    const tl = gsap.timeline()
    tlRef.current = tl

    tl.to(fx, { duration: 0.1, split: 11, ease: 'power1.in', onUpdate: () => setFx(fx.blur, fx.split) }, 0)
    tl.to(fx, { duration: EXIT_DUR, blur: 5, split: 0, ease: 'power2.in', onUpdate: () => setFx(fx.blur, fx.split) }, 0.1)
    tl.to(card, { duration: EXIT_DUR + 0.1, z: -220, autoAlpha: 0, ease: 'power2.in' }, 0)
    if (noiseRef.current) {
      tl.fromTo(noiseRef.current, { autoAlpha: 0 }, { autoAlpha: 0.55, duration: 0.07, repeat: 4, yoyo: true, ease: 'none' }, 0)
      tl.to(noiseRef.current, { autoAlpha: 0, duration: 0.1 }, '>')
    }
  }

  // máquina de estados sincronizada ao tempo do vídeo
  useEffect(() => {
    reduced.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const v = videoRef?.current
    if (!v) return
    const card = cardRef.current
    if (card) gsap.set(card, { autoAlpha: 0 }) // começa escondido

    let raf
    const loop = () => {
      const t = v.currentTime || 0
      if (t + 0.4 < lastT.current) {
        // o vídeo reiniciou -> próximo projeto
        setIndex((i) => (i + 1) % CATALOG.length)
        phase.current = 'idle'
      }
      const inWindow = t >= LAUNCH_T && t < EXIT_T
      if (reduced.current) {
        // sem animação: aparece/some instantâneo, sem efeitos
        if (phase.current === 'idle' && inWindow) {
          if (card) { card.style.filter = ''; gsap.set(card, { clearProps: 'transform', autoAlpha: 1 }) }
          setActive(true)
          phase.current = 'in'
        } else if (phase.current === 'in' && t >= EXIT_T) {
          if (card) gsap.set(card, { autoAlpha: 0 })
          setActive(false)
          phase.current = 'out'
        }
      } else {
        if (phase.current === 'idle' && inWindow) {
          playEnter()
          phase.current = 'in'
        } else if (phase.current === 'in' && t >= EXIT_T) {
          playExit()
          phase.current = 'out'
        }
      }
      lastT.current = t
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      tlRef.current?.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoRef])

  const proj = CATALOG[index]
  if (!proj) return null

  return (
    <div className="pointer-events-none absolute inset-0 z-[2] hidden md:block [perspective:1200px]">
      {/* âncora: lado direito, centralizado na vertical */}
      <div className="absolute right-[5%] top-1/2 w-[clamp(260px,24vw,400px)] -translate-y-1/2">
        {/* flash ametista ATRÁS do card (o card nasce do pulso) */}
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
          onClick={() => active && onOpenProject?.(index)}
          onKeyDown={(e) => active && (e.key === 'Enter' || e.key === ' ') && onOpenProject?.(index)}
          role="button"
          tabIndex={active ? 0 : -1}
          aria-label={`Abrir case ${proj.name}`}
          style={{ opacity: 0, transformStyle: 'preserve-3d', willChange: 'transform, opacity, filter' }}
          className="pointer-events-auto block origin-center cursor-pointer"
        >
          <div className="at-panel relative overflow-hidden rounded-xl">
            <span className="panel-scanlines" aria-hidden="true" />

            {/* ignição da borda no pouso */}
            <span
              ref={ringRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-[3] rounded-xl"
              style={{ opacity: 0, boxShadow: 'inset 0 0 0 1px rgba(216,216,218,.9), 0 0 30px rgba(216,216,218,.35)' }}
            />
            {/* power-on: barra de varredura */}
            <span
              ref={sweepRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 top-0 z-[3] h-1/3"
              style={{
                opacity: 0,
                background: 'linear-gradient(to bottom, transparent, rgba(216,216,218,.16) 60%, rgba(216,216,218,.5))',
              }}
            />
            {/* ruído de TV (glitch-out na saída) */}
            <div ref={noiseRef} aria-hidden="true" className="pointer-events-none absolute inset-0 z-[4] mix-blend-screen" style={{ opacity: 0 }}>
              <svg className="block h-full w-full" preserveAspectRatio="none">
                <filter id="cco-noise">
                  <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch">
                    <animate attributeName="seed" values="1;6;3;11;5;14;2" dur="0.4s" repeatCount="indefinite" calcMode="discrete" />
                  </feTurbulence>
                  <feColorMatrix type="saturate" values="0" />
                  <feComponentTransfer>
                    <feFuncA type="linear" slope="0.7" />
                  </feComponentTransfer>
                </filter>
                <rect width="100%" height="100%" filter="url(#cco-noise)" />
              </svg>
            </div>

            <img
              src={proj.image}
              alt={`Case ${proj.name} — ${proj.segment}`}
              className="w-full aspect-[16/10] object-cover"
              loading="lazy"
            />
            <div className="p-6">
              <p className="mono-label text-titanium/70">
                {proj.segment}
                {proj.city ? ` · ${proj.city}` : ''} · {proj.year}
              </p>
              <DecodeText
                text={proj.name}
                trigger={launchKey}
                as="h3"
                className="font-display font-semibold text-2xl text-ivory mt-1 mb-4 block"
              />
              <ul className="space-y-2 mb-4">
                {proj.metrics.map((m) => (
                  <li key={m} className="font-mono text-xs text-amber flex items-center gap-2">
                    <span className="text-amber/50">+</span>
                    <DecodeText text={m} trigger={launchKey} />
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                {proj.tags.map((tg) => (
                  <span
                    key={tg}
                    className="mono-label text-[0.55rem] border border-ivory/15 rounded-full px-3 py-1.5 text-titanium"
                  >
                    {tg}
                  </span>
                ))}
              </div>

              {/* canais REAIS do cliente — stopPropagation p/ o clique não abrir
                  o case por trás. Só rendem o que está confirmado no CRM. */}
              {(proj.instagram || proj.site || proj.whatsapp) && (
                <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-ivory/10 pt-4">
                  {proj.instagram && (
                    <a
                      href={proj.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mono-label text-[0.55rem] text-titanium hover:text-amber transition-colors"
                    >
                      Instagram ↗
                    </a>
                  )}
                  {proj.site && (
                    <a
                      href={proj.site}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mono-label text-[0.55rem] text-titanium hover:text-amber transition-colors"
                    >
                      Site ↗
                    </a>
                  )}
                  {proj.whatsapp && (
                    <a
                      href={proj.whatsapp}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="mono-label text-[0.55rem] text-titanium hover:text-amber transition-colors"
                    >
                      WhatsApp ↗
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
