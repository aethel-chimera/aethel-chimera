import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import SectionHead from './SectionHead'

// O viewer WebGL (three/fiber/drei) é pesado — fica num chunk à parte via lazy,
// e só monta quando a seção se aproxima da viewport (IntersectionObserver).
const Model3DViewer = lazy(() => import('./Model3DViewer'))

// ---------------------------------------------------------------------------
// GALERIA DA VITRINE 3D — para adicionar um modelo novo: solte o .glb em
// public/models/ e preencha `src` (e o nome/tag) num dos slots abaixo.
// Slots com src:null aparecem como "em produção" (moldura tracejada), já
// reservando o espaço no layout.
// ---------------------------------------------------------------------------
const MODELS = [
  { id: 'lune', name: 'Lune Améthyste', tag: 'personagem · animado', src: '/models/lune-amethyste.glb' },
  { id: 'slot-2', name: 'próxima peça', tag: 'slot · em produção', src: null },
  { id: 'slot-3', name: 'próxima peça', tag: 'slot · em produção', src: null },
]

const POINTS = [
  'Modelagem e texturização PBR no Blender — nada de banco de imagens',
  'Personagens e mascotes próprios (a Quimera nasce aqui)',
  'Produto 3D que o cliente gira, explora e configura no navegador',
  'Páginas imersivas em WebGL — otimizadas para carregar leve',
]

function Poster({ label }) {
  return (
    <div className="absolute inset-0 grid place-items-center">
      <img src="/catalogo-vivo-poster.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-40" />
      <span className="relative mono-label text-[0.6rem] text-titanium/70">{label}</span>
    </div>
  )
}

export default function Studio3D({ reducedMotion }) {
  const holderRef = useRef(null)
  const [inView, setInView] = useState(false)
  const [active, setActive] = useState(0)
  const model = MODELS[active]

  useEffect(() => {
    if (reducedMotion) return
    const el = holderRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '250px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [reducedMotion])

  return (
    <section id="studio3d" className="relative z-[3] px-5 md:px-10 py-20 md:py-32">
      {/* max-w segura o layout em telas ultrawide — antes o painel esticava a
          ponto de o modelo sair do enquadramento */}
      <div className="mx-auto w-full max-w-[86rem] grid lg:grid-cols-[0.95fr_1.05fr] gap-10 lg:gap-16 items-center">
        {/* copy */}
        <div>
          <SectionHead index="05" kicker="Diferencial · in-house" title="Modelagem" accent="& 3D" className="mb-6" />
          <p className="text-titanium leading-relaxed mb-8 max-w-xl">
            Enquanto agências montam páginas com banco de imagens, a Aethel{' '}
            <span className="text-ivory">modela os próprios ativos em 3D</span> — mascotes, produtos
            e cenas exclusivas, e experiências imersivas em WebGL que ninguém consegue copiar. O
            modelo ao lado roda em tempo real, aqui no seu navegador.
          </p>
          <ul className="space-y-3 mb-10">
            {POINTS.map((p) => (
              <li key={p} className="flex gap-3 text-sm text-titanium/85 leading-snug">
                <span className="text-amber mt-px shrink-0" aria-hidden="true">+</span>
                {p}
              </li>
            ))}
          </ul>
          <p className="mono-label text-[0.6rem] text-titanium/45">
            {reducedMotion
              ? 'Render estático (movimento reduzido ativado).'
              : (window.matchMedia('(pointer: coarse)').matches ? 'Gire com DOIS dedos · um dedo rola a página.' : 'Arraste para girar · roda em WebGL, carregado sob demanda.')}
          </p>
        </div>

        {/* VITRINE: moldura no design system (barra de identificação + ticks +
            scanlines + linha duotone) com altura CONTROLADA por breakpoint —
            o enquadramento não depende mais da largura da tela. */}
        <div className="w-full lg:max-w-[640px] lg:justify-self-end">
          <div className="relative rounded-2xl border border-ivory/12 bg-obsidian-deep/60 overflow-hidden">
            {/* barra de identificação */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-ivory/10">
              <span className="mono-label text-[0.55rem] text-titanium/75 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-amber" aria-hidden="true" />
                Vitrine 3D · {model.name}
              </span>
              <span className="mono-label text-[0.5rem] text-titanium/40 hidden sm:inline">glb · tempo real</span>
            </div>

            {/* palco do modelo */}
            <div ref={holderRef} className="relative h-[340px] sm:h-[420px] lg:h-[500px]">
              {!reducedMotion && inView ? (
                <Suspense fallback={<Poster label="Carregando 3D…" />}>
                  {/* key remonta o canvas ao trocar de modelo (re-enquadra) */}
                  <Model3DViewer key={model.id} src={model.src} />
                </Suspense>
              ) : (
                <Poster label={reducedMotion ? `Cena 3D · ${model.name}` : 'Preparando 3D…'} />
              )}

              {/* overlay HUD — não bloqueia o mouse do OrbitControls */}
              <div className="pointer-events-none absolute inset-0 z-10">
                <span className="panel-scanlines" aria-hidden="true" />
                <span className="panel-tick" style={{ top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
                <span className="panel-tick" style={{ top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
                <span className="panel-tick" style={{ bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
                <span className="panel-tick" style={{ bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
                <span className="mono-label absolute bottom-3 left-4 text-[0.55rem] text-titanium/55 uppercase">
                  {model.name} · Blender → WebGL
                </span>
              </div>
            </div>

            {/* linha duotone da marca (âmbar → violeta) */}
            <div className="h-px bg-gradient-to-r from-amber/70 via-violet/60 to-transparent" aria-hidden="true" />

            {/* seletor de modelos — slots vazios já reservam o espaço das
                próximas peças, na mesma linguagem dos emblemas da Quimera */}
            <div className="grid grid-cols-3 gap-2 p-3">
              {MODELS.map((m, i) =>
                m.src ? (
                  <button
                    key={m.id}
                    onClick={() => setActive(i)}
                    aria-pressed={i === active}
                    className={`rounded-lg border px-3 py-2.5 text-left transition-colors ${
                      i === active
                        ? 'border-amber/70 bg-amber/10'
                        : 'border-ivory/12 hover:border-ivory/30'
                    }`}
                  >
                    <span className="mono-label block text-[0.5rem] text-amber mb-1">{m.tag}</span>
                    <span className="font-display text-xs text-ivory">{m.name}</span>
                  </button>
                ) : (
                  <div key={m.id} className="rounded-lg border border-dashed border-ivory/12 px-3 py-2.5" aria-hidden="true">
                    <span className="mono-label block text-[0.5rem] text-titanium/35 mb-1">{m.tag}</span>
                    <span className="font-serif italic text-xs text-titanium/40">{m.name}</span>
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
