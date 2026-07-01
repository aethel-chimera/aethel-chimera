import { useRef } from 'react'
import CatalogCardOverlay from './CatalogCardOverlay'

// Cinemático "catálogo vivo": a cena 3D (espadachim com a Lune Améthyste) toca
// em LOOP — o personagem gira a espada e dispara o pulso de energia ametista.
// Os cards do catálogo entram como overlay DOM (data-driven via CATALOG dentro
// de CatalogCardOverlay), sobre o lado direito da cena.
export default function Catalog({ onOpenProject, reducedMotion }) {
  const videoRef = useRef(null)

  return (
    <section id="catalogo" className="relative z-[3] h-screen overflow-hidden bg-obsidian">
      <video
        ref={videoRef}
        src="/catalogo-vivo.mp4"
        poster="/catalogo-vivo-poster.jpg"
        muted
        playsInline
        preload="auto"
        autoPlay={!reducedMotion || undefined}
        loop={!reducedMotion || undefined}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* CARD OVERLAY — card sobre a cena, data-driven via CATALOG.
          Ajuste tempos/posição em CatalogCardOverlay.jsx (LAUNCH_T / EXIT_T). */}
      <CatalogCardOverlay videoRef={videoRef} onOpenProject={onOpenProject} />
    </section>
  )
}
