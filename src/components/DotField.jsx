import { useEffect, useRef } from 'react'

// Campo de PONTOS 3D (canvas 2D + projeção em perspectiva), estilo "dot field"
// generativo: uma malha de pontos que ondula no tempo criando ilusão de
// profundidade. HOVER (cursor sobre a área) muda a cor (transição suave) e
// levanta uma onda sob o cursor. Sem dependência de WebGL — leve.
// Decorativo → aria-hidden; respeita prefers-reduced-motion (quadro estático).
//
// Parâmetros fáceis de ajustar depois:
const COLS = 100 // densidade ao longo da onda (largura) — menos colunas = bolinhas mais espalhadas
const ROWS = 13 // profundidade — menos filas = bolinhas mais espalhadas em profundidade
const PITCH = 0.82 // inclinação do plano (rad) — mais alto = mais inclinado (vista mais de cima)
const CAM_Z = 2.6 // distância da câmera (perspectiva)
const FOCAL = 1.5 // distância focal
const OVERSCAN = 2.0 // transborda a malha além das laterais (garante pontos até a beira p/ o fade dissolver)
const EDGE_X = 0.3 // largura do fade lateral (fração da largura) — dissolve a beira da malha nas laterais
const EDGE_Y = 0.12 // largura do fade inferior (fração da altura)
const WAVE_AMP = 0.5 // altura da onda — alta p/ formar um vinco nítido
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

    // No DESKTOP o cursor comanda (hover). No MOBILE não existe hover — quem
    // comanda é o SCROLL: a cor acende conforme a faixa atravessa a tela e
    // ganha um empurrão com a velocidade do dedo. Mesma linguagem visual,
    // acionada pelo gesto que existe em cada aparelho.
    const coarse = window.matchMedia('(pointer: coarse)').matches

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

    // --- comando por SCROLL (mobile) ---
    let scrollProg = 0 // 0 = faixa entrando por baixo, 1 = saindo por cima
    let scrollKick = 0 // impulso da velocidade do dedo, decai sozinho
    let lastY = window.scrollY
    const onScroll = () => {
      const r = canvas.getBoundingClientRect()
      const vh = window.innerHeight || 1
      // progresso da faixa cruzando a viewport
      scrollProg = Math.max(0, Math.min(1, 1 - (r.top + r.height) / (vh + r.height)))
      const dy = Math.abs(window.scrollY - lastY)
      lastY = window.scrollY
      scrollKick = Math.min(1, scrollKick + dy / 120)
      // a "origem" da ondulação acompanha o dedo subindo/descendo a página
      mouse.x = 0.5 + 0.35 * Math.sin(scrollProg * Math.PI * 2)
      mouse.y = 1 - scrollProg
    }

    if (coarse) {
      window.addEventListener('scroll', onScroll, { passive: true })
      onScroll()
    } else {
      window.addEventListener('mousemove', onMove, { passive: true })
    }

    const sin = Math.sin, cos = Math.cos
    let raf = 0
    let t = 0
    let hov = 0 // fator de hover suavizado (0..1)

    const draw = () => {
      const cx = W / 2
      // fila da frente perto do topo (sob a máscara); o plano recua p/ baixo e
      // a fila do fundo cai abaixo da tela — assim não aparece borda inferior.
      const cy = H * 0.35
      // escalas desacopladas: X preenche a LARGURA (faixa larga, transbordando
      // c/ o overscan), Y usa a ALTURA da faixa (amplitude + recuo do plano).
      const scaleX = W * 1.05
      const scaleY = H * 1.7
      // TOUCH: o acento é comandado pelo SCROLL — acende conforme a faixa
      // cruza a tela e recebe um empurrão da velocidade do dedo.
      // DESKTOP: segue o hover, como antes.
      const target = coarse
        ? Math.min(1, 0.15 + 0.6 * scrollProg + 0.45 * scrollKick)
        : mouse.inside ? 1 : 0
      hov += (target - hov) * (coarse ? 0.12 : 0.05)
      scrollKick *= 0.94 // o impulso decai quando o dedo para

      ctx.clearRect(0, 0, W, H)
      // cor: neutra → acento que cicla matiz no hover
      const hue = (t * ACCENT_SPEED * 60) % 360

      for (let j = 0; j < ROWS; j++) {
        const gz = j / (ROWS - 1) // 0 perto, 1 longe
        for (let i = 0; i < COLS; i++) {
          const gx = ((i / (COLS - 1)) * 2 - 1) * OVERSCAN // -OVERSCAN..OVERSCAN (transborda as laterais)
          // UMA onda dominante: uma senoide que viaja ao longo da largura (gx),
          // com leve deslocamento por profundidade p/ a crista não ficar chapada.
          // + ondulação radial sob o cursor (no hover)
          let y = sin(gx * 3.0 + gz * 0.5 + t * 1.2) * WAVE_AMP
          if (hov > 0.001) {
            const dx = gx - (mouse.x * 2 - 1) * OVERSCAN
            const dz = gz - (1 - mouse.y)
            const d = Math.sqrt(dx * dx + dz * dz)
            y += sin(d * 9 - t * 3) * 0.12 * hov * Math.max(0, 1 - d)
          }
          // mundo → inclina o plano (pitch) → perspectiva
          const X = gx
          const Z = gz * 2.6
          const Yr = y * cos(PITCH) - Z * sin(PITCH)
          const Zr = y * sin(PITCH) + Z * cos(PITCH)
          const persp = FOCAL / (Zr + CAM_Z)
          const sx = cx + X * persp * scaleX
          const sy = cy - Yr * persp * scaleY
          if (sx < -20 || sx > W + 20 || sy < -20 || sy > H + 20) continue
          const depth = 1 - gz // 1 perto, 0 longe
          const r = Math.max(0.4, persp * scaleY * 0.02 * (0.5 + depth))
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
          // feather nas bordas: dissolve a beira da malha nas laterais e embaixo,
          // como a máscara CSS faz no topo. Resolve o "leque" dos cantos sem
          // depender da geometria (não dá p/ esconder borda diagonal com padding).
          const fadeX = Math.min(sx, W - sx) / (W * EDGE_X)
          const fadeY = (H - sy) / (H * EDGE_Y)
          alpha *= Math.max(0, Math.min(1, fadeX)) * Math.max(0, Math.min(1, fadeY))
          if (alpha <= 0.002) continue
          ctx.beginPath()
          ctx.arc(sx, sy, r, 0, 6.283)
          ctx.fillStyle = `rgba(${cr | 0},${cg | 0},${cb | 0},${alpha.toFixed(3)})`
          ctx.fill()
        }
      }

      if (!reduced) {
        t += 0.003 // velocidade da ondulação — menor = mais lento
        raf = requestAnimationFrame(draw)
      }
    }
    draw() // desenha ao menos um quadro (e anima se não for reduced-motion)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}
