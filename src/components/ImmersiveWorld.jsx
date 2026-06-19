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
  hero:       { glass: 1.0,  fluid: 0.0,  panels: 0.0, logo: 0, camZ: 6.0 },
  manifesto:  { glass: 0.35, fluid: 0.9,  panels: 0.0, logo: 0, camZ: 5.3 },
  servicos:   { glass: 0.0,  fluid: 1.0,  panels: 0.0, logo: 0, camZ: 6.2 },
  catalogo:   { glass: 0.0,  fluid: 0.12, panels: 1.0, logo: 0, camZ: 6.0 },
  processo:   { glass: 0.0,  fluid: 0.85, panels: 0.0, logo: 0, camZ: 6.0 },
  resultados: { glass: 0.0,  fluid: 0.8,  panels: 0.0, logo: 0, camZ: 6.4 },
  planos:     { glass: 0.0,  fluid: 0.65, panels: 0.0, logo: 0, camZ: 6.0 },
  // clímax: as partículas se MONTAM na logo da Aethel
  contato:    { glass: 0.0,  fluid: 1.0,  panels: 0.0, logo: 1, camZ: 5.6 },
  footer:     { glass: 0.0,  fluid: 0.9,  panels: 0.0, logo: 1, camZ: 6.2 },
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
  float amp = uAmp * (1.0 - uLogo * 0.85); // segura a forma ao virar logo
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
  gl_PointSize = uSize * (300.0 / -mv.z) * (0.6 + aRand*0.8);
  gl_Position = projectionMatrix * mv;
  vR = aRand;
}
`
const FLUID_FRAG = /* glsl */ `
precision mediump float; uniform float uOpacity; varying float vR;
void main(){
  vec2 uv = gl_PointCoord - 0.5; float d = length(uv);
  if (d > 0.5) discard;
  float a = pow(smoothstep(0.5, 0.0, d), 1.4);
  vec3 ivory = vec3(0.957,0.949,0.925); vec3 amber = vec3(0.95,0.66,0.32);
  vec3 col = mix(ivory, amber, step(0.82, vR) + vR*0.25);
  gl_FragColor = vec4(col, a * uOpacity * 0.5);
}
`
function Fluid({ shared }) {
  const ref = useRef()
  const logoReady = useRef(false)
  const COUNT = 13000
  const { geo, uniforms } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3)
    const rand = new Float32Array(COUNT)
    const logo = new Float32Array(COUNT * 3)
    for (let i = 0; i < COUNT; i++) {
      // distribuição em volume esférico macio (lembra o organismo desfeito)
      const r = 1.4 + Math.pow(Math.random(), 0.5) * 1.8
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
  const GAP = 5.2 // profundidade entre as telas no corredor
  // telas flutuando em PROFUNDIDADE, escalonadas no espaço (não numa linha
  // plana). O scroll faz a câmera voar pelo corredor de telas.
  const layout = useMemo(
    () =>
      CATALOG.map((_, i) => ({
        x: (i % 2 === 0 ? 1.7 : -1.7) + ((i % 3) - 1) * 0.5,
        y: (i % 2 === 0 ? 0.45 : -0.5) + ((i % 3) - 1) * 0.25,
        z: -i * GAP,
      })),
    [N]
  )

  useFrame((state, dt) => {
    const w = shared.current.panels
    if (!grp.current) return
    const d = Math.min(dt, 0.1)
    grp.current.visible = w > 0.02
    // FLY-THROUGH: o grupo avança em direção à câmera conforme o scroll, então
    // cada tela se aproxima, ganha foco e passa — sensação de voar pelas telas.
    const targetZ = bus.catalogP * (N - 1) * GAP
    grp.current.position.z = THREE.MathUtils.damp(grp.current.position.z, targetZ, 4.5, d)
    grp.current.children.forEach((m, i) => {
      const worldZ = layout[i].z + grp.current.position.z
      // aparece da profundidade e some ao passar pela câmera
      const far = THREE.MathUtils.smoothstep(worldZ, -GAP * 2.4, -GAP * 0.25)
      const near = 1 - THREE.MathUtils.smoothstep(worldZ, 0, GAP * 0.8)
      const vis = far * near
      const focus = Math.max(0, 1 - Math.abs(worldZ) / (GAP * 0.7)) // 1 no plano focal
      m.material.opacity = THREE.MathUtils.damp(m.material.opacity, w * vis, 6, d)
      m.material.color.setScalar(0.7 + focus * 0.6)
      m.rotation.y = THREE.MathUtils.damp(m.rotation.y, -layout[i].x * 0.06 + shared.current.mx * 0.05, 4, d)
      m.position.y = layout[i].y + Math.sin(state.clock.elapsedTime * 0.4 + i) * 0.05
      const edge = m.children[0]
      if (edge) edge.material.opacity = THREE.MathUtils.damp(edge.material.opacity, w * vis * 0.9, 6, d)
    })
  })

  return (
    <group ref={grp}>
      {CATALOG.map((p, i) => (
        <mesh key={p.name} position={[layout[i].x, layout[i].y, layout[i].z]} scale={[5.0, 3.1, 1]}>
          <planeGeometry args={[1, 1]} />
          <meshBasicMaterial
            map={textures[i]}
            color="#cccccc"
            transparent
            opacity={0}
            side={THREE.DoubleSide}
            toneMapped={false}
          />
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
    camera.position.x = THREE.MathUtils.damp(camera.position.x, s.mx * 0.5, 2.5, d)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, -s.my * 0.35, 2.5, d)
    camera.position.z = s.camZ
    camera.lookAt(0, 0, 0)
  })
  return null
}

export default function ImmersiveWorld() {
  const shared = useRef({ glass: 1, fluid: 0, panels: 0, logo: 0, camZ: 6, mx: 0, my: 0 })
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
        <Suspense fallback={null}>
          <Panels shared={shared} />
        </Suspense>
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.65} luminanceThreshold={0.3} luminanceSmoothing={0.4} mipmapBlur />
          <ChromaticAberration blendFunction={BlendFunction.NORMAL} offset={[0.0009, 0.0011]} />
          <Noise premultiply blendFunction={BlendFunction.OVERLAY} opacity={0.45} />
          <Vignette eskil={false} offset={0.18} darkness={0.92} />
        </EffectComposer>
      </Canvas>
    </div>
  )
}
