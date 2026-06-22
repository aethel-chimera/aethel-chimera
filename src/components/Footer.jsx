import { useEffect, useState } from 'react'
import { NAV_LINKS, CONTACT } from '../data'

function BrasiliaClock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const update = () =>
      setTime(
        new Intl.DateTimeFormat('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          timeZone: 'America/Sao_Paulo',
        }).format(new Date())
      )
    update()
    const t = setInterval(update, 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="font-mono text-xs text-titanium tabular-nums">{time} BRT</span>
}

export default function Footer() {
  return (
    <footer id="rodape" className="relative z-[3] bg-gradient-to-b from-obsidian-deep/40 to-obsidian-deep/70 rounded-t-[3rem] mt-12 px-5 md:px-10 pt-20 pb-10">
      <div className="grid md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-12 mb-20">
        <div>
          <img src="/logo-white.png" alt="Aethel Chimera" className="h-28 w-auto mb-6" loading="lazy" />
          <p className="text-titanium text-sm leading-relaxed max-w-xs">
            Engenharia de presença digital. Site, tráfego, conteúdo e evolução contínua em um único
            organismo.
          </p>
        </div>

        <nav aria-label="Navegação do rodapé">
          <p className="mono-label text-titanium/70 mb-5">Navegação</p>
          <ul className="space-y-3">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="text-sm text-titanium hover:text-ivory transition-colors link-underline">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="mono-label text-titanium/70 mb-5">Redes</p>
          <ul className="space-y-3">
            {['Instagram', 'LinkedIn', 'Behance'].map((s) => (
              <li key={s}>
                <a href="#" className="text-sm text-titanium hover:text-ivory transition-colors link-underline">
                  {s}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mono-label text-titanium/70 mb-5">Contato</p>
          <ul className="space-y-3">
            <li>
              <a href={`mailto:${CONTACT.email}`} className="text-sm text-titanium hover:text-ivory transition-colors break-all link-underline">
                {CONTACT.email}
              </a>
            </li>
            <li>
              <a href={CONTACT.whatsappUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-titanium hover:text-ivory transition-colors link-underline">
                WhatsApp
              </a>
            </li>
          </ul>
          <div className="flex items-center gap-3 mt-8">
            <span className="signal-dot" aria-hidden="true" />
            <span className="mono-label text-signal">Sistemas operacionais</span>
          </div>
          <div className="mt-2">
            <BrasiliaClock />
          </div>
        </div>
      </div>

      <div className="border-t border-ivory/10 pt-8 flex flex-col md:flex-row justify-between gap-4">
        <p className="mono-label text-titanium/70">Aethel Chimera © 2026</p>
        <p className="mono-label text-titanium/70">Construído pela própria Aethel Chimera.</p>
      </div>
    </footer>
  )
}
