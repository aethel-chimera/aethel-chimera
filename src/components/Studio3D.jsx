import { Suspense, lazy, useEffect, useRef, useState } from 'react'
import SectionHead from './SectionHead'

// O viewer WebGL (three/fiber/drei) é pesado — fica num chunk à parte via lazy,
// e só monta quando a seção se aproxima da viewport (IntersectionObserver).
const Model3DViewer = lazy(() => import('./Model3DViewer'))

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
    <section id="studio3d" className="relative z-[3] px-5 md:px-10 py-32">
      <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-16 items-center">
        {/* copy */}
        <div>
          <SectionHead index="04" kicker="Diferencial · in-house" title="Modelagem" accent="& 3D" className="mb-6" />
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
              : 'Arraste para girar · roda em WebGL, carregado sob demanda.'}
          </p>
        </div>

        {/* viewer */}
        <div
          ref={holderRef}
          className="relative aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-2xl border border-ivory/12 bg-obsidian-deep/50 overflow-hidden"
        >
          {!reducedMotion && inView ? (
            <Suspense fallback={<Poster label="Carregando 3D…" />}>
              <Model3DViewer />
            </Suspense>
          ) : (
            <Poster label={reducedMotion ? 'Cena 3D · Lune Améthyste' : 'Preparando 3D…'} />
          )}

          {/* overlay HUD — não bloqueia o mouse do OrbitControls */}
          <div className="pointer-events-none absolute inset-0 z-10">
            <span className="panel-scanlines" aria-hidden="true" />
            <span className="panel-tick" style={{ top: 10, left: 10, borderTopWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
            <span className="panel-tick" style={{ top: 10, right: 10, borderTopWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
            <span className="panel-tick" style={{ bottom: 10, left: 10, borderBottomWidth: 1, borderLeftWidth: 1 }} aria-hidden="true" />
            <span className="panel-tick" style={{ bottom: 10, right: 10, borderBottomWidth: 1, borderRightWidth: 1 }} aria-hidden="true" />
            <span className="mono-label absolute bottom-3 left-4 text-[0.55rem] text-titanium/55">
              LUNE AMÉTHYSTE · BLENDER → WEBGL
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
