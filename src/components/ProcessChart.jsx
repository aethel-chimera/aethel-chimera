import { useEffect, useRef, useState } from 'react'

// Gráficos de diagnóstico / antes→depois / crescimento, em SVG e na identidade
// da Aethel (obsidiana, âmbar, verde-sinal, mono). Animam ao entrar na viewport.

function useShown() {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setShown(true)
          io.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return [ref, shown]
}

const fmt = (v, unit = '') =>
  (Number.isInteger(v) ? String(v) : v.toFixed(1).replace('.', ',')) + unit

function Diagnostic({ chart, shown }) {
  return (
    <div className="space-y-5">
      {chart.items.map((it, i) => {
        const max = it.scaleMax || 100
        const atualW = Math.min(100, (it.atual / max) * 100)
        const metaW = Math.min(100, (it.meta / max) * 100)
        return (
          <div key={it.label}>
            <div className="flex justify-between items-baseline mb-2">
              <span className="mono-label text-[0.6rem] text-titanium/80">{it.label}</span>
              <span className="font-mono text-[0.62rem]">
                <span className="text-titanium/55">{fmt(it.atual, it.unit)}</span>
                <span className="text-titanium/30 mx-1.5">→</span>
                <span className="text-amber">meta {fmt(it.meta, it.unit)}</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-ivory/[0.07] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-titanium/30 to-titanium/55 transition-[width] duration-[1100ms] ease-out"
                style={{ width: shown ? `${atualW}%` : '0%', transitionDelay: `${i * 90}ms` }}
              />
            </div>
            <div className="relative">
              <div
                className="absolute -top-[13px] flex flex-col items-center transition-opacity duration-700"
                style={{ left: `calc(${metaW}% - 1px)`, opacity: shown ? 1 : 0, transitionDelay: `${600 + i * 90}ms` }}
              >
                <span className="w-0.5 h-3.5 bg-amber" />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BeforeAfter({ chart, shown }) {
  return (
    <div className="space-y-5">
      {chart.items.map((it, i) => {
        const max = Math.max(it.antes, it.depois) * 1.12
        const aW = (it.antes / max) * 100
        const dW = (it.depois / max) * 100
        const improved = it.lowerBetter ? it.depois < it.antes : it.depois > it.antes
        const pct = Math.round(((it.depois - it.antes) / it.antes) * 100)
        return (
          <div key={it.label}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="mono-label text-[0.6rem] text-titanium/80">{it.label}</span>
              <span className={`font-mono text-[0.6rem] ${improved ? 'text-signal' : 'text-titanium/60'}`}>
                {pct > 0 ? '+' : ''}{pct}%
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <span className="mono-label text-[0.5rem] text-titanium/40 w-11 shrink-0">antes</span>
                <div className="flex-1 h-2 rounded-full bg-ivory/[0.07] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-titanium/30 transition-[width] duration-[1100ms] ease-out"
                    style={{ width: shown ? `${aW}%` : '0%', transitionDelay: `${i * 90}ms` }}
                  />
                </div>
                <span className="font-mono text-[0.6rem] text-titanium/50 w-12 text-right shrink-0">{fmt(it.antes, it.unit)}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="mono-label text-[0.5rem] text-amber w-11 shrink-0">depois</span>
                <div className="flex-1 h-2 rounded-full bg-ivory/[0.07] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber/80 to-amber transition-[width] duration-[1100ms] ease-out"
                    style={{ width: shown ? `${dW}%` : '0%', transitionDelay: `${200 + i * 90}ms` }}
                  />
                </div>
                <span className="font-mono text-[0.6rem] text-amber w-12 text-right shrink-0">{fmt(it.depois, it.unit)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function Growth({ chart, shown }) {
  const w = 320
  const h = 140
  const pad = 26
  const max = Math.max(...chart.data) * 1.04
  const min = Math.min(...chart.data) * 0.92
  const pts = chart.data.map((v, i) => {
    const x = pad + (i / (chart.data.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / (max - min)) * (h - pad * 2)
    return [x, y]
  })
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L ${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L ${pts[0][0].toFixed(1)} ${h - pad} Z`
  return (
    <div>
      <div className="flex justify-between items-baseline mb-2">
        <span className="mono-label text-[0.6rem] text-titanium/80">{chart.caption}</span>
        <span className="font-mono text-sm text-signal">{chart.delta}</span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Crescimento ${chart.delta}`}>
        <defs>
          <linearGradient id="grow-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#E0A458" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#E0A458" stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0.5].map((g) => (
          <line key={g} x1={pad} x2={w - pad} y1={h - pad - g * (h - pad * 2)} y2={h - pad - g * (h - pad * 2)} stroke="#F4F2EC" strokeOpacity="0.06" />
        ))}
        <path d={area} fill="url(#grow-grad)" style={{ opacity: shown ? 1 : 0, transition: 'opacity 1.2s ease 0.4s' }} />
        <path
          d={line}
          fill="none"
          stroke="#E0A458"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ strokeDasharray: 700, strokeDashoffset: shown ? 0 : 700, transition: 'stroke-dashoffset 1.6s cubic-bezier(0.16,1,0.3,1)' }}
        />
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p[0]}
            cy={p[1]}
            r="3"
            fill="#0B0B10"
            stroke="#E0A458"
            strokeWidth="1.5"
            style={{ opacity: shown ? 1 : 0, transition: `opacity 0.4s ease ${0.5 + i * 0.12}s` }}
          />
        ))}
        {chart.months.map((m, i) => {
          const x = pad + (i / (chart.months.length - 1)) * (w - pad * 2)
          return (
            <text key={m} x={x} y={h - 7} textAnchor="middle" fill="#C8CAD0" fillOpacity="0.5" style={{ font: "600 8px 'JetBrains Mono', monospace", letterSpacing: '0.1em' }}>
              {m}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

export default function ProcessChart({ chart }) {
  const [ref, shown] = useShown()
  return (
    <div ref={ref}>
      <p className="mono-label text-[0.55rem] text-amber/80 mb-4">{chart.caption || 'Indicadores'}</p>
      {chart.type === 'diagnostic' && <Diagnostic chart={chart} shown={shown} />}
      {chart.type === 'beforeAfter' && <BeforeAfter chart={chart} shown={shown} />}
      {chart.type === 'growth' && <Growth chart={chart} shown={shown} />}
    </div>
  )
}
