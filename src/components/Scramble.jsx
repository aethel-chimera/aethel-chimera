import { useEffect, useRef, useState } from 'react'

const GLYPHS = '日Æ01<>/{}#*-+=•▒░█ΛΞΣΦΨ'

// Texto que "decifra": embaralha glifos e resolve caractere a caractere ao
// entrar na viewport. Assinatura de engenharia, alinhada ao blueprint da marca.
export default function Scramble({ text, className = '', as: Tag = 'span', duration = 900 }) {
  const ref = useRef(null)
  const [display, setDisplay] = useState(text)
  const playedRef = useRef(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(text)
      return
    }

    const run = () => {
      if (playedRef.current) return
      playedRef.current = true
      const start = performance.now()
      let raf
      const tick = (now) => {
        const p = Math.min((now - start) / duration, 1)
        const revealCount = Math.floor(p * text.length)
        let out = ''
        for (let i = 0; i < text.length; i++) {
          if (text[i] === ' ') out += ' '
          else if (i < revealCount) out += text[i]
          else out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
        }
        setDisplay(out)
        if (p < 1) raf = requestAnimationFrame(tick)
        else setDisplay(text)
      }
      raf = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(raf)
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          run()
          io.disconnect()
        }
      },
      { threshold: 0.6 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [text, duration])

  return (
    <Tag ref={ref} className={className}>
      {/* texto real para leitores de tela; a versão embaralhada é decorativa */}
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">{display}</span>
    </Tag>
  )
}
