import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { NAV_LINKS, CONTACT, waLink } from '../data'
import PixelButton from './PixelButton'
import AudioToggle from './AudioToggle'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const menuRef = useRef(null)
  const linksRef = useRef([])
  const closingRef = useRef(false)

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

  // fecha com a animação de abrir ao contrário: as palavras sobem e a cortina
  // recolhe; só no fim o menu sai da página (antes sumia na hora)
  const closeMenu = (then) => {
    const menu = menuRef.current
    if (!menu || closingRef.current) return
    closingRef.current = true
    gsap
      .timeline({
        onComplete: () => {
          closingRef.current = false
          setOpen(false)
          then?.()
        },
      })
      .to(linksRef.current.filter(Boolean), { yPercent: -110, duration: 0.35, stagger: 0.04, ease: 'power3.in' })
      .to(menu, { clipPath: 'inset(0 0 100% 0)', duration: 0.6, ease: 'power4.inOut' }, '-=0.15')
  }

  const closeAnd = (href) =>
    closeMenu(() =>
      requestAnimationFrame(() => {
        const target = document.querySelector(href)
        if (!target) return
        if (window.__lenis) window.__lenis.scrollTo(target, { offset: -64 })
        else target.scrollIntoView({ behavior: 'smooth' })
      })
    )

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
            <a href="#hero" className="flex items-center gap-2 leading-none" aria-label="Aethel Chimera - início">
              <img src="/image/logo-mark.webp" alt="Aethel Chimera" width="23" height="24" className="h-6 w-auto" />
              <span className="font-display font-semibold text-lg text-ivory">Æ</span>
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
            <PixelButton size="xs" href={CONTACT.whatsappUrl} aria-label="Iniciar projeto pelo WhatsApp">
              Iniciar projeto
            </PixelButton>
          </div>

          <PixelButton
            variant="dark"
            size="sm"
            className="md:!hidden"
            onClick={() => (open ? closeMenu() : setOpen(true))}
            aria-expanded={open}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          >
            {open ? 'Fechar' : 'Menu'}
          </PixelButton>
        </nav>
      </header>

      {/* menu mobile fullscreen com cortina */}
      {open && (
        <div ref={menuRef} className="fixed inset-0 z-[120] bg-obsidian-deep flex flex-col justify-center px-8 md:hidden">
          {/* o overlay agora cobre o header, então precisa do seu próprio
              controle de fechar (o toggle do header fica por baixo) */}
          <PixelButton
            variant="dark"
            size="sm"
            className="!absolute top-3 right-5"
            onClick={() => closeMenu()}
            aria-label="Fechar menu"
          >
            Fechar
          </PixelButton>
          <ul className="space-y-2">
            {NAV_LINKS.map((l, i) => (
              <li key={l.href} className="overflow-hidden">
                <button
                  ref={(el) => (linksRef.current[i] = el)}
                  onClick={() => closeAnd(l.href)}
                  className="flex items-baseline gap-4 text-left"
                >
                  {/* largura fixa: os algarismos da Termina têm larguras diferentes */}
                  <span className="font-mono text-xs text-amber w-6 shrink-0 tabular-nums">0{i + 1}</span>
                  <span className="font-display font-semibold text-[clamp(2rem,11vw,3rem)] text-ivory uppercase tracking-tightest">
                    {l.label}
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {/* CONTATOS no menu mobile: no celular o menu é o caminho principal
              de ação - WhatsApp abre o app com a mensagem pronta, o e-mail
              abre o cliente de e-mail e o Instagram vai pro perfil. */}
          <div className="mt-12 border-t border-ivory/10 pt-6 space-y-3">
            <p className="mono-label text-titanium/50 text-[0.55rem]">Falar agora</p>
            {CONTACT.phones.map((p) => (
              <a
                key={p.e164}
                href={waLink(p.e164)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => closeMenu()}
                className="flex items-center gap-3 text-ivory text-base"
              >
                <span className="text-amber" aria-hidden="true">↗</span>
                WhatsApp {p.label}
              </a>
            ))}
            <a
              href={CONTACT.emailUrl}
              onClick={() => closeMenu()}
              className="flex items-center gap-3 text-titanium text-sm break-all"
            >
              <span className="text-amber" aria-hidden="true">↗</span>
              {CONTACT.email}
            </a>
            <a
              href={CONTACT.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => closeMenu()}
              className="flex items-center gap-3 text-titanium text-sm"
            >
              <span className="text-amber" aria-hidden="true">↗</span>
              Instagram {CONTACT.instagram}
            </a>
          </div>

          <p className="mono-label text-titanium/60 mt-10">Aethel Chimera - Engenharia de presença digital</p>
        </div>
      )}
    </>
  )
}
