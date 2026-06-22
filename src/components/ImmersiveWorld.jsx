import { Suspense, useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import {
  MeshTransmissionMaterial,
  Environment,
  Lightformer,
  Float,
  useTexture,
} from '@react-three/drei'
import { CATALOG } from '../data'
import { bus } from '../scrollBus'
import {
  EffectComposer,
  Bloom,
  ChromaticAberration,
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

// ---- Ato 1: organismo de vidro ----
function Glass({ shared }) {
  const ref = useRef()
  const grp = useRef()
  useFrame((_, dt) => {
    const w = shared.current.glass
    if (grp.current) {
      grp.current.visible = w > 0.02
      const s = 0.2 + w * 1.0
      grp.current.scale.setScalar(s)
    }
    const m = ref.current
    if (!m) return
    const d = Math.min(dt, 0.1)
    m.rotation.y += dt * 0.12
    m.rotation.x = THREE.MathUtils.damp(m.rotation.x, -shared.current.my * 0.35, 4, d)
    m.position.x = THREE.MathUtils.damp(m.position.x, shared.current.mx * 0.4, 4, d)
  })
  return (
    <group ref={grp}>
      <Float speed={1.4} rotationIntensity={0.5} floatIntensity={0.7}>
        <mesh ref={ref}>
          <icosahedronGeometry args={[1.55, 6]} />
          <MeshTransmissionMaterial
            samples={4}
            resolution={256}
            transmission={1}
            thickness={1.4}
            roughness={0.08}
            ior={1.42}
            chromaticAberration={0.7}
            anisotropy={0.3}
            distortion={0.4}
            distortionScale={0.5}
            temporalDistortion={0.15}
            iridescence={1}
            iridescenceIOR={1.3}
            iridescenceThicknessRange={[120, 520]}
            color="#cdb79a"
            attenuationColor="#E0A458"
            attenuationDistance={1.8}
            clearcoat={1}
            clearcoatRoughness={0.12}
            background={new THREE.Color('#07070b')}
          />
        </mesh>
      </Float>
    </group>
  )
}

// ---- Ato 2: fluido de partículas físicas reativo ao cursor ----
const FLUID_VERT = /* glsl */ `
uniform float uTime; uniform vec2 uMouse; uniform float uSize; uniform float uAmp; uniform float uLogo;
attribute float aRand; attribute vec3 aLogo; varying float vR;
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
}
`
const FLUID_FRAG = /* glsl */ `
precision highp float;
uniform float uOpacity; uniform float uLogo; uniform vec3 uColor;
varying float vR;
void main(){
  vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
  if (d > 0.5) discard;
  float a = pow(smoothstep(0.5, 0.0, d), 1.4);
  // mistura tri-cor: marfim + a cor da seção (muda ao rolar) + âmbar
  vec3 ivory = vec3(0.957, 0.949, 0.925);
  vec3 amber = vec3(0.95, 0.66, 0.32);
  vec3 col;
  if (vR < 0.40) col = ivory;
  else if (vR < 0.74) col = uColor;
  else col = amber;
  // ao formar a logo, converge para âmbar/marfim (marca) e fica mais nítida
  col = mix(col, mix(ivory, amber, step(0.5, vR)), uLogo * 0.8);
  // alpha por partícula MENOR ao formar a logo; a densidade (22k) dá a nitidez
  float brightness = 0.42 - uLogo * 0.08;
  gl_FragColor = vec4(col, a * uOpacity * brightness);
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

// ---- coluna vertebral: dupla hélice orgânica (espinha/DNA), cor da seção.
// Recua quando um card está frontal (não cruza o card); brilha nas transições.
function Spine({ shared }) {
  const ref = useRef()
  const tmp = useMemo(() => new THREE.Color(), [])
  const geos = useMemo(() => {
    const make = (phase) => {
      const TURNS = 6.5
      const H = 17
      const R = 0.26
      const SEG = 260
      const pts = []
      for (let i = 0; i <= SEG; i++) {
        const t = i / SEG
        const a = t * TURNS * Math.PI * 2 + phase
        pts.push(new THREE.Vector3(Math.cos(a) * R, (t - 0.5) * H, Math.sin(a) * R))
      }
      return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), SEG, 0.022, 6, false)
    }
    return [make(0), make(Math.PI)]
  }, [])

  useFrame((_, dt) => {
    if (!ref.current) return
    const d = Math.min(dt, 0.1)
    const w = shared.current.panels
    ref.current.visible = w > 0.02
    // fade conforme a proximidade de um card frontal: ~0 no card, cheio no meio
    const active = bus.catalogP * (CATALOG.length - 1)
    const frac = Math.abs(active - Math.round(active))
    const between = THREE.MathUtils.smoothstep(frac, 0.08, 0.4)
    const target = w * (0.08 + between * 0.92)
    tmp.copy(shared.current.color).multiplyScalar(1.6)
    ref.current.traverse((o) => {
      if (o.material) {
        o.material.color.copy(tmp)
        o.material.opacity = THREE.MathUtils.damp(o.material.opacity, target, 6, d)
      }
    })
    ref.current.rotation.y += dt * 0.2
  })

  return (
    <group ref={ref}>
      {geos.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshBasicMaterial color="#E0A458" transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
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
function Director({ shared, target }) {
  // damp = suavização independente de frame-rate (converge no mesmo TEMPO
  // a 30 ou 144 fps), ao contrário do lerp por-frame.
  useFrame(({ camera }, dt) => {
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
        dpr={[1, 1.5]}
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
        <Glass shared={shared} />
        <Fluid shared={shared} />
        <Spine shared={shared} />
        <Suspense fallback={null}>
          <Panels shared={shared} />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.65} luminanceThreshold={0.3} luminanceSmoothing={0.4} mipmapBlur />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0016, 0.0018]} />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.45} />
          <Vignette eskil={false} offset={0.18} darkness={0.92} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
