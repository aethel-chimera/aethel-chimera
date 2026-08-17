import { useRef } from 'react'
import CatalogCardOverlay from './CatalogCardOverlay'

// Cinemático "catálogo vivo": a cena 3D (espadachim com a Lune Améthyste) toca
// em LOOP — o personagem gira a espada e dispara o pulso de energia ametista.
// Os cards do catálogo entram como overlay DOM (data-driven via CATALOG dentro
// de CatalogCardOverlay), sobre o lado direito da cena.
export default function Catalog({ onOpenProject, reducedMotion }) {
  const videoRef = useRef(null)

  return (
    // MOBILE: a cena é ULTRAWIDE de verdade (3072x1116 ≈ 2.75:1). Exibida
    // inteira em tela retrato ela virava uma tira de ~150px, três vezes menor
    // que o card empilhado abaixo. Aqui a caixa é 3:2 com object-cover: corta
    // só o vazio escuro das laterais (o painel LED vai de 22% a 78% da largura
    // e continua inteiro), e o personagem quase dobra de tamanho.
    // Desktop mantém a cena cheia ocupando a viewport.
    <section id="catalogo" className="relative z-[3] md:h-[100svh] overflow-hidden bg-obsidian pb-6 md:pb-0">
      <video
        ref={videoRef}
        src="/catalogo-vivo.mp4"
        poster="/catalogo-vivo-poster.jpg"
        muted
        playsInline
        preload="auto"
        autoPlay={!reducedMotion || undefined}
        loop={!reducedMotion || undefined}
        className="block aspect-[3/2] w-full object-cover object-center md:absolute md:inset-0 md:aspect-auto md:h-full md:w-full"
      />

      {/* CARD OVERLAY — card sobre a cena, data-driven via CATALOG.
          Ajuste tempos/posição em CatalogCardOverlay.jsx (LAUNCH_T / EXIT_T). */}
      <CatalogCardOverlay videoRef={videoRef} onOpenProject={onOpenProject} />
    </section>
  )
}
