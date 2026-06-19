import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

const WORDS = ['engenharia', 'estratégia', 'tráfego', 'presença']

// Imagens críticas acima da dobra: primeiro card do catálogo entra no pacote
// para que o ScrollTrigger meça alturas corretas após o reveal.
const CRITICAL_IMAGES = []

export default function Preloader({ onDone }) {
  const [progress, setProgress] = useState(0)
  const [wordIndex, setWordIndex] = useState(0)
  const rootRef = useRef(null)
  const leftRef = useRef(null)
  const rightRef = useRef(null)
  const counterRef = useRef(null)
  const monoRef = useRef(null)
  const doneRef = useRef(false)

  useEffect(() => {
    document.body.style.overflow = 'hidden'

    // rotação de palavras a cada 400ms
    const wordTimer = setInterval(() => setWordIndex((i) => (i + 1) % WORDS.length), 400)

    // Progresso REAL pelo carregamento de fontes + imagens críticas. O mundo
    // WebGL é DECORATIVO e carrega de forma assíncrona (lazy) — não trava o
    // conteúdo, o que mantém o LCP baixo no mobile. Um tempo mínimo garante a
    // intro cinematográfica sem depender do parse do Three.js.
    // tempo mínimo da intro: curto no mobile (LCP) e cinematográfico no desktop
    const isMobile = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches
    const MIN_TIME = isMobile ? 700 : 1600
    const startT = performance.now()

    const tasks = [
      document.fonts.ready,
      ...CRITICAL_IMAGES.map((src) => {
        const img = new Image()
        img.src = src
        return img.decode().catch(() => {})
      }),
    ]

    let targetProgress = 8
    let shown = 0
    let done = 0
    let raf

    tasks.forEach((t) =>
      Promise.resolve(t).then(() => {
        done++
        targetProgress = (done / tasks.length) * 100
      })
    )

    const reveal = () => {
      if (doneRef.current) return
      doneRef.current = true
      clearInterval(wordTimer)
      sessionStorage.setItem('aethel-preloaded', '1')

      // cortina mais rápida no mobile para liberar o paint do conteúdo (LCP)
      const cd = isMobile ? 0.55 : 1.1
      const tl = gsap.timeline({
        onComplete: () => {
          document.body.style.overflow = ''
          onDone()
        },
      })
      tl.to(counterRef.current, { scale: 0.6, opacity: 0, duration: isMobile ? 0.3 : 0.5, ease: 'power3.in' })
        .to(monoRef.current, { scale: 1.4, opacity: 0, duration: isMobile ? 0.35 : 0.6, ease: 'power3.inOut' }, '<0.1')
        .to(leftRef.current, { xPercent: -100, duration: cd, ease: 'power4.inOut' }, '-=0.15')
        .to(rightRef.current, { xPercent: 100, duration: cd, ease: 'power4.inOut' }, '<')
        .set(rootRef.current, { display: 'none' })
    }

    const tick = () => {
      const elapsed = performance.now() - startT
      // o número não ultrapassa o "portão de tempo" — progresso honesto e
      // cinematográfico mesmo quando as fontes resolvem instantaneamente
      const timeGate = Math.min(elapsed / MIN_TIME, 1) * 100
      const effective = Math.min(targetProgress, timeGate)
      shown += (effective - shown) * 0.1
      setProgress(Math.round(shown))
      if (shown > 99.4 && elapsed > MIN_TIME) {
        setProgress(100)
        reveal()
        return
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      clearInterval(wordTimer)
      document.body.style.overflow = ''
    }
  }, [onDone])

  return (
    <div ref={rootRef} className="fixed inset-0 z-[300]" role="status" aria-label="Carregando">
      {/* duas metades que abrem como cortina */}
      <div ref={leftRef} className="absolute inset-y-0 left-0 w-1/2 bg-obsidian" />
      <div ref={rightRef} className="absolute inset-y-0 right-0 w-1/2 bg-obsidian" />

      <div className="relative z-10 h-full flex flex-col items-center justify-center gap-10">
        {/* monograma Æ desenhado por stroke */}
        <svg ref={monoRef} viewBox="0 0 120 100" className="w-24 h-20" aria-hidden="true">
          <text
            x="60"
            y="78"
            textAnchor="middle"
            fontFamily="'Space Grotesk', sans-serif"
            fontSize="88"
            fontWeight="600"
            fill="none"
            stroke="#F4F2EC"
            strokeWidth="1.2"
            style={{
              strokeDasharray: 600,
              strokeDashoffset: 600,
              animation: 'monogram-draw 2s ease forwards',
            }}
          >
            Æ
          </text>
          <style>{`@keyframes monogram-draw { to { stroke-dashoffset: 0; } }`}</style>
        </svg>

        <div ref={counterRef} className="flex flex-col items-center gap-4">
          <span className="font-mono text-5xl text-ivory tabular-nums">
            {String(progress).padStart(3, '0')}
          </span>
          <span className="mono-label text-amber min-w-[12ch] text-center">
            {WORDS[wordIndex]}
          </span>
        </div>
      </div>
    </div>
  )
}
