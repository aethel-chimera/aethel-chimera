import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import DotField from './DotField'

gsap.registerPlugin(ScrollTrigger)

const TEXT =
  'A maioria das empresas trata o site como despesa estática. Nós tratamos como ativo vivo: medido, mantido e evoluído todos os meses. Da primeira visita ao tráfego que converte, da arquitetura à manutenção, um único organismo.'

// palavras que acendem em destaque (serif)
const KEYWORDS = new Set(['ativo', 'vivo:', 'organismo.'])

// as três naturezas da Quimera — leão (face), bode (motor), serpente (cauda).
// o emblema 4:5 é o slot onde entram os renders de cada natureza.
const NATURES = [
  {
    ghost: 'leão',
    img: '/image/lion-cards.webp',
    kicker: 'a face · identidade',
    title: 'Identidade visual',
    desc: 'A cara que o mercado reconhece. Marca e sistema visual que fazem a empresa ser lembrada antes de ser comparada.',
    accent: '#E0A458',
  },
  {
    ghost: 'bode',
    img: '/image/goat-cards.webp',
    kicker: 'o motor · tráfego',
    title: 'Tráfego e performance',
    desc: 'O motor que impulsiona. Mídia paga e otimização que sobem terreno onde os outros param.',
    accent: '#C9A66B',
  },
  {
    ghost: 'serpente',
    img: '/image/snake-cards.webp',
    kicker: 'a cauda · estratégia',
    title: 'Estratégia e marketing',
    desc: 'O jogo longo. Posicionamento e a leitura precisa do momento de dar o bote, sem pressa e sem ruído.',
    accent: '#9A7BD8',
  },
]

