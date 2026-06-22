import { Suspense, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Lightformer, useTexture } from '@react-three/drei'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import { CATALOG } from '../data'
import { bus } from '../scrollBus'
import {
  EffectComposer,
  Bloom,
  Noise,
  Vignette,
} from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import * as THREE from 'three'

// ---------------------------------------------------------------------------
// MUNDO IMERSIVO DA AETHEL — narrativa de 3 atos coreografada pelo scroll
// (escola Active Theory / Igloo / Lusion):
//   Ato 1 (hero/CTA)  — organismo de VIDRO/cromo iridescente (transmissão real)
//   Ato 2 (manifesto→) — o vidro se desfaz em FLUIDO de partículas físicas
//                        reativo ao cursor (linhagem Lusion)
//   Ato 3 (catálogo)   — o fluido se remonta em PAINÉIS 3D flutuantes
// O elemento pesado (vidro) só renderiza onde aparece, preservando o FPS.
// ---------------------------------------------------------------------------

// peso de cada elemento + câmera por seção
const ACTS = {
  // Paleta PREMIUM (tons joia/metálico) — uma cor distinta por seção, coesa
  // com o dark/âmbar. Fluido reduzido nas seções de leitura.
  hero:       { glass: 1.0,  fluid: 0.0,  panels: 0.0, logo: 0, camZ: 6.0, color: new THREE.Color('#E0A458') }, // champagne/âmbar
  manifesto:  { glass: 0.18, fluid: 0.42, panels: 0.0, logo: 0, camZ: 5.3, color: new THREE.Color('#C9A66B') }, // bronze
  servicos:   { glass: 0.0,  fluid: 0.52, panels: 0.0, logo: 0, camZ: 6.2, color: new THREE.Color('#5FA391') }, // jade
  catalogo:   { glass: 0.0,  fluid: 0.12, panels: 1.0, logo: 0, camZ: 7.6, color: new THREE.Color('#B9AED6') }, // platina/ametista
  processo:   { glass: 0.0,  fluid: 0.48, panels: 0.0, logo: 0, camZ: 6.0, color: new THREE.Color('#9A85C4') }, // ametista
  resultados: { glass: 0.0,  fluid: 0.5,  panels: 0.0, logo: 0, camZ: 6.4, color: new THREE.Color('#C77B4A') }, // cobre
  planos:     { glass: 0.0,  fluid: 0.42, panels: 0.0, logo: 0, camZ: 6.0, color: new THREE.Color('#D9A38E') }, // rosé/cobre claro
  // clímax: as partículas se MONTAM na logo da Aethel (âmbar da marca)
  contato:    { glass: 0.0,  fluid: 1.0,  panels: 0.0, logo: 1, camZ: 5.6, color: new THREE.Color('#E0A458') },
  footer:     { glass: 0.0,  fluid: 0.9,  panels: 0.0, logo: 1, camZ: 6.2, color: new THREE.Color('#E0A458') },
}
const ORDER = Object.keys(ACTS)

// ---- Ato 1: HÉLICE ORGÂNICA (DNA) ----
// Partículas vivas (motes + poeira/nebulosa) com transições de cor COESAS
// (estilo Dogstudio): um gradiente que cicla por tons-joia e reage ao hover.
// Sem RGB genérico — a cor vem da paleta, não de aberração cromática.
const DNA_PALETTE = ['#3DDC97', '#2FB8C8', '#3A6BE0', '#7A4BD0', '#C84AA0', '#E0A458', '#E8C36B'].map(
  (c) => new THREE.Color(c)
)
const DNA_HOT_A = new THREE.Color('#E0A458')
const DNA_HOT_B = new THREE.Color('#C84AA0')

