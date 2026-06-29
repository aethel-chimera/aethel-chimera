import { useEffect, useRef } from 'react'

// Campo de PONTOS 3D (canvas 2D + projeção em perspectiva), estilo "dot field"
// generativo: uma malha de pontos que ondula no tempo criando ilusão de
// profundidade. HOVER (cursor sobre a área) muda a cor (transição suave) e
// levanta uma onda sob o cursor. Sem dependência de WebGL — leve.
// Decorativo → aria-hidden; respeita prefers-reduced-motion (quadro estático).
//
// Parâmetros fáceis de ajustar depois:
const COLS = 64 // densidade ao longo da onda (largura)
const ROWS = 18 // profundidade — poucas filas: faixa/crista de UMA onda, não um campo
const PITCH = 0.5 // inclinação do plano (rad) — baixo = vista mais de lado p/ ver a crista
const CAM_Z = 2.6 // distância da câmera (perspectiva)
const FOCAL = 1.5 // distância focal
const WAVE_AMP = 0.46 // altura da onda — alta p/ formar um vinco nítido
const BASE = [150, 152, 158] // cor neutra (sem hover) — combina com o baseline cru
const ACCENT_SPEED = 0.4 // velocidade do ciclo de cor no hover

export default function DotField({ className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    let W = 0, H = 0
    const resize = () => {
      const r = canvas.getBoundingClientRect()
      W = r.width
      H = r.height
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(canvas)

    // hover: detectado por bounds (canvas é pointer-events-none, não bloqueia texto)
    const mouse = { x: 0.5, y: 0.5, inside: false }
    const onMove = (e) => {
      const r = canvas.getBoundingClientRect()
      const inside = e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      mouse.inside = inside
      if (inside) {
        mouse.x = (e.clientX - r.left) / r.width
        mouse.y = (e.clientY - r.top) / r.height
      }
    }
    window.addEventListener('mousemove', onMove, { passive: true })

    const sin = Math.sin, cos = Math.cos
    let raf = 0
    let t = 0
    let hov = 0 // fator de hover suavizado (0..1)

    const draw = () => {
      const cx = W / 2
      const cy = H * 0.46
      const scaleScreen = Math.min(W, H) * 0.62
      hov += ((mouse.inside ? 1 : 0) - hov) * 0.05

      ctx.clearRect(0, 0, W, H)
      // cor: neutra → acento que cicla matiz no hover
      const hue = (t * ACCENT_SPEED * 60) % 360

      for (let j = 0; j < ROWS; j++) {
        const gz = j / (ROWS - 1) // 0 perto, 1 longe
        for (let i = 0; i < COLS; i++) {
          const gx = (i / (COLS - 1)) * 2 - 1 // -1..1
          // UMA onda dominante: uma senoide que viaja ao longo da largura (gx),
          // com leve deslocamento por profundidade p/ a crista não ficar chapada.
          // + ondulação radial sob o cursor (no hover)
          let y = sin(gx * 2.4 + gz * 0.5 + t * 1.2) * WAVE_AMP
          if (hov > 0.001) {
            const dx = gx - (mouse.x * 2 - 1)
            const dz = gz - (1 - mouse.y)
            const d = Math.sqrt(dx * dx + dz * dz)
            y += sin(d * 9 - t * 3) * 0.12 * hov * Math.max(0, 1 - d)
          }
          // mundo → inclina o plano (pitch) → perspectiva
          const X = gx
          const Z = gz * 2.2
          const Yr = y * cos(PITCH) - Z * sin(PITCH)
          const Zr = y * sin(PITCH) + Z * cos(PITCH)
          const persp = FOCAL / (Zr + CAM_Z)
          const sx = cx + X * persp * scaleScreen
          const sy = cy - Yr * persp * scaleScreen
          if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue
          const depth = 1 - gz // 1 perto, 0 longe
          const r = Math.max(0.4, persp * scaleScreen * 0.018 * (0.5 + depth))
          let alpha = 0.12 + depth * 0.5
          // cor do ponto
          let cr, cg, cb
          if (hov > 0.001) {
            // acento neon ciclando, misturado com a base pelo fator de hover
            const a = (hue + gx * 40 + gz * 60) * (Math.PI / 180)
            const ar = 0.5 + 0.5 * sin(a)
            const ag = 0.5 + 0.5 * sin(a + 2.094)
            const ab = 0.5 + 0.5 * sin(a + 4.188)
            cr = BASE[0] + (255 * ar - BASE[0]) * hov
            cg = BASE[1] + (255 * ag - BASE[1]) * hov
            cb = BASE[2] + (255 * ab - BASE[2]) * hov
            alpha += 0.25 * hov
          } else {
            cr = BASE[0]; cg = BASE[1]; cb = BASE[2]
          }
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, 6.283)
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha.toFixed(3)})`
          ctx.fill()
        }
      }

      if (!reduced) {
        t += 0.012
        raf = requestAnimationFrame(draw)
      }
    }
    draw() // desenha ao menos um quadro (e anima se não for reduced-motion)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}
