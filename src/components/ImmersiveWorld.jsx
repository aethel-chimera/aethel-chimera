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
  // rodapé: MESMO ato do contato → o logo fica FIXO (não encolhe nem desloca no fim)
  rodape:     { glass: 0.0,  fluid: 1.0,  panels: 0.0, logo: 1, camZ: 5.6, color: new THREE.Color('#E0A458') },
}
const ORDER = Object.keys(ACTS)

// ---- Ato 1: HÉLICE ORGÂNICA (DNA) ----
// Partículas vivas (motes + poeira/nebulosa) com transições de cor COESAS
// (estilo Dogstudio): um gradiente que cicla por tons-joia e reage ao hover.
// Sem RGB genérico — a cor vem da paleta, não de aberração cromática.
const DNA_PALETTE = ['#6A2CD0', '#9A2FD0', '#C840A0', '#B83BC8', '#7A3BD9', '#5544C0'].map(
  (c) => new THREE.Color(c)
)
const DNA_HOT_A = new THREE.Color('#E8A24E') // âmbar/ouro
const DNA_HOT_B = new THREE.Color('#C840A0') // magenta
const DNA_RUNG = new THREE.Color('#E8A24E') // degraus dourados (como na referência)

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
// TUBOS GROSSOS (fitas + degraus): volume 3D + poeira cintilante + seiva.
// vH = altura (gradiente), uv = coordenada do tubo (u em volta, v ao longo).
const TUBE_VERT = /* glsl */ `
uniform float uTime;
attribute float aH;
varying float vH; varying vec2 vUv; varying float vY;
void main(){
  vH = aH; vUv = uv; vY = position.y;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`
