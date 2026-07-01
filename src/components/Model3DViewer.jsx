import { Suspense, useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { useGLTF, useAnimations, OrbitControls, Bounds } from '@react-three/drei'

// Modelo do espadachim + Lune Améthyste exportado do Blender (public/models).
// Toca a animação do golpe em loop e gira devagar. Carregado sob demanda
// (o componente é lazy e só monta quando a seção entra em tela).
const MODEL_URL = '/models/lune-amethyste.glb'

function Swordsman() {
  const group = useRef(null)
  const { scene, animations } = useGLTF(MODEL_URL)
  const { actions, names } = useAnimations(animations, group)

  useEffect(() => {
    const clip = names[0] ? actions[names[0]] : null
    if (clip) clip.reset().fadeIn(0.5).play()
    return () => clip?.fadeOut(0.3)
  }, [actions, names])

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
      camera={{ position: [2.6, 1.5, 3.6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ background: 'transparent' }}
    >
      {/* 3-point + rim ametista (o único respiro de cor da marca) */}
      <ambientLight intensity={0.55} />
      <directionalLight position={[4, 6, 5]} intensity={2.4} />
      <directionalLight position={[-5, 3, -4]} intensity={1.4} color="#8b5cf6" />
      <spotLight position={[0, 8, 2]} angle={0.4} penumbra={1} intensity={1.1} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.1}>
          <Swordsman />
        </Bounds>
      </Suspense>
      <OrbitControls
        makeDefault
        autoRotate
        autoRotateSpeed={0.9}
        enablePan={false}
        enableZoom={false}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  )
}

useGLTF.preload(MODEL_URL)
