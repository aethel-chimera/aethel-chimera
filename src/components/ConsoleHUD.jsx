import { useEffect, useState } from 'react'
import { sectionTone } from '../audio'

// Chrome de console no estilo Active Theory: colchetes técnicos nos cantos,
// grade sutil e um log vivo (seção ativa, coordenada de scroll, relógio).
// Reforça a leitura de "instrumento técnico" sem competir com o conteúdo.

// ORDEM = ordem real das seções no DOM (App.jsx). O índice do HUD deriva daqui,
// então precisa bater com o render: catálogo=04, studio3d=05, retorno=06...
const SECTION_NAMES = {
  hero: 'TESE',
  manifesto: 'MANIFESTO',
  servicos: 'SERVIÇOS',
  catalogo: 'CATÁLOGO',
  studio3d: 'MODELAGEM 3D',
  retorno: 'RETORNO',
  processo: 'PROTOCOLO',
  resultados: 'RESULTADOS',
  planos: 'MANUTENÇÃO',
  contato: 'PORTAL',
  rodape: 'RODAPÉ',
}
const ORDER = Object.keys(SECTION_NAMES)

export default function ConsoleHUD() {
  const [active, setActive] = useState('hero')
  const [coord, setCoord] = useState('0000')
  const [clock, setClock] = useState('--:--:--')
  const [showHint, setShowHint] = useState(true)

  // dica de orbitar sai após o primeiro drag (ou 8s)
  useEffect(() => {
    if (window.matchMedia('(pointer: coarse)').matches) {
      setShowHint(false)
      return
    }
    let moved = false
    const start = { x: 0, y: 0 }
    const down = (e) => { start.x = e.clientX; start.y = e.clientY }
    const move = (e) => {
      if (!moved && (e.buttons & 1) && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 12) {
        moved = true
        setShowHint(false)
      }
    }
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    const t = setTimeout(() => setShowHint(false), 8000)
    return () => {
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      clearTimeout(t)
    }
  }, [])

  // seção ativa por IntersectionObserver
  useEffect(() => {
    const sections = ORDER.map((id) => document.getElementById(id)).filter(Boolean)
    let current = 'hero'
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && e.target.id !== current) {
            current = e.target.id
            setActive(current)
            sectionTone(ORDER.indexOf(current))
          }
        })
      },
      { threshold: 0.5 }
    )
    sections.forEach((s) => io.observe(s))
    return () => io.disconnect()
  }, [])

  // coordenada de scroll (readout técnico)
  useEffect(() => {
    const onScroll = () => {
      const max = document.body.scrollHeight - window.innerHeight
      const p = max > 0 ? window.scrollY / max : 0
      setCoord(String(Math.round(p * 9999)).padStart(4, '0'))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // relógio de Brasília
  useEffect(() => {
    const tick = () => {
      const now = new Date().toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour12: false })
      setClock(now)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  const idx = String(ORDER.indexOf(active) + 1).padStart(2, '0')

  return (
    <>
      <div className="tech-grid" aria-hidden="true" />
      <div className="hud-frame" aria-hidden="true">
        <span className="hud-corner tl" />
        <span className="hud-corner tr" />
        <span className="hud-corner bl" />
        <span className="hud-corner br" />
      </div>
      {/* log técnico só em telas médias+ (no mobile sobrepõe o conteúdo) */}
      <div className="hud-log hidden md:block" aria-hidden="true">
        <span className="amber">SEC {idx}</span> // {SECTION_NAMES[active]} · POS <span className="amber">{coord}</span> · BRT {clock}
      </div>
      <div
        className="fixed bottom-[22px] right-[46px] z-[88] pointer-events-none mono-label text-[0.6rem] text-titanium/60 transition-opacity duration-700"
        style={{ opacity: showHint ? 1 : 0 }}
        aria-hidden="true"
      >
        Arraste <span className="text-amber">⟳</span> orbitar
      </div>
    </>
  )
}