const TUBE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColorA; uniform vec3 uColorB; uniform float uOpacity; uniform float uTime; uniform float uHover; uniform float uSparkle;
varying float vH; varying vec2 vUv; varying float vY;
float hash(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5453); }
void main(){
  // volume: lado iluminado/sombreado ao redor do tubo
  float around = vUv.x * 6.2831;
  float shade = 0.5 + 0.5 * (0.5 + 0.5 * cos(around - 1.1));
  vec3 col = mix(uColorA, uColorB, vH);
  // poeira/glitter CONTÍNUO (cada grão pulsa suave, sem degraus = sem travar)
  vec2 cell = floor(vUv * vec2(38.0, 240.0));
  float ph = hash(cell) * 6.2831;
  float tw = 0.5 + 0.5 * sin(uTime * 3.5 + ph);
  float sparkle = smoothstep(0.72, 1.0, tw) * uSparkle;
  // seiva/luz subindo
  float flow = smoothstep(0.12, 0.0, abs(fract(vH * 3.0 - uTime * 0.22) - 0.5));
  float b = (0.55 + uHover * 0.5) * shade + flow * 0.5;
  vec3 outc = col * b + vec3(1.0, 0.88, 0.62) * sparkle * 0.9; // brilho quente nos grãos
  gl_FragColor = vec4(outc, uOpacity * (0.82 + sparkle + flow * 0.25));
}
`

function DnaHelix({ shared }) {
  const grp = useRef()
  const tmpA = useMemo(() => new THREE.Color(), [])
  const tmpB = useMemo(() => new THREE.Color(), [])
  const c1 = useMemo(() => new THREE.Color(), [])
  const c2 = useMemo(() => new THREE.Color(), [])
  const ctr = useMemo(() => new THREE.Vector3(), [])
  const beads = useRef()
  const dummy = useMemo(() => new THREE.Object3D(), [])

  const { strandGeo, rungGeo, dustGeo, beadPos, U, strandU, rungU, dustU } = useMemo(() => {
    const LEVELS = 24
    const R = 1.05
    const STEP = 0.3
    const TWIST = 0.5
    const yMax = ((LEVELS - 1) / 2) * STEP
    const hOf = (y) => (y + yMax) / (2 * yMax)
    const A = []
    const B = []
    const beadPos = []
    for (let i = 0; i < LEVELS; i++) {
      const ang = i * TWIST
      const y = (i - (LEVELS - 1) / 2) * STEP
      const a = new THREE.Vector3(Math.cos(ang) * R, y, Math.sin(ang) * R)
      const b = new THREE.Vector3(Math.cos(ang + Math.PI) * R, y, Math.sin(ang + Math.PI) * R)
      A.push(a)
      B.push(b)
      beadPos.push(a, b)
    }
    // tubo com atributo de ALTURA (aH) p/ o gradiente de cor
    const tubeH = (curve, segs, rad, radial) => {
      const g = new THREE.TubeGeometry(curve, segs, rad, radial, false)
      const pos = g.attributes.position
      const h = new Float32Array(pos.count)
      for (let i = 0; i < pos.count; i++) h[i] = hOf(pos.getY(i))
      g.setAttribute('aH', new THREE.BufferAttribute(h, 1))
      return g
    }
    // FITAS grossas (backbone) — duas hélices sólidas
    const curveA = new THREE.CatmullRomCurve3(A)
    const curveB = new THREE.CatmullRomCurve3(B)
    const strandGeo = mergeGeometries(
      [tubeH(curveA, LEVELS * 8, 0.14, 14), tubeH(curveB, LEVELS * 8, 0.14, 14)],
      false
    )
    // DEGRAUS grossos (pares de base) — barras douradas DENSAS (níveis intermediários)
    const rungs = []
    const RUNG_STEP = 0.4 // < 1 = mais barras (passo fracionário ao longo da hélice)
    for (let lvl = 0; lvl <= LEVELS - 1 + 1e-3; lvl += RUNG_STEP) {
      const ang = lvl * TWIST
      const y = (lvl - (LEVELS - 1) / 2) * STEP
      const a = new THREE.Vector3(Math.cos(ang) * R, y, Math.sin(ang) * R)
      const b = new THREE.Vector3(Math.cos(ang + Math.PI) * R, y, Math.sin(ang + Math.PI) * R)
      rungs.push(tubeH(new THREE.LineCurve3(a, b), 1, 0.045, 8))
    }
    const rungGeo = mergeGeometries(rungs, false)

    // poeira/glitter ao redor das fitas (nebulosa) — densa
    const DUST = 3200
    const dPos = []
    const dH = []
    const dSize = []
    const dRand = []
    for (let i = 0; i < DUST; i++) {
      const lvl = Math.random() * (LEVELS - 1)
      const strand = Math.random() < 0.5 ? 0 : Math.PI
      const ang = lvl * TWIST + strand
      const y = (lvl - (LEVELS - 1) / 2) * STEP
      const rr = R + (Math.random() - 0.5) * 0.5
      const jit = 0.26
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

    // uniforms — cor/tempo compartilhados por referência
    const U = {
      uTime: { value: 0 },
      uColorA: { value: new THREE.Color('#6A2CD0') },
      uColorB: { value: new THREE.Color('#C840A0') },
      uOpacity: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uHover: { value: 0 },
    }
    const strandU = {
      uTime: U.uTime,
      uColorA: U.uColorA,
      uColorB: U.uColorB,
      uOpacity: U.uOpacity,
      uHover: U.uHover,
      uSparkle: { value: 1.0 },
    }
    const rungU = {
      uTime: U.uTime,
      uColorA: { value: DNA_RUNG.clone() },
      uColorB: { value: DNA_RUNG.clone() },
      uOpacity: U.uOpacity,
      uHover: U.uHover,
      uSparkle: { value: 1.5 },
    }
    const dustU = { ...U, uSize: { value: 0.15 }, uAlpha: { value: 0.5 } }
    return { strandGeo, rungGeo, dustGeo, beadPos, U, strandU, rungU, dustU }
  }, [])

  useLayoutEffect(() => {
    if (!beads.current) return
    beadPos.forEach((p, i) => {
      dummy.position.copy(p)
      dummy.scale.setScalar(0.05 + Math.random() * 0.05)
      dummy.updateMatrix()
      beads.current.setMatrixAt(i, dummy.matrix)
    })
    beads.current.instanceMatrix.needsUpdate = true
  }, [beadPos, dummy])

  useFrame((state, dt) => {
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    const w = shared.current.glass // reaproveita o peso de cena do antigo "vidro"
    grp.current.visible = w > 0.02
    grp.current.scale.setScalar(0.32 + w * 0.78)
    grp.current.rotation.y += dt * 0.32
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

    // contas douradas acendem com o hover
    if (beads.current) {
      beads.current.material.opacity = THREE.MathUtils.damp(beads.current.material.opacity, w, 4, d)
      beads.current.material.color.copy(DNA_RUNG).multiplyScalar(0.8 + U.uHover.value * 1.6)
    }
  })

  return (
    <group ref={grp}>
      {/* fitas grossas (backbone) — sólidas, com poeira cintilante */}
      <mesh geometry={strandGeo}>
        <shaderMaterial args={[{ vertexShader: TUBE_VERT, fragmentShader: TUBE_FRAG, uniforms: strandU, transparent: true }]} />
      </mesh>
      {/* degraus dourados grossos (pares de base) */}
      <mesh geometry={rungGeo}>
        <shaderMaterial args={[{ vertexShader: TUBE_VERT, fragmentShader: TUBE_FRAG, uniforms: rungU, transparent: true }]} />
      </mesh>
      {/* poeira/nebulosa */}
      <points geometry={dustGeo}>
        <shaderMaterial
          args={[{ vertexShader: DNA_PTS_VERT, fragmentShader: DNA_PTS_FRAG, uniforms: dustU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]}
        />
      </points>
      {/* contas douradas nos nós das fitas */}
      <instancedMesh ref={beads} args={[null, null, beadPos.length]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color="#E8A24E" transparent opacity={0} toneMapped={false} blending={THREE.AdditiveBlending} depthWrite={false} />
      </instancedMesh>
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
  gl_PointSize = uSize * (300.0 / -mv.z) * (0.6 + aRand*0.8) * (1.0 - uLogo*0.18);
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
  float brightness = 0.40 + uLogo * 0.24;
  // área de leitura (esquerda) com menos pó = ar minimalista; normaliza ao formar a logo
  float readMask = mix(mix(0.26, 1.0, smoothstep(-0.52, 0.04, vX)), 1.0, uLogo);
  gl_FragColor = vec4(col, a * uOpacity * brightness * readMask);
}
`
function Fluid({ shared }) {
  const ref = useRef()
  const logoReady = useRef(false)
  const COUNT = 28000
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
      const k = 3.0 / bh
      const arr = geo.attributes.aLogo.array
      const n = pts.length / 2
      for (let i = 0; i < COUNT; i++) {
        const p = Math.floor(Math.random() * n) * 2
        arr[i * 3] = (pts[p] + (Math.random() - 0.5) - cx) * k
        arr[i * 3 + 1] = -(pts[p + 1] + (Math.random() - 0.5) - cy) * k
        arr[i * 3 + 2] = (Math.random() - 0.5) * 0.12
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
      const lg = uniforms.uLogo.value
      ref.current.visible = uniforms.uOpacity.value > 0.01
      // logo 100% ESTÁTICO: sem rotação de deriva — sempre de FRENTE e centralizado
      // (a vida vem do brilho/deriva por-partícula no shader, não do giro do grupo)
      ref.current.rotation.y = THREE.MathUtils.damp(ref.current.rotation.y, 0, 4, d)
      ref.current.position.x = THREE.MathUtils.damp(ref.current.position.x, 0, lg * 4, d)
      // altura emoldurada acima do rodapé (um pouco mais alta)
      ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, lg * 0.95, 3, d)
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

// ---- Ato 3: cada projeto do catálogo é uma FOLHA que se desprende da COPA da
// árvore, voa crescendo até virar o CARD de leitura, e depois CAI como folha. ----
const WHITE = new THREE.Color('#ffffff')
function Panels({ shared }) {
  const grp = useRef()
  const textures = useTexture(CATALOG.map((p) => p.image))
  useMemo(() => {
    textures.forEach((t) => {
      t.colorSpace = THREE.SRGBColorSpace
      t.anisotropy = 4
    })
  }, [textures])

  const N = CATALOG.length
  const tmpC = useMemo(() => new THREE.Color(), [])
  // âncora de cada folha na COPA (de onde ela se desprende) + cor da folha
  const anchors = useMemo(
    () =>
      CATALOG.map((_, i) => {
        const ang = i * 1.7 + 0.6
        return {
          cx: Math.cos(ang) * 1.7,
          cz: Math.sin(ang) * 1.7 - 0.3,
          cy: 2.2 + (i % 3) * 0.4,
          leaf: CATALOG_COLORS[i % CATALOG_COLORS.length],
        }
      }),
    [N]
  )
  // posição de LEITURA do card (à direita; as infos do projeto ficam à esquerda em DOM)
  const RX = 1.55
  const RY = 0.0
  const RZ = 2.8

  useFrame((state, dt) => {
    const w = shared.current.panels
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    const t = state.clock.elapsedTime
    grp.current.visible = w > 0.02
    const activeF = bus.catalogP * (N - 1)
    grp.current.children.forEach((m, i) => {
      const a = anchors[i]
      const prog = activeF - i // <0: ainda na copa (a chegar); 0: card; >0: já caiu
      const cardness = Math.max(0, 1 - Math.abs(prog)) // 1 = card pleno de frente
      const open = THREE.MathUtils.smoothstep(cardness, 0.12, 0.95)
      const tumble = 1 - open

      // FONTE da folha: na COPA (incoming, prog<=0) ou CAÍDA abaixo (outgoing, prog>0)
      let sx, sy, sz
      if (prog <= 0) {
        const up = Math.max(0, -prog - 1) // folhas distantes ficam mais altas/escondidas
        sx = a.cx + Math.sin(t * 0.8 + i) * 0.15
        sy = a.cy + up * 1.6 + Math.sin(t * 0.9 + i * 2.0) * 0.12
        sz = a.cz
      } else {
        sx = a.cx * 0.7 + Math.sin(t * 0.8 + i) * 0.2
        sy = -2.6 - prog * 1.7 // cai cada vez mais fundo
        sz = a.cz * 0.7
      }
      // posição = interpola da folha (copa/caída) até a leitura conforme abre
      // (amortecimento mais suave = voo da folha mais visível)
      m.position.x = THREE.MathUtils.damp(m.position.x, sx + (RX - sx) * open, 4.5, d)
      m.position.y = THREE.MathUtils.damp(m.position.y, sy + (RY - sy) * open, 4.5, d)
      m.position.z = THREE.MathUtils.damp(m.position.z, sz + (RZ - sz) * open, 4.5, d)

      // rotação: folha tomba/gira no ar → card deita de FRENTE (plano) ao abrir
      m.rotation.x = THREE.MathUtils.damp(m.rotation.x, tumble * (0.5 + Math.sin(t * 1.4 + i) * 0.7), 6, d)
      m.rotation.y = THREE.MathUtils.damp(m.rotation.y, tumble * Math.sin(t * 1.0 + i * 2.0) * 0.9, 6, d)
      m.rotation.z = THREE.MathUtils.damp(
        m.rotation.z,
        tumble * (Math.sin(t * 1.2 + i * 1.5) * 0.5 + (prog > 0 ? 0.4 : -0.2)),
        6,
        d
      )

      // escala: FOLHINHA (0.3) → tamanho de leitura
      const sc = 0.3 + open * 0.7
      m.scale.x = THREE.MathUtils.damp(m.scale.x, 3.5 * sc, 5, d)
      m.scale.y = THREE.MathUtils.damp(m.scale.y, 2.2 * sc, 5, d)

      // cor: FOLHA colorida (cor do projeto) → revela a IMAGEM (branco) ao virar card
      tmpC.copy(a.leaf).lerp(WHITE, open)
      m.material.color.lerp(tmpC, 1 - Math.exp(-8 * d))

      // opacidade: surge ao se aproximar; some quando a folha está longe/funda
      const vis = 1 - THREE.MathUtils.smoothstep(Math.abs(prog), 0.0, 1.7)
      m.material.opacity = THREE.MathUtils.damp(m.material.opacity, w * vis, 6, d)
      const edge = m.children[0]
      if (edge) edge.material.opacity = THREE.MathUtils.damp(edge.material.opacity, w * vis * open * 0.9, 6, d)
    })
  })

  return (
    <group ref={grp}>
      {CATALOG.map((p, i) => (
        <mesh key={p.name} scale={[0.3, 0.3, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial map={textures[i]} color="#E0A458" transparent opacity={0} side={THREE.DoubleSide} toneMapped={false} />
          {/* moldura âmbar do card */}
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
  // volume do tubo (lado iluminado/sombreado)
  float around = vUv.x * 6.2831;
  float shade = 0.35 + 0.65 * (0.5 + 0.5 * cos(around - 1.1));
  // CASCA amadeirada (sólida, lê a forma), com leve tinta da cor do projeto
  vec3 bark = vec3(0.17, 0.13, 0.10);
  vec3 base = mix(bark, uColor * 0.5, 0.36) * shade;
  // SEIVA: veias luminosas SUTIS subindo (acento, não listra de plasma)
  float flow = smoothstep(0.06, 0.0, abs(fract(vUv.y * 2.0 - uTime * 0.28) - 0.5));
  vec3 col = base + uColor * flow * 0.9;
  gl_FragColor = vec4(col, uOpacity);
}
`
// ---- FOLHAS da COPA: mesmos formato/cores das folhas que caem, ancoradas nas
// pontas dos galhos, balançando ao vento (copa real, não bolas de luz). ----
const CANOPY_LEAF_VERT = /* glsl */ `
uniform float uTime; uniform float uScale;
attribute vec3 aAnchor; attribute vec2 aCorner; attribute float aSeed; attribute float aTone;
varying vec2 vUv; varying float vTone;
void main(){
  vUv = aCorner + 0.5;
  vTone = aTone;
  float s = aSeed;
  vec3 pos = aAnchor;
  pos.x += sin(uTime * 1.2 + s * 6.2831) * 0.06; // balanço ao vento
  pos.y += sin(uTime * 0.9 + s * 6.2831) * 0.05;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  // billboard + leve tombo (sempre mostra a silhueta da folha)
  float a = sin(uTime * 0.6 + s * 20.0) * 0.5 + s * 6.2831;
  vec2 c = aCorner * uScale * (0.65 + fract(s * 1.7) * 0.8);
  mv.xy += vec2(c.x * cos(a) - c.y * sin(a), c.x * sin(a) + c.y * cos(a));
  gl_Position = projectionMatrix * mv;
}
`
const CANOPY_LEAF_FRAG = /* glsl */ `
precision highp float;
uniform float uOpacity;
varying vec2 vUv; varying float vTone;
void main(){
  vec2 p = vUv - 0.5;
  float r = length(vec2(p.x * 1.9, p.y));
  float leaf = 1.0 - smoothstep(0.32, 0.46, r);
  leaf *= smoothstep(0.5, 0.42, abs(p.y) + abs(p.x) * 0.6);
  if (leaf < 0.04) discard;
  vec3 laranja = vec3(0.90, 0.46, 0.12);
  vec3 tijolo  = vec3(0.68, 0.17, 0.07);
  vec3 ouro    = vec3(0.92, 0.72, 0.26);
  vec3 col = mix(tijolo, laranja, smoothstep(0.0, 0.5, vTone));
  col = mix(col, ouro, smoothstep(0.5, 1.0, vTone));
  col *= 1.0 - smoothstep(0.04, 0.0, abs(p.x)) * 0.35; // nervura central
  gl_FragColor = vec4(col, leaf * uOpacity * 0.98);
}
`
function Tree3D({ shared }) {
  const grp = useRef()
  const tmp = useMemo(() => new THREE.Color(), [])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uColor: { value: new THREE.Color('#E0A458') }, uOpacity: { value: 0 } }),
    []
  )
  const leafU = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 0.2 }, uOpacity: { value: 0 } }), [])

  const { geo, leafGeo } = useMemo(() => {
    const branches = []
    const tipPts = []
    const RADIAL = 8
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
    // tubo com PERFIL de raio livre (radiusFn(t)) — base alargada, afinamento, etc.
    const profiledTube = (pts, radiusFn, radial) => {
      const curve = new THREE.CatmullRomCurve3(pts)
      const SEG = Math.max(12, pts.length * 3)
      const frames = curve.computeFrenetFrames(SEG, false)
      const position = []
      const uv = []
      const index = []
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG
        const p = curve.getPoint(t)
        const r = radiusFn(t)
        const N = frames.normals[i]
        const B = frames.binormals[i]
        for (let j = 0; j <= radial; j++) {
          const a = (j / radial) * Math.PI * 2
          const cx = Math.cos(a)
          const cy = Math.sin(a)
          position.push(p.x + (N.x * cx + B.x * cy) * r, p.y + (N.y * cx + B.y * cy) * r, p.z + (N.z * cx + B.z * cy) * r)
          uv.push(j / radial, t)
        }
      }
      for (let i = 0; i < SEG; i++) {
        for (let j = 0; j < radial; j++) {
          const a = i * (radial + 1) + j
          const b = a + radial + 1
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
    // galho/raiz como caminho curvo (gravidade/vento) — vbias: +1 copa, -1 raiz.
    // collectTips: só a copa ganha botões/folhas luminosas.
    const grow = (origin, dir, len, rad, depth, vbias, maxDepth, collectTips) => {
      const STEPS = 3
      const pts = [origin.clone()]
      let p = origin.clone()
      const dcur = dir.clone()
      for (let k = 1; k <= STEPS; k++) {
        dcur.y += 0.06 * vbias // viés vertical ao longo do galho/raiz
        dcur.x += (Math.random() - 0.5) * 0.08
        dcur.z += (Math.random() - 0.5) * 0.08
        dcur.normalize()
        p = p.clone().addScaledVector(dcur, len / STEPS)
        pts.push(p.clone())
      }
      const end = pts[pts.length - 1]
      branches.push(taperedTube(pts, rad, rad * 0.62))
      if (depth >= maxDepth || len < 0.32) {
        if (collectTips) {
          const nb = 2 + Math.floor(Math.random() * 3) // copa densa
          for (let b = 0; b < nb; b++) {
            tipPts.push(
              end
                .clone()
                .add(new THREE.Vector3((Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.45, (Math.random() - 0.5) * 0.45))
            )
          }
        }
        return
      }
      // galho-LÍDER segue o eixo + galhos LATERAIS (ramificação)
      const leader = dir.clone().applyAxisAngle(randAxis(), 0.16 + Math.random() * 0.12).normalize()
      grow(end, leader, len * 0.8, rad * 0.7, depth + 1, vbias, maxDepth, collectTips)
      const nLat = depth < 3 ? 2 : 1
      for (let i = 0; i < nLat; i++) {
        const ang = 0.5 + Math.random() * 0.5
        const nd = dir.clone().applyAxisAngle(randAxis(), ang)
        nd.y = nd.y * 0.4 + 0.45 * vbias // lateral mantém o viés (sobe na copa, desce na raiz)
        nd.normalize()
        grow(end, nd, len * 0.6, rad * 0.5, depth + 1, vbias, maxDepth, collectTips)
      }
    }

    // ---- TRONCO ÚNICO, grosso, com BASE ALARGADA (raiz-crown) e curva orgânica
    const TRUNK_BASE_Y = -1.15
    const TRUNK_TOP_Y = 1.35
    const trunkPath = []
    const TS = 14
    for (let k = 0; k <= TS; k++) {
      const t = k / TS
      const y = TRUNK_BASE_Y + (TRUNK_TOP_Y - TRUNK_BASE_Y) * t
      const bend = Math.sin(t * Math.PI * 0.9) * 0.13 // leve curva orgânica (não torção)
      trunkPath.push(new THREE.Vector3(bend, y, Math.cos(t * Math.PI * 0.7) * 0.05))
    }
    // perfil: base ALARGADA (flare) que afina suave até o topo
    const trunkR = (t) => 0.25 + 0.42 * Math.pow(1 - t, 2.1)
    branches.push(profiledTube(trunkPath, trunkR, 14))
    const trunkTop = trunkPath[trunkPath.length - 1]
    const trunkBase = trunkPath[0]

    // ---- COPA: galhos saem de DENTRO do tronco (ponto logo abaixo do topo) e
    // GROSSOS, para fundir com o tronco sem deixar vão na junção. 1 central +
    // laterais. (A copa é a estrela da árvore.)
    const crotch = trunkPath[trunkPath.length - 2].clone() // logo abaixo do topo (junção sólida)
    grow(crotch, new THREE.Vector3(0.05, 1, 0.03).normalize(), 1.6, 0.26, 1, 1, 5, true) // líder central fecha o centro
    for (let i = 0; i < 5; i++) {
      const nd = new THREE.Vector3(0, 1, 0).applyAxisAngle(randAxis(), 0.5 + Math.random() * 0.55).normalize()
      grow(crotch, nd, 1.7, 0.24, 1, 1, 5, true)
    }

    // ---- RAÍZES orgânicas IRREGULARES: poucas, assimétricas, cada uma com seus
    // próprios nós/curvas, descendo e afinando até quase sumir. Sem simetria,
    // sem anel, sem padrão — como raiz de verdade (cada uma é diferente).
    const rootSpecs = [
      { ang: 0.35, len: 1.55, rad: 0.3, steps: 8 },
      { ang: 1.55, len: 1.05, rad: 0.21, steps: 6 },
      { ang: 2.75, len: 1.75, rad: 0.34, steps: 9 },
      { ang: 3.85, len: 1.15, rad: 0.22, steps: 6 },
      { ang: 5.15, len: 1.4, rad: 0.27, steps: 7 },
    ]
    rootSpecs.forEach((rs) => {
      const out = new THREE.Vector3(Math.cos(rs.ang), 0, Math.sin(rs.ang))
      const start = trunkBase.clone().addScaledVector(out, 0.34).add(new THREE.Vector3(0, 0.2, 0))
      const path = [start.clone()]
      let p = start.clone()
      const dir = out.clone().multiplyScalar(0.65).add(new THREE.Vector3(0, -0.6, 0)).normalize()
      for (let s = 1; s <= rs.steps; s++) {
        dir.y -= 0.08 + Math.random() * 0.08 // gravidade variável
        dir.x += (Math.random() - 0.5) * 0.42 // nós/curvas fortes e ÚNICAS (gnarl)
        dir.z += (Math.random() - 0.5) * 0.42
        dir.normalize()
        p = p.clone().addScaledVector(dir, rs.len / rs.steps)
        path.push(p.clone())
        // raiz secundária ocasional (preenche sem padrão)
        if (s === Math.round(rs.steps * 0.55) && Math.random() < 0.7) {
          const br = [p.clone()]
          let bp = p.clone()
          const bd = dir.clone().applyAxisAngle(randAxis(), 0.8).normalize()
          for (let k = 1; k <= 3; k++) {
            bd.y -= 0.12
            bd.normalize()
            bp = bp.clone().addScaledVector(bd, 0.32)
            br.push(bp.clone())
          }
          branches.push(profiledTube(br, (t) => rs.rad * 0.5 * Math.pow(1 - t, 1.6) + 0.012, 7))
        }
      }
      branches.push(profiledTube(path, (t) => rs.rad * Math.pow(1 - t, 1.7) + 0.015, 8))
    })

    // FOLHAS da copa: 2 por ponta de galho, ancoradas com leve dispersão
    const corner = []
    const anchor = []
    const seed = []
    const tone = []
    const lindex = []
    const quad = [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ]
    let q = 0
    tipPts.forEach((p) => {
      for (let l = 0; l < 2; l++) {
        const s = Math.random()
        const tn = Math.random()
        const ax = p.x + (Math.random() - 0.5) * 0.55
        const ay = p.y + (Math.random() - 0.5) * 0.55
        const az = p.z + (Math.random() - 0.5) * 0.55
        for (let v = 0; v < 4; v++) {
          corner.push(quad[v][0], quad[v][1])
          anchor.push(ax, ay, az)
          seed.push(s)
          tone.push(tn)
        }
        lindex.push(q, q + 1, q + 2, q, q + 2, q + 3)
        q += 4
      }
    })
    const leafGeo = new THREE.BufferGeometry()
    leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array((corner.length / 2) * 3), 3))
    leafGeo.setAttribute('aCorner', new THREE.Float32BufferAttribute(corner, 2))
    leafGeo.setAttribute('aAnchor', new THREE.Float32BufferAttribute(anchor, 3))
    leafGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
    leafGeo.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 1))
    leafGeo.setIndex(lindex)
    return { geo: mergeGeometries(branches, false), leafGeo }
  }, [])

  useFrame((_, dt) => {
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    const w = shared.current.panels
    grp.current.visible = w > 0.02
    grp.current.scale.setScalar(0.6)
    grp.current.position.y = -0.8 // centraliza: copa em cima E crown de raízes embaixo, ambos no quadro
    grp.current.rotation.y += dt * 0.1
    uniforms.uTime.value += dt
    leafU.uTime.value += dt
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
    leafU.uOpacity.value = THREE.MathUtils.damp(leafU.uOpacity.value, target, 5, d)
  })

  return (
    <group ref={grp}>
      {/* tronco/galhos/raízes: CASCA com seiva luminosa (sólido, não estoura) */}
      <mesh geometry={geo}>
        <shaderMaterial
          args={[{ vertexShader: TREE_VERT, fragmentShader: TREE_FRAG, uniforms, transparent: true, depthWrite: true }]}
        />
      </mesh>
      {/* COPA: folhas de verdade (mesmo formato/cores das que caem) */}
      <mesh geometry={leafGeo}>
        <shaderMaterial
          args={[{ vertexShader: CANOPY_LEAF_VERT, fragmentShader: CANOPY_LEAF_FRAG, uniforms: leafU, transparent: true, depthWrite: false, side: THREE.DoubleSide }]}
        />
      </mesh>
    </group>
  )
}

// ---- folhas de OUTONO caindo da árvore (quads que giram, balançam e caem) ----
const LEAF_VERT = /* glsl */ `
uniform float uTime; uniform float uScale;
attribute vec2 aCorner; attribute float aSeed; attribute float aTone;
varying vec2 vUv; varying float vTone; varying float vFade;
void main(){
  vUv = aCorner + 0.5;
  vTone = aTone;
  float s = aSeed;
  float x = (fract(s * 7.13) - 0.5) * 9.5;
  float z = (fract(s * 3.71) - 0.5) * 5.0 - 0.5;
  float fall = mod(uTime * 0.32 + s * 9.0, 1.0); // ciclo de queda
  float y = 4.6 - fall * 9.2;
  x += sin(uTime * 0.8 + s * 6.28) * 0.8; // vento (balanço)
  z += cos(uTime * 0.6 + s * 6.28) * 0.4;
  vFade = sin(fall * 3.14159); // some no topo e no fim da queda
  vec4 mv = modelViewMatrix * vec4(x, y, z, 1.0);
  // tombo da folha (rotação do quad no espaço da câmera)
  float a = uTime * 1.5 + s * 20.0;
  vec2 c = aCorner * uScale * (0.7 + fract(s * 1.7) * 0.7);
  mv.xy += vec2(c.x * cos(a) - c.y * sin(a), c.x * sin(a) + c.y * cos(a));
  gl_Position = projectionMatrix * mv;
}
`
const LEAF_FRAG = /* glsl */ `
precision highp float;
uniform float uOpacity;
varying vec2 vUv; varying float vTone; varying float vFade;
void main(){
  vec2 p = vUv - 0.5;
  // silhueta de folha: oval alongada e pontuda
  float r = length(vec2(p.x * 1.9, p.y));
  float leaf = 1.0 - smoothstep(0.32, 0.46, r);
  leaf *= smoothstep(0.5, 0.42, abs(p.y) + abs(p.x) * 0.6); // afina nas pontas
  if (leaf < 0.04) discard;
  vec3 laranja = vec3(0.90, 0.46, 0.12);
  vec3 tijolo  = vec3(0.68, 0.17, 0.07);
  vec3 ouro    = vec3(0.92, 0.72, 0.26);
  vec3 col = mix(tijolo, laranja, smoothstep(0.0, 0.5, vTone));
  col = mix(col, ouro, smoothstep(0.5, 1.0, vTone));
  // nervura central sutil
  col *= 1.0 - smoothstep(0.04, 0.0, abs(p.x)) * 0.35;
  gl_FragColor = vec4(col, leaf * uOpacity * vFade * 0.95);
}
`
function FallingLeaves({ shared }) {
  const ref = useRef()
  const uniforms = useMemo(() => ({ uTime: { value: 0 }, uScale: { value: 0.16 }, uOpacity: { value: 0 } }), [])
  const geo = useMemo(() => {
    const N = 130
    const corner = []
    const seed = []
    const tone = []
    const index = []
    const quad = [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ]
    for (let i = 0; i < N; i++) {
      const s = Math.random()
      const tn = Math.random()
      for (let v = 0; v < 4; v++) {
        corner.push(quad[v][0], quad[v][1])
        seed.push(s)
        tone.push(tn)
      }
      const o = i * 4
      index.push(o, o + 1, o + 2, o, o + 2, o + 3)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('aCorner', new THREE.Float32BufferAttribute(corner, 2))
    g.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
    g.setAttribute('aTone', new THREE.Float32BufferAttribute(tone, 1))
    g.setIndex(index)
    // position dummy (o vertex shader calcula tudo a partir de aSeed/aCorner)
    g.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 4 * 3), 3))
    return g
  }, [])

  useFrame((_, dt) => {
    if (!ref.current) return
    const d = Math.min(dt, 0.1)
    const w = shared.current.panels
    ref.current.visible = w > 0.02
    uniforms.uTime.value += dt
    uniforms.uOpacity.value = THREE.MathUtils.damp(uniforms.uOpacity.value, w, 4, d)
  })

  return (
    <mesh ref={ref} geometry={geo} frustumCulled={false}>
      <shaderMaterial
        args={[{ vertexShader: LEAF_VERT, fragmentShader: LEAF_FRAG, uniforms, transparent: true, depthWrite: false, side: THREE.DoubleSide }]}
      />
    </mesh>
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

// ---- SISTEMA NERVOSO: malha de neurônios + sinapses com sinais viajando, ao
// longo da página INTEIRA. Compartilha a cor da seção (organismo coeso), reage
// ao cursor (sinapses disparam perto dele) e PULSA nas transições de seção.
// (Camada atmosférica nova — NÃO altera o DNA, convive com as demais animações.)
const NEURO_LINE_VERT = /* glsl */ `
uniform vec2 uMouse;
attribute float aProg; attribute float aSeed;
varying float vProg; varying float vSeed; varying float vHover;
void main(){
  vProg = aProg; vSeed = aSeed;
  vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  vHover = smoothstep(0.45, 0.0, distance(clip.xy / clip.w, uMouse));
  gl_Position = clip;
}
`
const NEURO_LINE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uOpacity; uniform float uTime; uniform float uPulse;
varying float vProg; varying float vSeed; varying float vHover;
void main(){
  // impulso nervoso viajando pela sinapse
  float sp = fract(uTime * 0.22 + vSeed);
  float pulse = smoothstep(0.12, 0.0, abs(vProg - sp));
  float base = 0.045 + vHover * 0.28 + uPulse * 0.22;
  vec3 col = uColor * (base + pulse * (1.1 + vHover * 2.2 + uPulse * 1.5));
  gl_FragColor = vec4(col, uOpacity * (base + pulse));
}
`
const NEURO_NODE_VERT = /* glsl */ `
uniform float uTime; uniform float uSize; uniform vec2 uMouse;
attribute float aRand;
varying float vHover;
void main(){
  vec3 p = position;
  p.x += sin(uTime * 0.4 + aRand * 6.2831) * 0.13;
  p.y += cos(uTime * 0.33 + aRand * 6.2831) * 0.13;
  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  vec4 clip = projectionMatrix * mv;
  vHover = smoothstep(0.4, 0.0, distance(clip.xy / clip.w, uMouse));
  // tamanho SEGURO (divisor e máximo clampados — evita gl_PointSize gigante que
  // alguns drivers recusam, corrompendo o resto do frame)
  gl_PointSize = clamp(uSize * (300.0 / max(0.6, -mv.z)) * (0.5 + aRand) * (1.0 + vHover * 2.2), 1.0, 36.0);
  gl_Position = clip;
}
`
const NEURO_NODE_FRAG = /* glsl */ `
precision highp float;
uniform vec3 uColor; uniform float uOpacity; uniform float uPulse;
varying float vHover;
void main(){
  vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
  if (d > 0.5) discard;
  float core = pow(smoothstep(0.5, 0.0, d), 2.0);
  float b = 0.35 + vHover * 2.2 + uPulse * 0.6;
  gl_FragColor = vec4(uColor * b, core * uOpacity * (0.45 + vHover + uPulse * 0.5));
}
`
function NervousSystem({ shared }) {
  const grp = useRef()
  const prevCol = useMemo(() => new THREE.Color('#E0A458'), [])

  const { nodeGeo, lineGeo, U, nodeU, lineU } = useMemo(() => {
    const N = 130
    const pts = []
    const rand = []
    for (let i = 0; i < N; i++) {
      pts.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 14,
          (Math.random() - 0.5) * 9,
          (Math.random() - 0.5) * 3 - 0.5
        )
      )
      rand.push(Math.random())
    }
    const nodeGeo = new THREE.BufferGeometry()
    nodeGeo.setAttribute('position', new THREE.Float32BufferAttribute(pts.flatMap((p) => [p.x, p.y, p.z]), 3))
    nodeGeo.setAttribute('aRand', new THREE.Float32BufferAttribute(rand, 1))
    // sinapses: cada neurônio liga aos 2 vizinhos mais próximos (sem distâncias enormes)
    const edges = new Set()
    pts.forEach((a, i) => {
      const near = pts
        .map((b, j) => [j, a.distanceToSquared(b)])
        .filter(([j]) => j !== i)
        .sort((p, q) => p[1] - q[1])
      for (let n = 0; n < 2; n++) {
        const j = near[n][0]
        if (near[n][1] < 12) edges.add(i < j ? `${i}_${j}` : `${j}_${i}`)
      }
    })
    const lpos = []
    const prog = []
    const seed = []
    edges.forEach((e) => {
      const [i, j] = e.split('_').map(Number)
      const a = pts[i]
      const b = pts[j]
      lpos.push(a.x, a.y, a.z, b.x, b.y, b.z)
      prog.push(0, 1)
      const s = Math.random()
      seed.push(s, s)
    })
    const lineGeo = new THREE.BufferGeometry()
    lineGeo.setAttribute('position', new THREE.Float32BufferAttribute(lpos, 3))
    lineGeo.setAttribute('aProg', new THREE.Float32BufferAttribute(prog, 1))
    lineGeo.setAttribute('aSeed', new THREE.Float32BufferAttribute(seed, 1))
    const U = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color('#E0A458') },
      uOpacity: { value: 0 },
      uMouse: { value: new THREE.Vector2() },
      uPulse: { value: 0 },
    }
    const nodeU = { ...U, uSize: { value: 0.16 } }
    const lineU = U
    return { nodeGeo, lineGeo, U, nodeU, lineU }
  }, [])

  useFrame((_, dt) => {
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    U.uTime.value += dt
    U.uMouse.value.set(shared.current.mx, -shared.current.my)
    // leve parallax do conjunto seguindo o cursor (profundidade)
    grp.current.position.x = THREE.MathUtils.damp(grp.current.position.x, shared.current.mx * 0.5, 2.5, d)
    grp.current.position.y = THREE.MathUtils.damp(grp.current.position.y, -shared.current.my * 0.35, 2.5, d)
    // cor da seção (organismo coeso com as demais animações)
    const c = shared.current.color
    U.uColor.value.r = THREE.MathUtils.damp(U.uColor.value.r, c.r, 2.5, d)
    U.uColor.value.g = THREE.MathUtils.damp(U.uColor.value.g, c.g, 2.5, d)
    U.uColor.value.b = THREE.MathUtils.damp(U.uColor.value.b, c.b, 2.5, d)
    // PULSO de transição: dispara quando a cor da seção muda (troca de seção)
    // (guarda contra dt=0 → evita NaN que corromperia o framebuffer aditivo)
    const vel = (Math.abs(c.r - prevCol.r) + Math.abs(c.g - prevCol.g) + Math.abs(c.b - prevCol.b)) / Math.max(d, 0.001)
    prevCol.copy(c)
    const pulseTarget = Math.min(1, vel * 2.6)
    U.uPulse.value = THREE.MathUtils.damp(U.uPulse.value, Number.isFinite(pulseTarget) ? pulseTarget : 0, 4, d)
    // presente na página inteira (opacidade-base sutil constante)
    U.uOpacity.value = THREE.MathUtils.damp(U.uOpacity.value, 0.6, 3, d)
  })

  return (
    <group ref={grp} renderOrder={-1}>
      <lineSegments geometry={lineGeo} renderOrder={-1}>
        <shaderMaterial
          args={[{ vertexShader: NEURO_LINE_VERT, fragmentShader: NEURO_LINE_FRAG, uniforms: lineU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]}
        />
      </lineSegments>
      <points geometry={nodeGeo} renderOrder={-1}>
        <shaderMaterial
          args={[{ vertexShader: NEURO_NODE_VERT, fragmentShader: NEURO_NODE_FRAG, uniforms: nodeU, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }]}
        />
      </points>
    </group>
  )
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
        <NervousSystem shared={shared} />
        <DnaHelix shared={shared} />
        <Fluid shared={shared} />
        <Tree3D shared={shared} />
        <FallingLeaves shared={shared} />
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
