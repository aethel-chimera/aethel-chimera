import { useEffect } from 'react'

// ---------------------------------------------------------------------------
// Amostra a COR MÉDIA do vídeo a cada frame (downscale 32×18 num canvas
// offscreen) e escreve em `--mt` ("r, g, b") no elemento alvo. O fundo da
// seção usa `rgba(var(--mt), α)` e assim MUDA DE COR acompanhando o vídeo
// (cromo → ouro → violeta). Vídeo é same-origin (/video/...), então getImageData
// não contamina o canvas. Em reduced-motion amostra só um frame (sem loop).
// ---------------------------------------------------------------------------
export function useMotionTint(videoRef, targetRef, { fps = 8, boost = 1.3, fallback = '224, 164, 88' } = {}) {
  useEffect(() => {
    const target = targetRef.current
    if (!target) return
    target.style.setProperty('--mt', fallback) // cor inicial até o 1º frame
    const video = videoRef.current
    if (!video) return // reduced-motion no hero usa <img>: fica no fallback

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const cvs = document.createElement('canvas')
    cvs.width = 32
    cvs.height = 18
    const ctx = cvs.getContext('2d', { willReadFrequently: true })

    const sample = () => {
      if (!ctx || video.readyState < 2 || !video.videoWidth) return false
      try {
        ctx.drawImage(video, 0, 0, cvs.width, cvs.height)
        const { data } = ctx.getImageData(0, 0, cvs.width, cvs.height)
        let r = 0, g = 0, b = 0
        const n = data.length / 4
        for (let i = 0; i < data.length; i += 4) {
          r += data[i]; g += data[i + 1]; b += data[i + 2]
        }
        r /= n; g /= n; b /= n
        // realça p/ tint perceptível sem estourar o branco
        r = Math.min(255, r * boost); g = Math.min(255, g * boost); b = Math.min(255, b * boost)
        target.style.setProperty('--mt', `${r | 0}, ${g | 0}, ${b | 0}`)
        return true
      } catch {
        return false
      }
    }

    if (reduced) {
      const once = () => { if (!sample()) setTimeout(once, 200) }
      once()
      return () => {}
    }

    let raf = 0, last = 0, stopped = false
    const tick = (t) => {
      if (stopped) return
      raf = requestAnimationFrame(tick)
      if (t - last < 1000 / fps) return
      last = t
      sample()
    }
    raf = requestAnimationFrame(tick)
    return () => { stopped = true; cancelAnimationFrame(raf) }
  }, [videoRef, targetRef, fps, boost, fallback])
}
