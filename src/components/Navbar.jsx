import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { NAV_LINKS } from '../data'
import LiquidButton from './LiquidButton'
import AudioToggle from './AudioToggle'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const linksRef = useRef([])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!menuRef.current) return
    const ctx = gsap.context(() => {
      if (open) {
        document.body.style.overflow = 'hidden'
        gsap.fromTo(
          menuRef.current,
          { clipPath: 'inset(0 0 100% 0)' },
          { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power4.inOut' }
        )
        gsap.fromTo(
          linksRef.current,
          { yPercent: 110 },
          { yPercent: 0, duration: 0.7, stagger: 0.06, delay: 0.3, ease: 'power3.out' }
        )
      } else {
        document.body.style.overflow = ''
      }
    })
    return () => {
      ctx.revert()
      document.body.style.overflow = ''
    }
  }, [open])

  const closeAnd = (href) => {
    setOpen(false)
    requestAnimationFrame(() => {
      const target = document.querySelector(href)
      if (!target) return
      if (window.__lenis) window.__lenis.scrollTo(target, { offset: -64 })
      else target.scrollIntoView({ behavior: 'smooth' })
    })
  }

  return (
    <>
      <header
        className={`fixed top-0 inset-x-0 z-[100] transition-all duration-500 ${
          scrolled
            ? 'backdrop-blur-md bg-obsidian/70 border-b border-ivory/10'
            : 'bg-transparent border-b border-transparent'
        }`}
      >
        <nav className="flex items-center justify-between px-5 md:px-10 h-16" aria-label="Principal">
          {/* pílula de marca + status no estilo AT */}
          <div className="at-pill">
            <a href="#hero" className="flex items-center gap-2.5 leading-none" aria-label="Aethel Chimera — início">
              <img src="/image/logo-white.png" alt="Aethel Chimera" className="h-7 w-auto" />
              <span className="font-display font-semibold text-xl text-ivory">Æ</span>
            </a>
            <span className="connector" aria-hidden="true" />
            <span className="mono-label text-[0.6rem] text-titanium hidden sm:inline">Aethel//Chimera</span>
          </div>

          <ul className="hidden md:flex items-center gap-7">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="arrow-link">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>

          <div className="hidden md:flex items-center gap-2">
            <AudioToggle />
            {/* botão líquido compacto. O header não tem overflow-hidden, então
                o canvas do efeito pode transbordar sem ser cortado. */}
            <LiquidButton
              width={156}
              height={40}
              pad={22}
              fontSize={11}
              viscosity={8}
              approach={40}
              deform={1}
              bounce={1}
              organic={10}
              fillTime={3250}
              minSpeed={400}
              snapSpeed={1900}
              sigma={10}
              shape="pill"
              color="#C8CAD0"
              aria-label="Iniciar projeto"
              onClick={() => closeAnd('#contato')}
            >
              Iniciar projeto
            </LiquidButton>
          </div>

          <button
            className="md:hidden mono-label text-ivory"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? 'Fechar' : 'Menu'}
          </button>
        </nav>
      </header>

      {/* menu mobile fullscreen com cortina */}
      {open && (
        <div ref={menuRef} className="fixed inset-0 z-[99] bg-obsidian-deep flex flex-col justify-center px-8 md:hidden">
          <ul className="space-y-2">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} className="overflow-hidden">
                <button
                  ref={(el) => (linksRef.current[i] = el)}
                  onClick={() => closeAnd(l.href)}
                  className="flex items-baseline gap-4 text-left"
                >
                  <span className="font-mono text-xs text-amber">0{i + 1}</span>
                  <span className="font-display font-semibold text-5xl text-ivory uppercase tracking-tightest">
                    {l.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mono-label text-titanium/60 mt-16">Aethel Chimera — Engenharia de presença digital</p>
        </div>
      )}
    </>
  )
}
