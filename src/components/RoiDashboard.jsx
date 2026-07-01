import { useMemo, useState } from 'react'
import SectionHead from './SectionHead'

// ---- Calculadora de Retorno (ROI) ----
// Métrica "Índice de Retorno Aethel": o cliente define o investimento mensal e
// vê o retorno projetado por canal + ROI consolidado + payback. Multiplicadores
// baseados em benchmarks de mercado 2025–2026:
//   SEO ~7,5x · mídia paga ~2–4x (ROAS) · conteúdo/social ~3x · automação/e-mail
//   até ~40x · benchmark "bom" do setor = 5x. (Valores conservadores e mesclados.)
const CHANNELS = [
  { key: 'trafego', label: 'Gestão de Tráfego', alloc: 0.3, mult: 3.2, color: '#D6D6DA', note: 'ROAS de mídia paga otimizada (Meta / Google).' },
  { key: 'sites', label: 'Sites & SEO', alloc: 0.25, mult: 5.0, color: '#AEB2B8', note: 'Tráfego orgânico que compõe mês a mês (ativo de longo prazo).' },
  { key: 'lp', label: 'Landing Pages · CRO', alloc: 0.15, mult: 4.0, color: '#9AA0A8', note: 'Otimização de conversão: mais venda com o mesmo tráfego.' },
  { key: 'social', label: 'Social & Conteúdo', alloc: 0.15, mult: 3.0, color: '#B6B2BE', note: 'Alcance, autoridade e demanda de marca.' },
  { key: 'auto', label: 'Automações & CRM', alloc: 0.15, mult: 6.0, color: '#C8C2C6', note: 'Retenção e LTV (fluxos de e-mail/CRM — o maior retorno por R$).' },
]

const brl = (v) =>
  v >= 1000
    ? 'R$ ' + Math.round(v).toLocaleString('pt-BR')
    : 'R$ ' + Math.round(v)

