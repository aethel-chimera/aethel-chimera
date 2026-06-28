import { useEffect, useRef, useState } from 'react'

// Cursor customizado: ponto + anel com lerp. O anel escala e vira rótulo
// sobre elementos com [data-cursor="VER" | "ARRASTE"].
export default function Cursor() {
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const [label, setLabel] = useState('')

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    document.body.classList.add('custom-cursor')

    const pos = { x: -100, y: -100 }
    const ring = { x: -100, y: -100 }
    let raf

    const onMove = (e) => {
      pos.x = e.clientX
      pos.y = e.clientY
      const target = e.target?.closest?.('[data-cursor]')
      setLabel(target ? target.dataset.cursor : '')
    }

    const tick = () => {
      ring.x += (pos.x - ring.x) * 0.12
      ring.y += (pos.y - ring.y) * 0.12
      if (dotRef.current) dotRef.current.style.transform = `translate(${pos.x}px, ${pos.y}px)`
      if (ringRef.current) ringRef.current.style.transform = `translate(${ring.x}px, ${ring.y}px)`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    window.addEventListener('mousemove', onMove)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('mousemove', onMove)
      document.body.classList.remove('custom-cursor')
    }
  }, [])

  return (
    <>
      <div ref={dotRef} className="cursor-dot hidden md:block" aria-hidden="true" />
      <div ref={ringRef} className={`cursor-ring hidden md:flex ${label ? 'is-label' : ''}`} aria-hidden="true">
        <span className="cursor-label">{label}</span>
      </div>
    </>
  )
}
