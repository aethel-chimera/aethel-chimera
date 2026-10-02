import { useEffect, useRef, useState } from 'react'

// Barra de rolagem própria: só o polegar pixelado, flutuando à direita, sem
// trilho. A nativa fica escondida no desktop (index.css); no toque ela segue.
const MIN_THUMB = 40 // px: abaixo disso o polegar fica difícil de pegar
const MARGIN = 10 // folga em cima e embaixo da área do polegar
const IDLE_MS = 900 // tempo sem rolar até o polegar voltar a ficar discreto

export default function ScrollBar() {
  const thumbRef = useRef(null)
  const [active, setActive] = useState(false)
  const [enabled, setEnabled] = useState(false)

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    setEnabled(true)
  }, [])

  useEffect(() => {
    if (!enabled) return
    const thumb = thumbRef.current
    if (!thumb) return

    let raf = 0
    let idle = 0
    let dragging = null
    const geo = { top: 0, track: 0, thumb: 0, max: 0 }

    const measure = () => {
      const view = window.innerHeight
      const full = document.documentElement.scrollHeight
      geo.max = Math.max(0, full - view)
      // a área do polegar começa abaixo do header fixo: nunca passa por cima dele
      const header = document.querySelector('header')
      geo.top = (header ? header.getBoundingClientRect().bottom : 0) + MARGIN
      geo.track = view - geo.top - MARGIN
      geo.thumb = Math.max(MIN_THUMB, Math.round(geo.track * (view / full)))
      thumb.style.height = `${geo.thumb}px`
      thumb.style.display = geo.max > 0 ? 'block' : 'none'
    }

    const place = () => {
      raf = 0
      const p = geo.max > 0 ? window.scrollY / geo.max : 0
      // degraus de 2 px: o movimento acompanha a grade pixelada
      const y = Math.round((geo.top + p * (geo.track - geo.thumb)) / 2) * 2
      thumb.style.transform = `translateY(${y}px)`
    }

    const wake = () => {
      setActive(true)
      clearTimeout(idle)
      idle = setTimeout(() => !dragging && setActive(false), IDLE_MS)
    }

    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(place)
      wake()
    }

    const scrollToY = (y) => {
      const target = Math.max(0, Math.min(geo.max, y))
      if (window.__lenis) window.__lenis.scrollTo(target, { immediate: true, force: true })
      else window.scrollTo(0, target)
    }

    // durante o arraste quem escuta é a janela: o mouse pode sair de cima do polegar
    const onMove = (e) => {
      if (!dragging) return
      const ratio = geo.max / Math.max(1, geo.track - geo.thumb)
      scrollToY(dragging.startScroll + (e.clientY - dragging.startY) * ratio)
    }
    const onUp = () => {
      dragging = null
      document.body.classList.remove('dragging')
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      wake()
    }
    const onDown = (e) => {
      if (e.button !== 0) return
      e.preventDefault()
      dragging = { startY: e.clientY, startScroll: window.scrollY }
      // sem seleção de texto enquanto arrasta (regra body.dragging do index.css)
      document.body.classList.add('dragging')
      setActive(true)
      window.addEventListener('pointermove', onMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)
    }

    measure()
    place()
    // a página muda de altura depois do primeiro paint (pin do Manifesto, imagens)
    const ro = new ResizeObserver(() => {
      measure()
      place()
    })
    ro.observe(document.body)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    thumb.addEventListener('pointerdown', onDown)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(idle)
      ro.disconnect()
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      thumb.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [enabled])

  if (!enabled) return null
  return <div ref={thumbRef} className={`px-scroll ${active ? 'is-active' : ''}`} aria-hidden="true" />
}