// motes suaves (núcleo + halo difuso), com hover por proximidade do cursor (tela)
const DNA_PTS_VERT = /* glsl */ `
uniform float uTime; uniform float uSize; uniform vec2 uMouse;
attribute float aH; attribute float aSize; attribute float aRand;
varying float vH; varying float vHover;
void main(){
  vH = aH;
  vec3 p = position;
  float r = aRand * 6.2831;
  p.x += sin(uTime * 0.6 + r) * 0.035;
  p.y += cos(uTime * 0.5 + r) * 0.035;
  p.z += sin(uTime * 0.45 + r) * 0.035;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vec2 ndc = clip.xy / clip.w;
  vHover = smoothstep(0.3, 0.0, distance(ndc, uMouse));
  gl_PointSize = uSize * aSize * (300.0 / -mv.z) * (1.0 + vHover * 1.3);
  gl_Position = clip;
}
`
const DNA_PTS_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity; uniform float uHover; uniform float uAlpha;
varying float vH; varying float vHover;
void main(){
  vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
  if (d > 0.5) discard;
  float core = pow(smoothstep(0.5, 0.0, d), 2.4); // núcleo brilhante
  float halo = smoothstep(0.5, 0.0, d) * 0.4;      // halo difuso (orgânico)
  float a = core + halo;
  vec3 col = mix(uColorA, uColorB, vH);             // gradiente coeso ao longo da hélice
  col *= 0.65 + vHover * 1.9 + uHover * 0.35;        // acende perto do cursor
  gl_FragColor = vec4(col, a * uOpacity * uAlpha * (0.5 + vHover));
}
`
// filamentos (fitas/degraus): gradiente coeso + seiva sutil subindo
const DNA_LINE_VERT = /* glsl */ `
attribute float aH;
varying float vH;
void main(){
  vH = aH;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const DNA_LINE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity; uniform float uTime;
varying float vH;
void main(){
  vec3 col = mix(uColorA, uColorB, vH);
  float flow = smoothstep(0.5, 0.0, abs(fract(vH * 3.0 - uTime * 0.3) - 0.5));
  col *= 0.45 + flow * 1.1;
  gl_FragColor = vec4(col, uOpacity * 0.45);
}
`

function DnaHelix({ shared }) {
  const grp = useRef()
  const tmpA = useMemo(() => new THREE.Color(), [])
  const tmpB = useMemo(() => new THREE.Color(), [])
  const c1 = useMemo(() => new THREE.Color(), [])
  const c2 = useMemo(() => new THREE.Color(), [])
  const ctr = useMemo(() => new THREE.Vector3(), [])

  const { nodeGeo, dustGeo, lineGeo, U, nodeU, dustU, lineU } = useMemo(() => {
    const LEVELS = 24
    const R = 1.05
    const STEP = 0.3
    const TWIST = 0.5
    const yMax = ((LEVELS - 1) / 2) * STEP
    const hOf = (y) => (y + yMax) / (2 * yMax)
    const A = []
    const B = []
    const nPos = []
    const nH = []
    const nSize = []
    const nRand = []
    for (let i = 0; i < LEVELS; i++) {
      const ang = i * TWIST
      const y = (i - (LEVELS - 1) / 2) * STEP
      const a = new THREE.Vector3(Math.cos(ang) * R, y, Math.sin(ang) * R)
      const b = new THREE.Vector3(Math.cos(ang + Math.PI) * R, y, Math.sin(ang + Math.PI) * R)
      A.push(a)
      B.push(b)
      ;[a, b].forEach((p, k) => {
        nPos.push(p.x, p.y, p.z)
        nH.push(hOf(p.y))
        nSize.push(k === 0 ? 1.5 : 1.2)
        nRand.push(Math.random())
      })
    }
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(nPos, 3))
    nodeGeo.setAttribute('aH', new THREE.Float32BufferAttribute(nH, 1))
    nodeGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(nSize, 1))
    nodeGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(nRand, 1))

    // poeira orgânica ao redor das fitas (nebulosa) — dá vida e realismo
    const DUST = 1400
    const dPos = []
    const dH = []
    const dSize = []
    const dRand = []
    for (let i = 0; i < DUST; i++) {
      const lvl = Math.random() * (LEVELS - 1)
      const strand = Math.random() < 0.5 ? 0 : Math.PI
      const ang = lvl * TWIST + strand
      const y = (lvl - (LEVELS - 1) / 2) * STEP
      const rr = R + (Math.random() - 0.5) * 0.4
      const jit = 0.22
      dPos.push(
        Math.cos(ang) * rr + (Math.random() - 0.5) * jit,
        y + (Math.random() - 0.5) * jit,
        Math.sin(ang) * rr + (Math.random() - 0.5) * jit
      )
      dH.push(hOf(y))
      dSize.push(0.3 + Math.random() * 0.7)
      dRand.push(Math.random())
    }
    const dustGeo = new THREE.BufferGeometry()
    dustGeo.setAttribute('position', new THREE.Float32BufferAttribute(dPos, 3))
    dustGeo.setAttribute('aH', new THREE.Float32BufferAttribute(dH, 1))
    dustGeo.setAttribute('aSize', new THREE.Float32BufferAttribute(dSize, 1))
    dustGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(dRand, 1))

    // linhas: degraus (pares de base) + as duas fitas (backbone), com altura p/ gradiente
    const lPos = []
    const lH = []
    const push = (a, b) => {
      lPos.push(a.x, a.y, a.z, b.x, b.y, b.z)
      lH.push(hOf(a.y), hOf(b.y))
    }
    for (let i = 0; i < LEVELS; i++) {
      push(A[i], B[i])
      if (i > 0) {
        push(A[i - 1], A[i])
        push(B[i - 1], B[i])
      }
    }
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lPos, 3))
    lineGeo.setAttribute('aH', new THREE.Float32BufferAttribute(lH, 1))

    // uniforms compartilhados por referência (cor/tempo iguais em motes, poeira e linhas)
    const U = {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#3DDC97') },
      uColorB: { value: new THREE.Color('#3A6BE0') },
      uOpacity: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uHover: { value: 0 },
    }
    const nodeU = { ...U, uSize: { value: 0.5 }, uAlpha: { value: 1.0 } }
    const dustU = { ...U, uSize: { value: 0.16 }, uAlpha: { value: 0.5 } }
    const lineU = { uTime: U.uTime, uColorA: U.uColorA, uColorB: U.uColorB, uOpacity: U.uOpacity }
    return { nodeGeo, dustGeo, lineGeo, U, nodeU, dustU, lineU }
  }, [])

  useFrame((state, dt) => {
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    const w = shared.current.glass // reaproveita o peso de cena do antigo "vidro"
    grp.current.visible = w > 0.02
    grp.current.scale.setScalar(0.32 + w * 0.78)
    grp.current.rotation.y += dt * 0.2
    grp.current.rotation.x = THREE.MathUtils.damp(grp.current.rotation.x, -shared.current.my * 0.28, 3, d)
    grp.current.position.x = THREE.MathUtils.damp(grp.current.position.x, shared.current.mx * 0.28, 3, d)

    U.uTime.value += dt
    const mx = shared.current.mx
    const my = -shared.current.my // NDC y aponta para cima
    U.uMouse.value.set(mx, my)
    U.uOpacity.value = THREE.MathUtils.damp(U.uOpacity.value, w, 4, d)

    // hover global: proximidade do cursor ao centro da hélice (em tela)
    grp.current.updateWorldMatrix(true, false)
    ctr.setFromMatrixPosition(grp.current.matrixWorld).project(state.camera)
    const hov = 1 - THREE.MathUtils.smoothstep(Math.hypot(ctr.x - mx, ctr.y - my), 0.12, 0.7)
    U.uHover.value = THREE.MathUtils.damp(U.uHover.value, hov, 4, d)

    // ciclo de cores COESO (paleta-joia) — transições suaves estilo Dogstudio
    const N = DNA_PALETTE.length
    const phase = U.uTime.value * 0.07
    const i0 = Math.floor(phase) % N
    const f = phase - Math.floor(phase)
    c1.copy(DNA_PALETTE[i0]).lerp(DNA_PALETTE[(i0 + 1) % N], f)
    c2.copy(DNA_PALETTE[(i0 + 3) % N]).lerp(DNA_PALETTE[(i0 + 4) % N], f)
    // hover esquenta/intensifica para o par vibrante (âmbar→magenta)
    tmpA.copy(c1).lerp(DNA_HOT_A, U.uHover.value * 0.7)
    tmpB.copy(c2).lerp(DNA_HOT_B, U.uHover.value * 0.7)
    const k = 1 - Math.exp(-3 * d)
    U.uColorA.value.lerp(tmpA, k)
    U.uColorB.value.lerp(tmpB, k)
  })

  return (
    <group ref={grp}>
      <lineSegments geometry={lineGeo}>
        <shaderMaterial
          args={[{ vertexShader: DNA_LINE_VERT, fragmentShader: DNA_LINE_FRAG, uniforms: lineU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]}
        />
      </lineSegments>
      <points geometry={dustGeo}>
        <shaderMaterial
          args={[{ vertexShader: DNA_PTS_VERT, fragmentShader: DNA_PTS_FRAG, uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]}
        />
      </points>
      <points geometry={nodeGeo}>
        <shaderMaterial
          args={[{ vertexShader: DNA_PTS_VERT, fragmentShader: DNA_PTS_FRAG, uniforms: nodeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]}
        />
      </points>
    </group>
  )
}

// ---- Ato 2: fluido de partículas físicas reativo ao cursor ----
const FLUID_VERT = /* glsl */ `
uniform float uTime; uniform vec2 uMouse; uniform float uSize; uniform float uAmp; uniform float uLogo;
attribute float aRand; attribute vec3 aLogo; varying float vR; varying float vX;
void main(){
  vec3 base = position;
  float amp = uAmp * (1.0 - uLogo * 0.93); // segura bem a forma ao virar logo
  float r = aRand * 6.2831;
  base.x += sin(uTime*0.5 + position.y*1.4 + r) * amp;
  base.y += cos(uTime*0.4 + position.x*1.4 + r) * amp;
  base.z += sin(uTime*0.45 + position.z*1.4 + r) * amp;
  // mistura da nuvem para a LOGO da marca
  vec3 p = mix(base, aLogo, uLogo);
  // repulsão do cursor (desliga quando forma a logo, para manter legível)
  vec2 toM = p.xy - uMouse * 4.2;
  float d = length(toM);
  p.xy += normalize(toM + 0.0001) * smoothstep(2.6, 0.0, d) * 1.3 * (1.0 - uLogo);
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  // ao formar a logo, pontos MENORES → silhueta densa e nítida, sem estourar
  gl_PointSize = uSize * (300.0 / -mv.z) * (0.6 + aRand*0.8) * (1.0 - uLogo*0.45);
  gl_Position = projectionMatrix * mv;
  vR = aRand;
  vX = gl_Position.x / gl_Position.w;
}
`
const FLUID_FRAG = /* glsl */ `
precision highp float;
uniform float uOpacity; uniform float uLogo; uniform vec3 uColor;
varying float vR; varying float vX;
void main(){
  vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
  if (d > 0.5) discard;
  // núcleo macio + halo enfeitado: borda suave reduz o "ruído" do chromatic
  float core = pow(smoothstep(0.5, 0.0, d), 1.9);
  float halo = pow(smoothstep(0.5, 0.0, d), 3.5);
  float a = core * 0.85 + halo * 0.15;
  // paleta premium: família tonal COESA da cor da seção
  // (sombra -> cor base -> realce champanhe quente), sem branco puro
  vec3 amber  = vec3(0.99, 0.59, 0.14);          // brasa âmbar saturada (joia)
  vec3 warm   = vec3(0.96, 0.89, 0.76);          // champanhe (não estoura no chromatic)
  vec3 darkC  = uColor * 0.5;                     // sombra da cor da seção
  vec3 lightC = mix(uColor, warm, 0.62);         // realce quente da cor
  vec3 col = mix(darkC, uColor, smoothstep(0.0, 0.45, vR));
  col = mix(col, lightC, smoothstep(0.45, 0.92, vR));
  // poucas brasas âmbar dão o acento premium sem poluir
  col = mix(col, amber, smoothstep(0.88, 1.0, vR) * 0.78);
  // ao formar a logo, converge para âmbar/champanhe (marca) e fica mais nítida
  col = mix(col, mix(warm, amber, step(0.5, vR)), uLogo * 0.8);
  float brightness = 0.40 - uLogo * 0.08;
  // área de leitura (esquerda) com menos pó = ar minimalista; normaliza ao formar a logo
  float readMask = mix(mix(0.26, 1.0, smoothstep(-0.52, 0.04, vX)), 1.0, uLogo);
  gl_FragColor = vec4(col, a * uOpacity * brightness * readMask);
}
`
function Fluid({ shared }) {
  const ref = useRef()
  const logoReady = useRef(false)
  const COUNT = 22000
  const { geo, uniforms } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const rand = new Float32Array(COUNT)
    const logo = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      // distribuição em volume esférico macio (mais contida = menos alcance no texto)
      const r = 1.25 + Math.pow(Math.random(), 0.5) * 1.45
      const a = Math.random() * Math.PI * 2
      const z = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(z) * Math.cos(a)
      pos[i * 3 + 1] = r * Math.cos(z)
      pos[i * 3 + 2] = r * Math.sin(z) * Math.sin(a)
      rand[i] = Math.random()
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    g.setAttribute('aRand', new THREE.BufferAttribute(rand, 1))
    g.setAttribute('aLogo', new THREE.BufferAttribute(logo, 3))
    const u = {
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uSize: { value: 0.12 },
      uAmp: { value: 0.4 },
      uOpacity: { value: 0 },
      uLogo: { value: 0 },
      uColor: { value: new THREE.Color('#E0A458') },
    }
    return { geo: g, uniforms: u }
  }, [])

  // amostra os pixels da logo da Aethel → posições-alvo das partículas
  useEffect(() => {
    const img = new Image()
    img.src = '/logo-mark.png'
    img.onload = () => {
      const maxW = 200
      const s = Math.min(1, maxW / img.width)
      const w = Math.max(1, Math.round(img.width * s))
      const h = Math.max(1, Math.round(img.height * s))
      const cnv = document.createElement('canvas')
      cnv.width = w
      cnv.height = h
      const c2 = cnv.getContext('2d', { willReadFrequently: true })
      c2.drawImage(img, 0, 0, w, h)
      const data = c2.getImageData(0, 0, w, h).data
      const pts = []
      let minX = w, minY = h, maxX = 0, maxY = 0
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 60) {
          pts.push(x, y)
          if (x < minX) minX = x; if (x > maxX) maxX = x
          if (y < minY) minY = y; if (y > maxY) maxY = y
        }
      }
      if (!pts.length) return
      const bh = maxY - minY || 1
      const cx = (minX + maxX) / 2
      const cy = (minY + maxY) / 2
      const k = 3.6 / bh
      const arr = geo.attributes.aLogo.array
      const n = pts.length / 2
      for (let i = 0; i < COUNT; i++) {
        const p = Math.floor(Math.random() * n) * 2
        arr[i * 3] = (pts[p] + (Math.random() - 0.5) - cx) * k
        arr[i * 3 + 1] = -(pts[p + 1] + (Math.random() - 0.5) - cy) * k
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.3
      }
      geo.attributes.aLogo.needsUpdate = true
      logoReady.current = true
    }
  }, [geo])

  useFrame((_, dt) => {
    const w = shared.current.fluid
    const d = Math.min(dt, 0.1)
    uniforms.uTime.value += dt
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, w, 4, d)
    const logoTarget = logoReady.current ? shared.current.logo : 0
    uniforms.uLogo.value = THREE.MathUtils.damp(uniforms.uLogo.value, logoTarget, 3, d)
    uniforms.uMouse.value.set(shared.current.mx, -shared.current.my)
    // cor da seção (transiciona suave entre as cores ao rolar)
    if (shared.current.color) {
      uniforms.uColor.value.r = THREE.MathUtils.damp(uniforms.uColor.value.r, shared.current.color.r, 2.5, d)
      uniforms.uColor.value.g = THREE.MathUtils.damp(uniforms.uColor.value.g, shared.current.color.g, 2.5, d)
      uniforms.uColor.value.b = THREE.MathUtils.damp(uniforms.uColor.value.b, shared.current.color.b, 2.5, d)
    }
    if (ref.current) {
      ref.current.visible = uniforms.uOpacity.value > 0.01
      // quase não gira quando está formando a logo (mantém legível)
      ref.current.rotation.y += dt * 0.03 * (1 - uniforms.uLogo.value)
    }
  })

  return (
    <points ref={ref} geometry={geo}>
      <shaderMaterial
        args={[
          {
            vertexShader: FLUID_VERT,
            fragmentShader: FLUID_FRAG,
            uniforms,
            transparent: true,
            depthWrite: false,
            depthTest: false,
            blending: THREE.AdditiveBlending,
          },
        ]}
      />
    </points>
  )
}

// ---- Ato 3: painéis 3D flutuantes (atmosféricos atrás do catálogo em DOM) ----
function Panels({ shared }) {
  const grp = useRef()
  // imagens dos projetos do catálogo como textura (os "slides lá atrás")
  const textures = useTexture(CATALOG.map((p) => p.image))
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
    })
  }, [textures])

  const N = CATALOG.length
  const ANGLE = 2.0 // rad entre cards ao redor da coluna
  const VSTEP = 2.25 // descida vertical entre cards
  const RADIUS = 3.1 // raio da espiral
  // cada tela fica num ponto da HÉLICE em torno da coluna vertebral central,
  // encarando para fora. O scroll gira e desce a hélice.
  const layout = useMemo(
    () =>
      CATALOG.map((_, i) => ({
        x: Math.sin(i * ANGLE) * RADIUS,
        y: -i * VSTEP,
        z: Math.cos(i * ANGLE) * RADIUS,
        ry: i * ANGLE,
      })),
    [N]
  )

  useFrame((_, dt) => {
    const w = shared.current.panels
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    grp.current.visible = w > 0.02
    // ESPIRAL: o scroll gira a hélice e a desce, trazendo cada card à frente
    const active = bus.catalogP * (N - 1)
    grp.current.rotation.y = THREE.MathUtils.damp(grp.current.rotation.y, -active * ANGLE, 4, d)
    grp.current.position.y = THREE.MathUtils.damp(grp.current.position.y, active * VSTEP, 4, d)
    grp.current.children.forEach((m, i) => {
      const wa = layout[i].ry + grp.current.rotation.y // ângulo no mundo
      const front = (Math.cos(wa) + 1) / 2 // 1 = de frente para a câmera
      const wy = layout[i].y + grp.current.position.y // altura no mundo
      const vFade = Math.max(0, 1 - Math.abs(wy) / (VSTEP * 2.6))
      const vis = Math.pow(front, 1.5) * vFade
      m.material.opacity = THREE.MathUtils.damp(m.material.opacity, w * vis, 6, d)
      m.material.color.setScalar(0.62 + front * 0.6)
      const edge = m.children[0]
      if (edge) edge.material.opacity = THREE.MathUtils.damp(edge.material.opacity, w * vis * 0.9, 6, d)
    })
  })

  return (
    <group ref={grp}>
      {CATALOG.map((p, i) => (
        <mesh key={p.name} position={[layout[i].x, layout[i].y, layout[i].z]} rotation={[0, layout[i].ry, 0]} scale={[3.7, 2.3, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={textures[i]} color="#cccccc" transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
          {/* moldura âmbar da tela */}
          <lineSegments>
            <edgesGeometry args={[new THREE.PlaneGeometry(1.015, 1.03)]} />
            <lineBasicMaterial color="#E0A458" transparent opacity={0} />
          </lineSegments>
        </mesh>
      ))}
    </group>
  )
}

// cor premium distinta por projeto do catálogo; a árvore (e o fundo) assumem
// a cor do projeto que está girando à frente, transicionando suavemente.
const CATALOG_COLORS = ['#E0A458', '#5FA391', '#B9AED6', '#C77B4A', '#6FA8D9', '#D98EA8'].map(
  (c) => new THREE.Color(c)
)
function catalogTint(out, p) {
  const n = CATALOG_COLORS.length
  const f = Math.max(0, Math.min(1, p)) * (n - 1)
  const i = Math.floor(f)
  const a = CATALOG_COLORS[Math.min(i, n - 1)]
  const b = CATALOG_COLORS[Math.min(i + 1, n - 1)]
  return out.copy(a).lerp(b, f - i)
}

// ---- coluna vertebral: ÁRVORE 3D (galhos com seiva luminosa subindo).
// Troca de cor conforme cada projeto do catálogo gira à frente. Recua nas
// posições frontais para não cruzar o card.
const TREE_VERT = /* glsl */ `
varying vec2 vUv; varying float vY;
void main(){
  vUv = uv; vY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const TREE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uTime; uniform float uOpacity;
varying vec2 vUv; varying float vY;
void main(){
  // forma 3D: lado iluminado/sombreado ao redor do tubo (dá volume ao galho)
  float around = vUv.x * 6.2831;
  float shade = 0.42 + 0.58 * (0.5 + 0.5 * cos(around - 1.1));
  // seiva subindo: pulso viajando ao longo do galho (vUv.y = base->ponta)
  float flow = smoothstep(0.16, 0.0, abs(fract(vUv.y * 2.2 - uTime * 0.32) - 0.5));
  float base = (0.30 + 0.08 * sin(vY * 1.6 + uTime * 0.5)) * shade;
  vec3 col = uColor * (base + flow * 1.6);
  gl_FragColor = vec4(col, uOpacity * (base * 0.9 + flow));
}
`
function Tree3D({ shared }) {
  const grp = useRef()
  const mat = useRef()
  const tips = useRef()
  const tmp = useMemo(() => new THREE.Color(), [])
  const dummy = useMemo(() => new THREE.Object3D(), [])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color('#E0A458') }, uOpacity: { value: 0 } }),
    []
  )

  const { geo, tipPts } = useMemo(() => {
    const branches = []
    const tipPts = []
    const RADIAL = 7
    const randAxis = () =>
      new THREE.Vector3(Math.random() - 0.5, (Math.random() - 0.5) * 0.3, Math.random() - 0.5).normalize()
    // tubo com AFINAMENTO real (r0 na base -> r1 na ponta) + UV.y ao longo do galho
    const taperedTube = (pts, r0, r1) => {
      const curve = new THREE.CatmullRomCurve3(pts)
      const SEG = 9
      const frames = curve.computeFrenetFrames(SEG, false)
      const position = []
      const uv = []
      const index = []
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG
        const p = curve.getPoint(t)
        const r = r0 + (r1 - r0) * t
        const N = frames.normals[i]
        const B = frames.binormals[i]
        for (let j = 0; j <= RADIAL; j++) {
          const a = (j / RADIAL) * Math.PI * 2
          const cx = Math.cos(a)
          const cy = Math.sin(a)
          position.push(p.x + (N.x * cx + B.x * cy) * r, p.y + (N.y * cx + B.y * cy) * r, p.z + (N.z * cx + B.z * cy) * r)
          uv.push(j / RADIAL, t)
        }
      }
      for (let i = 0; i < SEG; i++) {
        for (let j = 0; j < RADIAL; j++) {
          const a = i * (RADIAL + 1) + j
          const b = a + RADIAL + 1
          index.push(a, b, a + 1, b, b + 1, a + 1)
        }
      }
      const g = new THREE.BufferGeometry()
      g.setAttribute('position', new THREE.Float32BufferAttribute(position, 3))
      g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
      g.setIndex(index)
      g.computeVertexNormals()
      return g
    }
    // galho como caminho levemente curvo (gravidade/vento) com vários passos
    const grow = (origin, dir, len, rad, depth) => {
      const STEPS = 3
      const pts = [origin.clone()]
      let p = origin.clone()
      const dcur = dir.clone()
      for (let k = 1; k <= STEPS; k++) {
        dcur.y += 0.05 // leve viés para cima ao longo do galho
        dcur.x += (Math.random() - 0.5) * 0.06
        dcur.z += (Math.random() - 0.5) * 0.06
        dcur.normalize()
        p = p.clone().addScaledVector(dcur, len / STEPS)
        pts.push(p.clone())
      }
      const end = pts[pts.length - 1]
      branches.push(taperedTube(pts, rad, rad * 0.66))
      if (depth >= 5 || len < 0.45) {
        // cacho de botões/folhas luminosas na ponta (copa densa)
        const nb = 1 + Math.floor(Math.random() * 3)
        for (let b = 0; b < nb; b++) {
          tipPts.push(
            end
              .clone()
              .add(new THREE.Vector3((Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4, (Math.random() - 0.5) * 0.4))
          )
        }
        return
      }
      // galho-LÍDER continua subindo (mantém o tronco/eixo) + galhos LATERAIS
      const leader = dir.clone().applyAxisAngle(randAxis(), 0.16 + Math.random() * 0.12).normalize()
      grow(end, leader, len * 0.82, rad * 0.72, depth + 1)
      const nLat = depth < 3 ? 2 : 1
      for (let i = 0; i < nLat; i++) {
        const ang = 0.5 + Math.random() * 0.5
        const nd = dir.clone().applyAxisAngle(randAxis(), ang)
        nd.y = nd.y * 0.4 + 0.5 // lateral ainda sobe um pouco
        nd.normalize()
        grow(end, nd, len * 0.62, rad * 0.5, depth + 1)
      }
    }
    grow(new THREE.Vector3(0, -8.2, 0), new THREE.Vector3(0, 1, 0), 3.0, 0.32, 0)
    return { geo: mergeGeometries(branches, false), tipPts }
  }, [])

  useLayoutEffect(() => {
    if (!tips.current) return
    tipPts.forEach((p, i) => {
      dummy.position.copy(p)
      dummy.scale.setScalar(0.06 + Math.random() * 0.05)
      dummy.updateMatrix()
      tips.current.setMatrixAt(i, dummy.matrix)
    })
    tips.current.instanceMatrix.needsUpdate = true
  }, [tipPts, dummy])

  useFrame((_, dt) => {
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    const w = shared.current.panels
    grp.current.visible = w > 0.02
    grp.current.rotation.y += dt * 0.12
    uniforms.uTime.value += dt
    // cor = projeto ativo do catálogo (transição suave); guardada no bus p/ o fundo
    catalogTint(tmp, bus.catalogP)
    uniforms.uColor.value.r = THREE.MathUtils.damp(uniforms.uColor.value.r, tmp.r, 3, d)
    uniforms.uColor.value.g = THREE.MathUtils.damp(uniforms.uColor.value.g, tmp.g, 3, d)
    uniforms.uColor.value.b = THREE.MathUtils.damp(uniforms.uColor.value.b, tmp.b, 3, d)
    // recua perto de uma posição frontal para não cruzar o card
    const active = bus.catalogP * (CATALOG.length - 1)
    const frac = Math.abs(active - Math.round(active))
    const between = THREE.MathUtils.smoothstep(frac, 0.06, 0.4)
    const target = w * (0.18 + between * 0.82)
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, target, 5, d)
    if (tips.current) {
      tips.current.material.opacity = THREE.MathUtils.damp(tips.current.material.opacity, target * 1.1, 5, d)
      tips.current.material.color.copy(uniforms.uColor.value)
    }
  })

  return (
    <group ref={grp}>
      <mesh geometry={geo}>
        <shaderMaterial
          ref={mat}
          args={[
            {
              vertexShader: TREE_VERT,
              fragmentShader: TREE_FRAG,
              uniforms,
              transparent: true,
              depthWrite: false,
              blending: THREE.AdditiveBlending,
            },
          ]}
        />
      </mesh>
      <instancedMesh ref={tips} args={[null, null, tipPts.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#E0A458" transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
    </group>
  )
}

// sincroniza a aurora de fundo (DOM/CSS) com a cor de exibição atual (bus.tint)
function AuraSync() {
  const f = useRef(0)
  useFrame(() => {
    f.current++
    if (f.current % 8 !== 0) return
    const t = bus.tint
    const r = Math.round(t.r * 255)
    const g = Math.round(t.g * 255)
    const b = Math.round(t.b * 255)
    const root = document.documentElement.style
    root.setProperty('--aura-1', `rgba(${r}, ${g}, ${b}, 0.14)`)
    root.setProperty('--aura-2', `rgba(${g}, ${b}, ${r}, 0.09)`) // hue relacionada, deslocada
  })
  return null
}

// ambiente procedural (reflexos sem baixar HDRI)
function Studio() {
  return (
    <Environment resolution={256}>
      <Lightformer intensity={2.2} color="#E0A458" position={[4, 3, 4]} scale={[6, 6, 1]} />
      <Lightformer intensity={1.1} color="#8a9bff" position={[-5, -1, 2]} scale={[5, 5, 1]} />
      <Lightformer intensity={1.6} color="#f4f2ec" position={[0, 5, -4]} scale={[8, 3, 1]} />
      <Lightformer intensity={0.8} color="#E0A458" position={[-3, 2, -5]} scale={[4, 4, 1]} form="ring" />
    </Environment>
  )
}

// controlador: lê o alvo (act) e interpola câmera + estado compartilhado
const OBSIDIAN = new THREE.Color('#07070b')
function Director({ shared, target }) {
  const tint = useMemo(() => new THREE.Color('#E0A458'), [])
  const cat = useMemo(() => new THREE.Color(), [])
  const bg = useMemo(() => new THREE.Color(), [])
  // damp = suavização independente de frame-rate (converge no mesmo TEMPO
  // a 30 ou 144 fps), ao contrário do lerp por-frame.
  useFrame(({ camera, scene }, dt) => {
    const d = Math.min(dt, 0.1)
    const s = shared.current
    const t = target.current
    s.glass = THREE.MathUtils.damp(s.glass, t.glass, 3.5, d)
    s.fluid = THREE.MathUtils.damp(s.fluid, t.fluid, 3.5, d)
    s.panels = THREE.MathUtils.damp(s.panels, t.panels, 3.5, d)
    s.logo = THREE.MathUtils.damp(s.logo, t.logo, 3, d)
    s.camZ = THREE.MathUtils.damp(s.camZ, t.camZ, 2.5, d)
    if (t.color) {
      s.color.r = THREE.MathUtils.damp(s.color.r, t.color.r, 2.5, d)
      s.color.g = THREE.MathUtils.damp(s.color.g, t.color.g, 2.5, d)
      s.color.b = THREE.MathUtils.damp(s.color.b, t.color.b, 2.5, d)
    }
    // cor de EXIBIÇÃO: cor da seção, misturando p/ a cor do projeto no catálogo
    tint.copy(s.color)
    if (s.panels > 0.02) tint.lerp(catalogTint(cat, bus.catalogP), s.panels)
    bus.tint.r = tint.r
    bus.tint.g = tint.g
    bus.tint.b = tint.b
    // FUNDO da cena reage à cor ativa (tinta sutil sobre a obsidiana)
    bg.copy(OBSIDIAN).lerp(tint, 0.1)
    if (scene.background) scene.background.copy(bg)
    if (scene.fog) scene.fog.color.copy(OBSIDIAN).lerp(tint, 0.16)
    camera.position.x = THREE.MathUtils.damp(camera.position.x, s.mx * 0.5, 2.5, d)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, -s.my * 0.35, 2.5, d)
    camera.position.z = s.camZ
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function ImmersiveWorld() {
  const shared = useRef({ glass: 1, fluid: 0, panels: 0, logo: 0, camZ: 6, mx: 0, my: 0, color: new THREE.Color('#E0A458') })
  const target = useRef({ ...ACTS.hero })

  useEffect(() => {
    const onMove = (e) => {
      shared.current.mx = (e.clientX / window.innerWidth) * 2 - 1
      shared.current.my = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('mousemove', onMove)

    // alvo de cena pela seção ativa
    const sections = ORDER.map((id) => document.getElementById(id)).filter(Boolean)
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting && ACTS[en.target.id]) target.current = { ...ACTS[en.target.id] }
        })
      },
      { threshold: 0.45 }
    )
    sections.forEach((s) => io.observe(s))

    return () => {
      window.removeEventListener('mousemove', onMove)
      io.disconnect()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-[0]" aria-hidden="true">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 42 }}
        dpr={[1, 2]}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onCreated={() => window.dispatchEvent(new Event('chimera:ready'))}
      >
        <color attach="background" args={['#07070b']} />
        <fog attach="fog" args={['#07070b', 7, 18]} />
        <ambientLight intensity={0.15} />
        <directionalLight position={[5, 5, 5]} intensity={1.6} color="#E0A458" />
        <directionalLight position={[-5, -2, -4]} intensity={0.7} color="#6a7bd6" />
        <Studio />
        <Director shared={shared} target={target} />
        <AuraSync />
        <DnaHelix shared={shared} />
        <Fluid shared={shared} />
        <Tree3D shared={shared} />
        <Suspense fallback={null}>
          <Panels shared={shared} />
        </Suspense>
        <EffectComposer multisampling={4}>
          <Bloom intensity={0.78} luminanceThreshold={0.22} luminanceSmoothing={0.55} mipmapBlur />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.4} />
          <Vignette eskil={false} offset={0.18} darkness={0.92} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
