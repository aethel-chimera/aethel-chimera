import { useEffect, useRef } from 'react'

// Fundo halftone "vírus": uma colônia de pontos que cresce sozinha pela tela e
// ganha novos focos por onde o ponteiro passa. Portado do design
// "Halftone Glow Background" (tema Roxo).
const DEFAULT_COLOR = [165, 161, 245]
const STEPS = 10 // faixas de brilho: um fillStyle e um path por faixa
const TICK_MS = 28 // passo fixo do crescimento, independente do FPS
const SEEDS = 3 // focos iniciais; com um só a tela passa muito tempo vazia
const WARMUP_STEPS = 260 // a colônia já nasce crescida: sem isso o hero abre quase vazio

export default function HalftoneBackground({ color = DEFAULT_COLOR, cell = 5, speed = 1, reducedMotion = false, className = '' }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const [r, g, b] = color
    const fills = Array.from({ length: STEPS }, (_, k) => {
      const f = k / (STEPS - 1)
      return `rgba(${r},${g},${b},${(0.1 + 0.6 * Math.pow(f, 0.8)).toFixed(3)})`
    })

    let w = 0
    let h = 0
    let cols = 0
    let rows = 0
    let grain, cloud, rough, val, inf
    let front = []
    let trail = []
    let mouse = null
    let tick = 0
    let wander = 0
    let burst = -1
    let vigor = 1

    const seedVirus = () => {
      const n = cols * rows
      val = val && val.length === n ? val : new Float32Array(n)
      inf = new Uint8Array(n)
      front = []
      for (let s = 0; s < SEEDS; s++) {
        const i = ((0.12 + Math.random() * 0.76) * cols) | 0
        const j = ((0.12 + Math.random() * 0.76) * rows) | 0
        const k = j * cols + i
        inf[k] = 1
        val[k] = 1.9
        front.push(k)
      }
    }

    const resize = () => {
      w = canvas.clientWidth
      h = canvas.clientHeight
      canvas.width = Math.max(1, w)
      canvas.height = Math.max(1, h)
      cols = Math.ceil(w / cell)
      rows = Math.ceil(h / cell)

      // ruído de nuvem suave (manchas orgânicas) vezes ruído branco (dither)
      const lw = Math.ceil(cols / 10) + 2
      const lh = Math.ceil(rows / 10) + 2
      const lat = new Float32Array(lw * lh)
      for (let k = 0; k < lat.length; k++) lat[k] = Math.random()
      const smooth = (u, v) => {
        const x = u * (lw - 1)
        const y = v * (lh - 1)
        const x0 = x | 0
        const y0 = y | 0
        const fx = x - x0
        const fy = y - y0
        const ex = fx * fx * (3 - 2 * fx)
        const ey = fy * fy * (3 - 2 * fy)
        const a = lat[y0 * lw + x0]
        const bb = lat[y0 * lw + x0 + 1]
        const c = lat[(y0 + 1) * lw + x0]
        const d = lat[(y0 + 1) * lw + x0 + 1]
        const top = a + (bb - a) * ex
        return top + (c + (d - c) * ex - top) * ey
      }
      const n = cols * rows
      grain = new Float32Array(n)
      cloud = new Float32Array(n)
      rough = new Float32Array(n)
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const c = smooth(i / cols, j / rows)
          const k = j * cols + i
          cloud[k] = c
          rough[k] = Math.random()
          grain[k] = (0.55 + 0.75 * c) * (0.72 + 0.56 * Math.random())
        }
      }
      seedVirus()
    }

    const stepVirus = () => {
      if (trail.length) {
        const pts = trail
        trail = []
        for (const p of pts) {
          const R = 1.5 + Math.random() * 1.5
          for (let n = 0; n < 4; n++) {
            const a = Math.random() * 6.283
            const rr = Math.random() * R
            const ci = (p.x + Math.cos(a) * rr) | 0
            const cj = (p.y + Math.sin(a) * rr) | 0
            if (ci < 0 || cj < 0 || ci >= cols || cj >= rows) continue
            const k = cj * cols + ci
            inf[k] = 1
            val[k] = 1.2
            if (Math.random() < 0.06) front.push(k)
          }
        }
      }

      // borda acesa assenta rápido; o corpo consumido some devagar
      for (let k = 0; k < val.length; k++) {
        if (val[k] > 0) {
          val[k] *= val[k] > 0.8 ? 0.9 : 0.991
          if (val[k] < 0.04) {
            val[k] = 0
            inf[k] = 0
          }
        }
      }

      tick++
      wander += (Math.random() - 0.5) * 0.28
      if (burst-- < 0) {
        burst = 90 + ((Math.random() * 320) | 0)
        vigor = Math.random() < 0.25 ? 1.25 + Math.random() * 0.35 : 0.85 + Math.random() * 0.35
      }
      const ang = tick * 0.004 + 3.2 * Math.sin(tick * 0.0021) + wander
      const dxa = Math.cos(ang)
      const dya = Math.sin(ang)

      const next = []
      for (const k of front) {
        const i = k % cols
        const j = (k / cols) | 0
        let alive = false
        for (let a = 0; a < 7; a++) {
          const d = (Math.random() * 4) | 0
          const ni = i + (d === 0 ? 1 : d === 1 ? -1 : 0)
          const nj = j + (d === 2 ? 1 : d === 3 ? -1 : 0)
          if (ni < 0 || nj < 0 || ni >= cols || nj >= rows) continue
          const nk = nj * cols + ni
          if (inf[nk]) continue
          // cresce a favor da deriva e das manchas da nuvem: vira tentáculo, não círculo
          const dot = d === 0 ? dxa : d === 1 ? -dxa : d === 2 ? dya : -dya
          const bias = 0.3 + 0.7 * Math.max(0, dot)
          if (Math.random() > (0.45 + 0.5 * cloud[nk]) * bias * vigor) continue
          inf[nk] = 1
          val[nk] = 1.9
          next.push(nk)
          alive = true
        }
        if (alive) next.push(k)
      }
      front = next

      // nunca reinicia: se a frente fica presa, reacende a partir do corpo vivo
      if (!next.length) {
        let found = 0
        for (let tries = 0; tries < 400 && found < 3; tries++) {
          const k = (Math.random() * val.length) | 0
          if (val[k] > 0.25) {
            front.push(k)
            found++
          }
        }
        if (!found) seedVirus()
      }
    }

    const draw = (t) => {
      ctx.clearRect(0, 0, w, h)
      const paths = Array.from({ length: STEPS }, () => [])
      for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
          const k = j * cols + i
          const gr = grain[k]
          // poeira estática que respira em algumas manchas; o resto é vazio
          const cl = cloud[k]
          const th = 0.6 + 0.14 * Math.sin(t * 0.12 + cl * 11)
          const dust = cl > th && rough[k] < (cl - th) * 1.8 ? (0.1 + 0.06 * Math.sin(t * 0.18 + cl * 14)) * gr : 0
          let v = Math.max(dust, Math.min(1, val[k]) * gr)
          if (v < 0.06) continue
          if (v > 1) v = 1
          const s = Math.min(STEPS - 1, (v * STEPS) | 0)
          paths[s].push(i * cell, j * cell)
        }
      }
      for (let s = 0; s < STEPS; s++) {
        const pts = paths[s]
        if (!pts.length) continue
        const f = s / (STEPS - 1)
        const size = Math.max(1, Math.round((0.24 + 0.7 * f) * (cell - 1)))
        const off = ((cell - size) / 2) | 0
        ctx.fillStyle = fills[s]
        ctx.beginPath()
        for (let p = 0; p < pts.length; p += 2) ctx.rect(pts[p] + off, pts[p + 1] + off, size, size)
        ctx.fill()
      }
    }

    const warmUp = () => {
      for (let n = 0; n < WARMUP_STEPS; n++) stepVirus()
    }

    resize()
    warmUp()

    if (reducedMotion) {
      draw(0)
      return undefined
    }

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
        mouse = null
        return
      }
      const p = { x: x / cell, y: y / cell }
      // interpola para o traço rápido deixar um rastro contínuo
      if (mouse) {
        const dx = p.x - mouse.x
        const dy = p.y - mouse.y
        const n = Math.min(20, Math.ceil(Math.hypot(dx, dy) / 2))
        for (let s = 1; s <= n; s++) trail.push({ x: mouse.x + (dx * s) / n, y: mouse.y + (dy * s) / n })
      } else trail.push(p)
      mouse = p
    }
    const onLeave = () => {
      mouse = null
    }

    let raf = 0
    let running = false
    let last = 0
    const t0 = performance.now()
    const loop = () => {
      const now = performance.now()
      const step = TICK_MS / speed
      let guard = 0
      while (now - last > step && guard++ < 4) {
        last += step
        stepVirus()
      }
      if (now - last > step) last = now
      draw(((now - t0) / 1000) * speed)
      raf = requestAnimationFrame(loop)
    }
    const play = () => {
      if (running) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(loop)
    }
    const pause = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    // só anima com o hero na tela: fora dele o canvas custaria CPU à toa
    const io = new IntersectionObserver(([entry]) => (entry.isIntersecting ? play() : pause()))
    io.observe(canvas)

    let resizeTimer = 0
    const onResize = () => {
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        resize()
        warmUp()
      }, 150)
    }

    window.addEventListener('resize', onResize)
    window.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerleave', onLeave)
    return () => {
      pause()
      io.disconnect()
      clearTimeout(resizeTimer)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [color, cell, speed, reducedMotion])

  return <canvas ref={canvasRef} aria-hidden="true" className={`block h-full w-full ${className}`} />
}