export default function Manifesto({ reducedMotion }) {
  const rootRef = useRef(null)
  // no celular a tela é pequena e o texto passa rápido: partir de 0.28 deixava
  // a frase quase ilegível. Base mais alta no touch, sem perder o efeito.
  const baseOpacity = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches ? 0.4 : 0.28

  // acende o texto palavra a palavra. no desktop com pin; em telas menores
  // (onde os cards empilham) o pin sairia da tela, então acende no scroll normal.
  useEffect(() => {
    if (reducedMotion) return
    // O matchMedia NÃO pode ficar aninhado num gsap.context(): o revert do
    // context derrubava os registros e, no mobile, o texto ficava congelado em
    // opacity 0.28 (nenhuma palavra acendia). Padrão correto: matchMedia na
    // raiz, com escopo, e mm.revert() na limpeza.
    const mm = gsap.matchMedia(rootRef)

    // DESKTOP: pin + scrub (a seção "segura" a tela enquanto o texto acende).
    mm.add('(min-width: 1280px) and (pointer: fine)', () => {
      gsap.to('.manifesto-word', {
        opacity: 1,
        ease: 'none',
        stagger: 0.06,
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top top',
          end: '+=140%',
          pin: true,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      })
    })

    // MOBILE/TABLET: sem pin (prender a tela atrapalha o scroll por toque) —
    // o texto acende conforme a seção atravessa a viewport, no ritmo do dedo.
    mm.add('(max-width: 1279px), (pointer: coarse)', () => {
      gsap.to('.manifesto-word', {
        opacity: 1,
        ease: 'none',
        stagger: 0.03,
        scrollTrigger: {
          trigger: rootRef.current,
          start: 'top 90%',
          end: 'bottom 75%',
          scrub: 0.5,
          invalidateOnRefresh: true,
        },
      })
    })

    return () => mm.revert()
  }, [reducedMotion])

  // MOBILE (sem mouse): o tilt por cursor não existe, então o card ganha o
  // mesmo destaque por SCROLL — acende e sobe levemente quando entra no centro
  // da tela, e volta ao sair. Mesma leitura do hover, no gesto do celular.
  useEffect(() => {
    if (reducedMotion || window.matchMedia('(pointer: fine)').matches) return
    const cards = rootRef.current.querySelectorAll('.nature-card')
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          const on = e.intersectionRatio > 0.55
          e.target.style.setProperty('--rx', on ? '-3deg' : '0deg')
          e.target.style.setProperty('--mx', on ? '6px' : '0px')
          e.target.classList.toggle('is-active', on)
        })
      },
      { threshold: [0, 0.55, 1], rootMargin: '-15% 0px -15% 0px' }
    )
    cards.forEach((c) => io.observe(c))
    return () => io.disconnect()
  }, [reducedMotion])

  // tilt 3D sutil + brilho que segue o cursor em cada card (apenas mouse fino)
  useEffect(() => {
    if (reducedMotion || !window.matchMedia('(pointer: fine)').matches) return
    const cards = rootRef.current.querySelectorAll('.nature-card')
    const cleanups = []
    cards.forEach((card) => {
      const onMove = (e) => {
        const r = card.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width - 0.5
        const py = (e.clientY - r.top) / r.height - 0.5
        card.style.setProperty('--ry', (px * 6).toFixed(2) + 'deg')
        card.style.setProperty('--rx', (-py * 6).toFixed(2) + 'deg')
        card.style.setProperty('--mx', (px * 14).toFixed(1) + 'px')
        card.style.setProperty('--my', (py * 14).toFixed(1) + 'px')
      }
      const onLeave = () => {
        card.style.setProperty('--ry', '0deg')
        card.style.setProperty('--rx', '0deg')
        card.style.setProperty('--mx', '0px')
        card.style.setProperty('--my', '0px')
      }
      card.addEventListener('pointermove', onMove)
      card.addEventListener('pointerleave', onLeave)
      cleanups.push(() => {
        card.removeEventListener('pointermove', onMove)
        card.removeEventListener('pointerleave', onLeave)
      })
    })
    return () => cleanups.forEach((fn) => fn())
  }, [reducedMotion])

  return (
    <section
      id="manifesto"
      ref={rootRef}
      className="relative z-[3] min-h-[100dvh] flex flex-col px-5 md:px-10 py-24 xl:py-0 overflow-hidden"
    >
      {/* CONTEÚDO centralizado no espaço acima da faixa de onda */}
      <div className="flex-1 flex items-center w-full">
      <div className="relative z-10 w-full grid xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-12 xl:gap-16 items-center">
        {/* coluna do texto */}
        <div>
          <div className="flex items-center gap-4 mb-10">
            <span className="mono-label text-amber">[ SEC 02 ]</span>
            <span className="h-px w-12 md:w-24 bg-ivory/15" aria-hidden="true" />
            <span className="mono-label text-titanium/60">Manifesto</span>
          </div>
          <p className="font-display font-medium text-[clamp(1.5rem,3.4vw,3rem)] leading-snug text-ivory">
            {TEXT.split(' ').map((word, i) => (
              <span
                key={i}
                className={`manifesto-word inline-block mr-[0.32em] ${
                  KEYWORDS.has(word) ? 'text-amber font-serif italic' : ''
                }`}
                style={{ opacity: reducedMotion ? 1 : baseOpacity }}
              >
                {word}
              </span>
            ))}
          </p>
        </div>

        {/* coluna das três naturezas */}
        <div>
          <div className="flex items-center gap-3 mb-6">
            <span className="mono-label text-titanium/60">A Quimera · três naturezas</span>
            <span className="flow-rule h-px flex-1 bg-ivory/10" aria-hidden="true" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-4">
            {NATURES.map((n) => (
              <article key={n.ghost} className="nature-card" style={{ '--acc': n.accent }}>
                <div className="nature-emblem">
                  <img
                    src={n.img}
                    alt={`Quimera · ${n.ghost} — ${n.title}`}
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                  {/* moldura de acento que intensifica no hover */}
                  <div className="rim" aria-hidden="true" />
                </div>
                <div className="nature-body">
                  <p className="nature-kicker">{n.kicker}</p>
                  <h3 className="font-serif italic text-ivory text-[clamp(1.05rem,1.5vw,1.35rem)] leading-tight mb-1">
                    {n.title}
                  </h3>
                  <div className="nature-line" aria-hidden="true" />
                  <p className="text-titanium text-[0.82rem] leading-relaxed">{n.desc}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
      </div>

      {/* FAIXA DE ONDA no rodapé da seção — largura total (do início do texto ao
          fim dos cards), abaixo do conteúdo, como uma margem. Não sobrepõe nada
          (reservada via flex-col). Hover muda as cores. O fade das bordas é feito
          dentro do próprio canvas (laterais e base). Não bloqueia cliques/seleção. */}
      <div className="pointer-events-none relative z-0 w-full h-[clamp(110px,20vh,240px)] mt-4 xl:mt-2">
        <DotField />
      </div>
    </section>
  )
}
