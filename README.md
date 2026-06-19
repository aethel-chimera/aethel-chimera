# Aethel Chimera — Experiência Imersiva

Site-vitrine e catálogo vivo da Aethel Chimera. React 19 + Vite, Tailwind CSS, GSAP + ScrollTrigger, Lenis e Three.js.

## Rodar

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # build de produção em dist/
npm run preview  # serve o build localmente
```

## Onde editar o conteúdo

Todo o conteúdo editável vive em [src/data.js](src/data.js):

- `SERVICES` — os seis dossiês de serviço
- `CATALOG` — os projetos do catálogo (troque `image` pelos screenshots reais e `url` pelos links dos sites das afiliadas)
- `TESTIMONIALS`, `STATS`, `PLANS` — depoimentos, números e planos de manutenção
- `CONTACT` — e-mail e WhatsApp

## Assets

- `public/logo-white.png` — logo completa branca, fundo transparente, sem marcas d'água
- `public/logo-mark.png` — só o símbolo da quimera (favicon)
- `public/og.png` — imagem Open Graph

## Notas técnicas

- O preloader mede carga real (fontes + primeiro frame do canvas 3D) e não repete na mesma sessão (`sessionStorage`).
- A assinatura é a **quimera de partículas** ([ChimeraCore.jsx](src/components/ChimeraCore.jsx)): ~28k partículas GPU com turbulência em camadas que morfam entre **seis formas**, uma identidade por seção — núcleo, constelação, fluxo, hélice dupla, portal e a **própria logo da marca**. A forma-clímax é a logo: as posições são amostradas dos pixels de `public/logo-mark.png` em runtime, então as partículas literalmente se montam na quimera no CTA final (um scrim radial garante a leitura do título por cima). Nas seções de conteúdo as formas ficam contidas nas bordas com brilho moderado, para não competir com o texto. Glow via additive blending (sem postprocessing, preservando a transparência). O backbuffer é limitado em telas hi-DPI/largas e a contagem cai para ~11k no mobile.
- Os rótulos em mono usam um efeito **decode/scramble** ([Scramble.jsx](src/components/Scramble.jsx)) que decifra o texto ao entrar na viewport.
- `prefers-reduced-motion` desativa Lenis, pins e o 3D animado; o conteúdo permanece completo e legível.
- O catálogo horizontal pinado vira pilha vertical abaixo de 768px.
