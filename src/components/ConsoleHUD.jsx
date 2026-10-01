import { useEffect, useState } from 'react'
import { sectionTone } from '../audio'

// Chrome de console no estilo Active Theory: colchetes técnicos nos cantos,
// grade sutil e um log vivo (seção ativa, coordenada de scroll, relógio).
// Reforça a leitura de "instrumento técnico" sem competir com o conteúdo.

// ORDEM = ordem real das seções no DOM (App.jsx). O índice do HUD deriva daqui,
// então precisa bater com o render: catálogo=04, retorno=05...
const SECTION_NAMES = {
  hero: 'TESE',
  manifesto: 'MANIFESTO',
  servicos: 'SERVIÇOS',
  catalogo: 'CATÁLOGO',
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
  // no máximo uma leitura por quadro, e a altura da página só é medida no resize
  useEffect(() => {
    let raf = 0
    let max = 0
    const measure = () => {
      max = document.body.scrollHeight - window.innerHeight
    }
    const update = () => {
      raf = 0
      const p = max > 0 ? window.scrollY / max : 0
      setCoord(String(Math.round(p * 9999)).padStart(4, '0'))
    }
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update)
    }
    const onResize = () => {
      measure()
      onScroll()
    }
    measure()
    update()
    // a página cresce depois do primeiro paint (fontes, imagens): remede uma vez
    const late = setTimeout(measure, 2000)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(late)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
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
    </>
  )
}