export default function RoiDashboard({ invest, setInvest }) {
  const [hover, setHover] = useState(null)

  const data = useMemo(() => {
    const rows = CHANNELS.map((c) => {
      const spent = invest * c.alloc
      const ret = spent * c.mult
      return { ...c, spent, ret }
    })
    const totalReturn = rows.reduce((s, r) => s + r.ret, 0)
    const roi = totalReturn / invest // R$ de retorno por R$ 1
    const net = totalReturn - invest
    const maxRet = Math.max(...rows.map((r) => r.ret))
    return { rows, totalReturn, roi, net, maxRet }
  }, [invest])

  const active = hover ? data.rows.find((r) => r.key === hover) : null

  return (
    <section id="retorno" className="relative z-[3] px-5 md:px-10 py-32">
      <div className="relative z-10 mb-14 max-w-2xl">
        <SectionHead index="05" kicker="Investimento × retorno" title="Calculadora" accent="de retorno" className="mb-6" />
        <p className="text-titanium leading-relaxed">
          Ajuste o investimento mensal e veja o retorno projetado por canal. A métrica combina os
          serviços da Aethel em um <span className="text-ivory">Índice de Retorno</span> — quanto cada
          R$ 1 tende a devolver, com base em benchmarks de mercado.
        </p>
      </div>

      <div className="relative z-10 grid lg:grid-cols-[0.95fr_1.15fr] gap-6 lg:gap-10 items-start">
        {/* ---- Controle: investimento ---- */}
        <div className="rounded-2xl border border-ivory/12 bg-obsidian-deep/70 p-7 md:p-9">
          <label htmlFor="roi-invest" className="mono-label text-titanium/70 block mb-3">
            Investimento mensal
          </label>
          <div className="font-display font-semibold text-4xl md:text-5xl text-ivory mb-1 tabular-nums">
            {brl(invest)}
          </div>
          <p className="font-mono text-xs text-titanium/60 mb-7">por mês em operação de marketing</p>

          <input
            id="roi-invest"
            type="range"
            min={1500}
            max={50000}
            step={500}
            value={invest}
            onChange={(e) => setInvest(Number(e.target.value))}
            className="roi-range w-full"
            aria-valuetext={brl(invest) + ' por mês'}
          />
          <div className="flex justify-between mono-label text-[0.55rem] text-titanium/45 mt-3">
            <span>R$ 1.500</span>
            <span>R$ 50.000</span>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-8" role="group" aria-label="Atalhos de investimento">
            {[3000, 8000, 20000].map((v) => (
              <button
                key={v}
                onClick={() => setInvest(v)}
                className={`mono-label text-[0.6rem] rounded-full py-2.5 border transition-colors ${
                  invest === v
                    ? 'border-amber bg-amber/15 text-amber'
                    : 'border-ivory/15 text-titanium/70 hover:border-ivory/35 hover:text-ivory'
                }`}
              >
                {brl(v)}
              </button>
            ))}
          </div>
        </div>

        {/* ---- Resultado: ROI + breakdown por canal ---- */}
        <div className="rounded-2xl border border-ivory/12 bg-obsidian-deep/70 p-7 md:p-9">
          {/* indicadores principais (aria-live para acessibilidade) */}
          <div className="grid grid-cols-3 gap-4 mb-8" aria-live="polite">
            <div>
              <p className="mono-label text-[0.55rem] text-titanium/55 mb-1.5">Índice de retorno</p>
              <p className="font-display font-semibold text-3xl md:text-4xl text-signal tabular-nums leading-none">
                {data.roi.toFixed(1)}×
              </p>
              <p className="font-mono text-[0.6rem] text-titanium/55 mt-1.5">por R$ 1 investido</p>
            </div>
            <div>
              <p className="mono-label text-[0.55rem] text-titanium/55 mb-1.5">Retorno / mês</p>
              <p className="font-display font-semibold text-3xl md:text-4xl text-ivory tabular-nums leading-none">
                {brl(data.totalReturn)}
              </p>
              <p className="font-mono text-[0.6rem] text-titanium/55 mt-1.5">projeção bruta</p>
            </div>
            <div>
              <p className="mono-label text-[0.55rem] text-titanium/55 mb-1.5">Lucro / ano</p>
              <p className="font-display font-semibold text-3xl md:text-4xl text-amber tabular-nums leading-none">
                {brl(data.net * 12)}
              </p>
              <p className="font-mono text-[0.6rem] text-titanium/55 mt-1.5">retorno − investimento</p>
            </div>
          </div>

          {/* breakdown por canal — barras coloridas, reativas ao hover */}
          <div className="space-y-3.5" onMouseLeave={() => setHover(null)}>
            {data.rows.map((r) => {
              const w = (r.ret / data.maxRet) * 100
              const dim = hover && hover !== r.key
              return (
                <div
                  key={r.key}
                  onMouseEnter={() => setHover(r.key)}
                  className="cursor-default transition-opacity duration-200"
                  style={{ opacity: dim ? 0.4 : 1 }}
                >
                  <div className="flex justify-between items-baseline mb-1.5">
                    <span className="mono-label text-[0.6rem] flex items-center gap-2 text-titanium/85">
                      <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                      {r.label}
                    </span>
                    <span className="font-mono text-[0.65rem] tabular-nums" style={{ color: r.color }}>
                      {brl(r.ret)}
                      <span className="text-titanium/40"> · {r.mult.toFixed(1)}×</span>
                    </span>
                  </div>
                  <div className="relative h-2.5 rounded-full bg-ivory/[0.06] overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out"
                      style={{
                        width: `${w}%`,
                        background: `linear-gradient(90deg, ${r.color}66, ${r.color})`,
                        boxShadow: hover === r.key ? `0 0 16px ${r.color}88` : 'none',
                      }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {/* detalhe do canal em hover (acessível) */}
          <div className="mt-6 min-h-[2.4rem] text-sm leading-snug">
            {active ? (
              <p className="text-titanium">
                <span style={{ color: active.color }}>{active.label}:</span> {active.note}
              </p>
            ) : (
              <p className="text-titanium/45 font-mono text-xs">
                Passe o cursor sobre um canal para ver como ele compõe o retorno.
              </p>
            )}
          </div>
        </div>
      </div>

      <p className="mono-label text-titanium/55 mt-10 text-center max-w-3xl mx-auto leading-relaxed">
        Projeção baseada em benchmarks de mercado 2025–2026 (SEO ~7,5×, mídia paga ~2–4× de ROAS,
        automação/e-mail até ~40×). Resultados reais variam por segmento, oferta e maturidade — a
        Aethel calibra a alocação a cada mês com dados próprios.
      </p>
    </section>
  )
}
