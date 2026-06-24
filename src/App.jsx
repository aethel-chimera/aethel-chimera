import { useCallback, useEffect, useMemo, useState, lazy, Suspense } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'

import Preloader from './components/Preloader'
import Cursor from './components/Cursor'
import ConsoleHUD from './components/ConsoleHUD'

// O mundo WebGL imersivo (R3F + materiais ricos + pós-processamento) é carregado
// de forma assíncrona para não bloquear o paint inicial — crítico para o LCP.
const ImmersiveWorld = lazy(() => import('./components/ImmersiveWorld'))
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import Manifesto from './components/Manifesto'
import Services from './components/Services'
import Catalog from './components/Catalog'
import Process from './components/Process'
import RoiDashboard from './components/RoiDashboard'
import Results from './components/Results'
import Plans from './components/Plans'
import FinalCTA from './components/FinalCTA'
import Footer from './components/Footer'
import ProjectDetail from './components/ProjectDetail'

gsap.registerPlugin(ScrollTrigger)

export default function App() {
  const reducedMotion = useMemo(
    () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    []
  )
  // Degradação de mobile (regra do gate de performance): no mobile e em
  // reduced-motion o mundo WebGL pesado NÃO é carregado — entra um fallback
  // estático. Isso mantém o Three.js fora do caminho e o Lighthouse mobile alto.
  const enable3D = useMemo(
    () =>
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches &&
      !window.matchMedia('(max-width: 767px), (pointer: coarse)').matches,
    []
  )
  const alreadyLoaded = useMemo(() => sessionStorage.getItem('aethel-preloaded') === '1', [])
  const [loaded, setLoaded] = useState(alreadyLoaded)
  const [detail, setDetail] = useState(null) // índice do projeto aberto (ou null)
  // investimento mensal — estado compartilhado entre o diagnóstico (Process) e a calculadora de retorno (RoiDashboard)
  const [invest, setInvest] = useState(8000)

  const handlePreloaderDone = useCallback(() => setLoaded(true), [])

  // Lenis + ScrollTrigger
  useEffect(() => {
    if (reducedMotion) return
    const lenis = new Lenis({ duration: 1.1, smoothWheel: true })
    window.__lenis = lenis
    lenis.on('scroll', ScrollTrigger.update)
    const tick = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)
    gsap.ticker.lagSmoothing(0)

    // âncoras internas passam pelo Lenis para não brigar com o smooth scroll
    const onAnchorClick = (e) => {
      const a = e.target.closest('a[href^="#"]')
      if (!a) return
      const target = document.querySelector(a.getAttribute('href'))
      if (!target) return
      e.preventDefault()
      lenis.scrollTo(target, { offset: -64 })
    }
    document.addEventListener('click', onAnchorClick)

    return () => {
      document.removeEventListener('click', onAnchorClick)
      gsap.ticker.remove(tick)
      lenis.destroy()
      delete window.__lenis
    }
  }, [reducedMotion])

  // refresh após fontes e primeiro paint pós-preloader
  useEffect(() => {
    if (!loaded) return
    document.fonts.ready.then(() => ScrollTrigger.refresh())
    const t = setTimeout(() => ScrollTrigger.refresh(), 600)
    return () => clearTimeout(t)
  }, [loaded])

  return (
    <>
      {!alreadyLoaded && !loaded && <Preloader onDone={handlePreloaderDone} />}

      <div className="noise-overlay" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />

      <Cursor />
      {enable3D ? (
        <Suspense fallback={null}>
          <ImmersiveWorld />
        </Suspense>
      ) : (
        <div
          aria-hidden="true"
          className="fixed inset-0 z-[0] bg-[radial-gradient(circle_at_70%_42%,rgba(224,164,88,0.13),transparent_55%)]"
        />
      )}
      {loaded && <ConsoleHUD />}
      <Navbar />

      <main>
        <Hero ready={loaded} reducedMotion={reducedMotion} />
        <Manifesto reducedMotion={reducedMotion} />
        <Services reducedMotion={reducedMotion} />
        <Catalog reducedMotion={reducedMotion} onOpenProject={setDetail} />
        <Process reducedMotion={reducedMotion} invest={invest} setInvest={setInvest} />
        <RoiDashboard invest={invest} setInvest={setInvest} />
        <Results reducedMotion={reducedMotion} />
        <Plans />
        <FinalCTA reducedMotion={reducedMotion} />
      </main>

      <Footer />

      {detail !== null && (
        <ProjectDetail index={detail} onClose={() => setDetail(null)} onNav={setDetail} />
      )}
    </>
  )
}
