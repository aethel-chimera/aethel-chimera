// Canal mínimo entre o catálogo (DOM, ScrollTrigger) e o mundo 3D (R3F):
// o progresso do scroll horizontal do catálogo alimenta o movimento dos
// painéis 3D do fundo, sincronizando os "slides" à rolagem.
export const bus = { catalogP: 0 }
