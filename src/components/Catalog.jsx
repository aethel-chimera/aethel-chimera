import { useRef } from 'react'
import CatalogCardOverlay from './CatalogCardOverlay'

// Cinemático "catálogo vivo": a cena 3D (espadachim com a Lune Améthyste) toca
// em LOOP — o personagem gira a espada e dispara o pulso de energia ametista.
// Os cards do catálogo entram como overlay DOM (data-driven via CATALOG dentro
// de CatalogCardOverlay), sobre o lado direito da cena.
export default function Catalog({ onOpenProject, reducedMotion }) {
  const videoRef = useRef(null)

  return (
    // MOBILE: a cena é widescreen — em tela retrato o object-cover cortava
    // quase tudo. Aqui o vídeo aparece INTEIRO (altura automática) e o card
    // vem empilhado abaixo, em seção definida. Desktop mantém a cena cheia.
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
        className="block w-full h-auto md:absolute md:inset-0 md:h-full md:w-full md:object-cover"
      />

      {/* CARD OVERLAY — card sobre a cena, data-driven via CATALOG.
          Ajuste tempos/posição em CatalogCardOverlay.jsx (LAUNCH_T / EXIT_T). */}
      <CatalogCardOverlay videoRef={videoRef} onOpenProject={onOpenProject} />
    </section>
  )
}
