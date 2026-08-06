import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Bounds, useBounds } from '@react-three/drei'

// Modelo do espadachim + Lune Améthyste exportado do Blender (public/models).
// A animação do golpe tem ROOT MOTION (o personagem avança), o que o tirava do
// quadro. Aqui congelamos numa POSE de destaque e giramos devagar — beauty shot
// sempre enquadrado. Carregado sob demanda (componente lazy + só monta em tela).
const MODEL_URL = '/models/lune-amethyste.glb'
// touch (sem mouse): desliga a rotação manual p/ não sequestrar o scroll
const COARSE = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
const POSE = 0.46 // fração da timeline do golpe usada como pose fixa (0..1)

function Swordsman() {
  const group = useRef(null)
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions, names } = useAnimations(animations, group)
  const bounds = useBounds()

  useEffect(() => {
    const a = names[0] ? actions[names[0]] : null
    if (!a) return
    // aplica uma pose fixa (congela a animação no frame de destaque)
    a.reset().play()
    a.paused = true
    a.time = a.getClip().duration * POSE
    // reenquadra DEPOIS que a pose foi aplicada pelo mixer (2 frames)
    let r2
    const r1 = requestAnimationFrame(() => {
      r2 = requestAnimationFrame(() => bounds.refresh().clip().fit())
    })
    return () => {
      cancelAnimationFrame(r1)
      cancelAnimationFrame(r2)
      a.stop()
    }
  }, [actions, names, bounds])

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

export default function Model3DViewer() {
  return (
    <Canvas
      dpr={[1, 2]}
      camera={{ position: [2.4, 1.4, 3.6], fov: 35 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* iluminação mais clara p/ revelar o PBR (antes ficava quase silhueta) */}
      <ambientLight intensity={0.9} />
      <directionalLight position={[4, 6, 5]} intensity={3.2} />
      <directionalLight position={[0, 2, 6]} intensity={1.5} />
      <directionalLight position={[-5, 3, -4]} intensity={1.8} color="#9A7BD8" />
      <spotLight position={[0, 9, 3]} angle={0.5} penumbra={1} intensity={1.4} />
      <Suspense fallback={null}>
        <Bounds observe margin={1.15}>
          <Swordsman />
        </Bounds>
      </Suspense>
      {/* TOUCH: arrastar dentro do canvas sequestraria o scroll da página no
          celular. Em ponteiro grosso o modelo só gira sozinho (sem rotação
          manual), então o dedo continua rolando a página normalmente. */}
      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.8}
        enableRotate={!COARSE}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.85}
      />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
