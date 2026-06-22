// Canal mínimo entre o catálogo (DOM, ScrollTrigger) e o mundo 3D (R3F):
// o progresso do scroll horizontal do catálogo alimenta o movimento dos
// painéis 3D do fundo, sincronizando os "slides" à rolagem.
// catalogP: progresso 0..1 do catálogo
// tint: cor de exibição atual (seção / projeto do catálogo), em 0..1 por canal,
//       lida pela árvore 3D e pela aurora de fundo (DOM) para reagirem juntas.
export const bus = { catalogP: 0, tint: { r: 0.88, g: 0.64, b: 0.35 } }
