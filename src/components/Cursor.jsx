import { useEffect, useRef, useState } from 'react'
import { blip } from '../audio'

// Cursor customizado: quadradinho dourado preso ao ponteiro, que cresce um
// pouco sobre link ou botão. Sobre [data-cursor="VER" | "ARRASTE"] aparece uma
// etiqueta acima dele, que segue com leve atraso.
const CLICKABLE = 'a, button, [role="button"], input, select, textarea, label, summary'
// tudo que reage ao hover toca um tique curto ao entrar (só com o som ligado)
const HOVER_SOUND = `${CLICKABLE}, .at-panel, .nature-card, .card-wave, [data-cursor]`
const HOVER_GAP_MS = 60 // evita metralhadora de tiques ao varrer vários alvos

export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [label, setLabel] = useState('')
  const [hover, setHover] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor')

    const pos = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let raf = 0
    let hovered = null
    let lastTick = 0

    // o loop só roda enquanto a etiqueta ainda persegue o ponteiro; parado, dorme
    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.18
      ring.y += (pos.y - ring.y) * 0.18
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${Math.round(ring.x)}px, ${Math.round(ring.y)}px)`
      raf = Math.abs(pos.x - ring.x) + Math.abs(pos.y - ring.y) > 0.2 ? requestAnimationFrame(tick) : 0
    }

    // pointer* e não mouse*: arrastar a barra de rolagem cancela os eventos de
    // mouse (preventDefault no pointerdown) e o cursor ficava parado onde clicou
    const onMove = (e) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      pos.x = e.clientX
      pos.y = e.clientY
      const el = e.target
      const target = el?.closest?.('[data-cursor]')
      setLabel(target ? target.dataset.cursor : '')
      setHover(!!el?.closest?.(CLICKABLE))
      const zone = el?.closest?.(HOVER_SOUND) || null
      if (zone !== hovered) {
        hovered = zone
        const now = performance.now()
        if (zone && now - lastTick > HOVER_GAP_MS) {
          lastTick = now
          blip(660, 0.018, 'sine')
        }
      }
      if (!raf) raf = requestAnimationFrame(tick)
    }
    // clique em algo clicável: tique mais grave que o do hover. O botão de som
    // fica de fora porque já toca as notas dele
    const onDown = (e) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      const el = e.target
      if (el?.closest?.(CLICKABLE) && !el.closest('.audio-toggle')) blip(330, 0.03, 'triangle')
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerdown', onDown, { passive: true })
    // pointerover cobre o caso de o DOM trocar SOB o cursor parado (abrir/fechar
    // o case): reavalia o alvo e limpa o rótulo herdado da tela anterior.
    window.addEventListener('pointerover', onMove, { passive: true })

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerover', onMove)
      document.body.classList.remove('custom-cursor')
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden md:block" aria-hidden="true">
        <span className={hover ? 'is-hover' : ''} />
      </div>
      <div ref={ringRef} className={`cursor-ring hidden md:flex ${label ? 'is-label' : ''}`} aria-hidden="true">
        <span className="cursor-label">{label}</span>
      </div>
    </>
  )
}
