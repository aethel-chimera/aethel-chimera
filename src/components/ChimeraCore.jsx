import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'

gsap.registerPlugin(ScrollTrigger)

// ---------------------------------------------------------------------------
// MUNDO WEBGL DA AETHEL (escola Active Theory / kprverse).
// Um único mundo de ~28k partículas que ocupa o fundo inteiro da página. A
// câmera VOA pela cena a cada capítulo do scroll, a quimera morfa entre seis
// formas (a última é a logo amostrada por pixels) e tudo passa por
// pós-processamento cinematográfico: bloom + aberração cromática + film grain.
// ---------------------------------------------------------------------------

// estado por seção: pesos das formas + transform da quimera + POSE DA CÂMERA.
// (cx,cy,cz) = posição da câmera · (lx,ly,lz) = ponto que ela mira.
const STATES = {
  hero:       { w: [1,0,0,0,0,0], x: 2.0,  y: 0.05, scale: 1.0,  drift: 0.12, glow: 1.0,  spin: 0.06, cam: [0.6, 0.1, 6.2],  look: [1.4, 0.0, 0] },
  manifesto:  { w: [0,1,0,0,0,0], x: 0.1,  y: 0.0,  scale: 1.15, drift: 0.42, glow: 0.7,  spin: 0.03, cam: [0, 0, 4.4],      look: [0, 0, 0] },
  servicos:   { w: [0,0,0,1,0,0], x: 3.0,  y: 0.2,  scale: 0.9,  drift: 0.22, glow: 0.55, spin: 0.18, cam: [-1.6, 0.3, 6.5],  look: [1.6, 0.1, 0] },
  catalogo:   { w: [0,0,0,0,1,0], x: 3.2,  y: 0.1,  scale: 0.85, drift: 0.18, glow: 0.6,  spin: 0.1,  cam: [2.0, 0.0, 7.2],   look: [2.2, 0.0, 0] },
  processo:   { w: [1,0,0,0,0,0], x: -3.1, y: 0.3,  scale: 0.82, drift: 0.22, glow: 0.5,  spin: 0.05, cam: [-2.2, 0.4, 6.8],  look: [-2.0, 0.2, 0] },
  resultados: { w: [0,1,0,0,0,0], x: 3.0,  y: 0.2,  scale: 0.9,  drift: 0.5,  glow: 0.55, spin: 0.05, cam: [1.8, 0.2, 7.0],   look: [1.8, 0.1, 0] },
  planos:     { w: [0,0,0,1,0,0], x: -3.0, y: 0.2,  scale: 0.85, drift: 0.16, glow: 0.5,  spin: 0.06, cam: [-1.8, 0.2, 6.8],  look: [-1.8, 0.1, 0] },
  contato:    { w: [0,0,0,0,0,1], x: 0.0,  y: 0.05, scale: 1.2,  drift: 0.04, glow: 1.0,  spin: 0.01, cam: [0, 0, 5.6],       look: [0, 0, 0] },
  footer:     { w: [0,0,0,0,0,1], x: 0.0,  y: 0.0,  scale: 1.05, drift: 0.06, glow: 0.85, spin: 0.02, cam: [0, 0, 6.4],       look: [0, 0, 0] },
}

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uW[6];
uniform float uDrift;
uniform float uPixelRatio;
uniform float uGlow;
attribute vec3 aCore;
attribute vec3 aConstellation;
attribute vec3 aFlow;
attribute vec3 aHelix;
attribute vec3 aPortal;
attribute vec3 aLogo;
attribute float aScale;
attribute float aAmber;
attribute float aSeed;
varying float vAmber;
varying float vAlpha;
vec3 turbulence(vec3 p, float t, float s) {
  float a = sin(t*0.70 + p.y*2.3 + s*28.0) + 0.5*sin(t*1.7 + p.z*3.1 + s*12.0);
  float b = cos(t*0.62 + p.x*2.1 + s*22.0) + 0.5*cos(t*1.3 + p.y*3.7 + s*9.0);
  float c = sin(t*0.55 + p.z*2.0 + s*17.0) + 0.5*sin(t*1.9 + p.x*2.8 + s*14.0);
  return vec3(a, b, c);
}
void main() {
  vec3 pos = aCore*uW[0] + aConstellation*uW[1] + aFlow*uW[2] + aHelix*uW[3] + aPortal*uW[4] + aLogo*uW[5];
  pos += turbulence(pos, uTime, aSeed) * uDrift;
  vec4 mv = modelViewMatrix * vec4(pos, 1.0);
  gl_Position = projectionMatrix * mv;
  float size = aScale * (230.0 / -mv.z) * uPixelRatio;
  gl_PointSize = clamp(size, 0.8, 7.5);
  vAmber = aAmber;
  vAlpha = uGlow * smoothstep(-12.0, -2.0, mv.z) * (0.6 + aScale*0.4);
}
`

const FRAGMENT = /* glsl */ `
precision mediump float;
varying float vAmber;
varying float vAlpha;
void main() {
  vec2 uv = gl_PointCoord - 0.5;
  float d = length(uv);
  if (d > 0.5) discard;
  float halo = pow(smoothstep(0.5, 0.0, d), 1.5);
  vec3 ivory = vec3(0.92, 0.91, 0.88);
  vec3 amber = vec3(0.95, 0.66, 0.32);
  gl_FragColor = vec4(mix(ivory, amber, vAmber), halo * vAlpha * 0.22);
}
`

// pós-processamento final: aberração cromática radial + film grain + vinheta.
// Assinatura "Active Theory" — o que dá o acabamento cinematográfico.
const ChromaGrainShader = {
  uniforms: {
    tDiffuse: { value: null },
    uTime: { value: 0 },
    uAmount: { value: 0.0016 },
    uGrain: { value: 0.06 },
  },
  vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse;
    uniform float uTime;
    uniform float uAmount;
    uniform float uGrain;
    varying vec2 vUv;
    float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
    void main(){
      vec2 dir = vUv - 0.5;
      float dist = length(dir);
      vec2 off = dir * uAmount * (dist * 2.0);
      // aberração cromática crescente nas bordas
      float r = texture2D(tDiffuse, vUv + off).r;
      float g = texture2D(tDiffuse, vUv).g;
      float b = texture2D(tDiffuse, vUv - off).b;
      vec3 col = vec3(r, g, b);
      // film grain animado
      float gr = (rand(vUv + fract(uTime)) - 0.5) * uGrain;
      col += gr;
      // vinheta sutil
      col *= smoothstep(1.15, 0.35, dist);
      gl_FragColor = vec4(col, 1.0);
    }
  `,
}

export default function ChimeraCore({ reducedMotion }) {
  const mountRef = useRef(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const isMobile = window.innerWidth < 768
    const COUNT = isMobile ? 11000 : 28000

    let renderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance' })
    } catch {
      mount.classList.add('chimera-fallback')
      window.dispatchEvent(new Event('chimera:ready'))
      return
    }
    // Pixel ratio conservador: o bloom é caríssimo por pixel, então limitamos
    // bem o backbuffer. Grão + leve suavização escondem a perda de nitidez.
    const computePR = () => {
      const base = Math.min(window.devicePixelRatio, 1.25)
      const longest = Math.max(window.innerWidth, window.innerHeight) * base
      const CAP = 1500
      return longest > CAP ? Math.max(0.85, base * (CAP / longest)) : base
    }
    let pixelRatio = computePR()
    renderer.setPixelRatio(pixelRatio)
    renderer.setSize(window.innerWidth, window.innerHeight)
    mount.appendChild(renderer.domElement)

    const disposers = []
    let disposed = false

    const img = new Image()
    img.src = '/logo-mark.png'
    let started = false
    const begin = () => {
      if (started || disposed) return
      started = true
      let logo = null
      try {
        if (img.complete && img.naturalWidth > 0) logo = sampleLogo(img)
      } catch { logo = null }
      build(logo)
    }
    img.onload = begin
    img.onerror = begin
    const imgTimer = setTimeout(begin, 1200)

    function sampleLogo(image, targetHeight = 3.2) {
      const maxW = 260
      const s = Math.min(1, maxW / image.width)
      const w = Math.max(1, Math.round(image.width * s))
      const h = Math.max(1, Math.round(image.height * s))
      const cnv = document.createElement('canvas')
      cnv.width = w; cnv.height = h
      const c2 = cnv.getContext('2d', { willReadFrequently: true })
      c2.drawImage(image, 0, 0, w, h)
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
      const bh = maxY - minY || 1
      return { pts, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2, k: targetHeight / bh }
    }

    function build(logo) {
      clearTimeout(imgTimer)

      const scene = new THREE.Scene()
      scene.background = new THREE.Color(0x07070b)
      scene.fog = new THREE.FogExp2(0x07070b, 0.07)
      const camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 100)
      camera.position.set(...STATES.hero.cam)

      const aCore = new Float32Array(COUNT * 3)
      const aConst = new Float32Array(COUNT * 3)
      const aFlow = new Float32Array(COUNT * 3)
      const aHelix = new Float32Array(COUNT * 3)
      const aPortal = new Float32Array(COUNT * 3)
      const aLogo = new Float32Array(COUNT * 3)
      const aScale = new Float32Array(COUNT)
      const aAmber = new Float32Array(COUNT)
      const aSeed = new Float32Array(COUNT)

      const GOLDEN = Math.PI * (1 + Math.sqrt(5))
      const lp = logo ? logo.pts : null
      const ln = lp ? lp.length / 2 : 0

      for (let i = 0; i < COUNT; i++) {
        const i3 = i * 3
        const rnd = Math.random()
        const phi = Math.acos(1 - (2 * (i + 0.5)) / COUNT)
        const theta = GOLDEN * i
        const rc = 1.25 * (0.82 + Math.random() * 0.18)
        aCore[i3] = rc * Math.sin(phi) * Math.cos(theta)
        aCore[i3 + 1] = rc * Math.cos(phi)
        aCore[i3 + 2] = rc * Math.sin(phi) * Math.sin(theta)

        const ra = 2.2 + Math.pow(Math.random(), 0.5) * 2.8
        const ca = Math.random() * Math.PI * 2
        const cz = Math.acos(2 * Math.random() - 1)
        aConst[i3] = ra * Math.sin(cz) * Math.cos(ca) * 1.2
        aConst[i3 + 1] = ra * Math.cos(cz) * 0.7
        aConst[i3 + 2] = ra * Math.sin(cz) * Math.sin(ca)

        const t = i / COUNT
        aFlow[i3] = (t - 0.5) * 9.5
        aFlow[i3 + 1] = Math.sin(t * Math.PI * 8) * 0.7 + (Math.random() - 0.5) * 0.5
        aFlow[i3 + 2] = Math.cos(t * Math.PI * 6) * 0.7 + (Math.random() - 0.5) * 0.5

        const ht = (i / COUNT) * Math.PI * 10
        const strand = i % 2 === 0 ? 0 : Math.PI
        aHelix[i3] = Math.cos(ht + strand)
        aHelix[i3 + 1] = (i / COUNT - 0.5) * 4.4
        aHelix[i3 + 2] = Math.sin(ht + strand)

        const pa = Math.random() * Math.PI * 2
        const spiral = Math.pow(Math.random(), 0.6)
        const pr = 0.4 + spiral * 1.95
        const swirl = pa + spiral * 6.5
        aPortal[i3] = Math.cos(swirl) * pr
        aPortal[i3 + 1] = Math.sin(swirl) * pr
        aPortal[i3 + 2] = (Math.random() - 0.5) * 0.5 * (1.0 - spiral)

        if (ln > 0) {
          const p = Math.floor(Math.random() * ln) * 2
          aLogo[i3] = (lp[p] + (Math.random() - 0.5) - logo.cx) * logo.k
          aLogo[i3 + 1] = -(lp[p + 1] + (Math.random() - 0.5) - logo.cy) * logo.k
          aLogo[i3 + 2] = (Math.random() - 0.5) * 0.28
        } else {
          aLogo[i3] = aCore[i3]; aLogo[i3 + 1] = aCore[i3 + 1]; aLogo[i3 + 2] = aCore[i3 + 2]
        }

        aScale[i] = 0.5 + Math.random() * 1.0
        aAmber[i] = rnd < 0.18 ? 1.0 : Math.pow(rnd, 5.0) * 0.55
        aSeed[i] = Math.random()
      }

      const geo = new THREE.BufferGeometry()
      geo.setAttribute('position', new THREE.BufferAttribute(aCore.slice(), 3))
      geo.setAttribute('aCore', new THREE.BufferAttribute(aCore, 3))
      geo.setAttribute('aConstellation', new THREE.BufferAttribute(aConst, 3))
      geo.setAttribute('aFlow', new THREE.BufferAttribute(aFlow, 3))
      geo.setAttribute('aHelix', new THREE.BufferAttribute(aHelix, 3))
      geo.setAttribute('aPortal', new THREE.BufferAttribute(aPortal, 3))
      geo.setAttribute('aLogo', new THREE.BufferAttribute(aLogo, 3))
      geo.setAttribute('aScale', new THREE.BufferAttribute(aScale, 1))
      geo.setAttribute('aAmber', new THREE.BufferAttribute(aAmber, 1))
      geo.setAttribute('aSeed', new THREE.BufferAttribute(aSeed, 1))

      const uniforms = {
        uTime: { value: 0 },
        uW: { value: STATES.hero.w.slice() },
        uDrift: { value: STATES.hero.drift },
        uGlow: { value: STATES.hero.glow },
        uPixelRatio: { value: pixelRatio },
      }
      const mat = new THREE.ShaderMaterial({
        vertexShader: VERTEX, fragmentShader: FRAGMENT, uniforms,
        transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending,
      })
      const points = new THREE.Points(geo, mat)
      const group = new THREE.Group()
      group.add(points)
      scene.add(group)

      // ---- pós-processamento: render → bloom → aberração cromática + grão ----
      const composer = new EffectComposer(renderer)
      composer.setPixelRatio(pixelRatio)
      composer.setSize(window.innerWidth, window.innerHeight)
      composer.addPass(new RenderPass(scene, camera))
      const bloom = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        0.5,  // strength
        0.6,  // radius
        0.55  // threshold — só os pontos mais brilhantes florescem
      )
      composer.addPass(bloom)
      const chroma = new ShaderPass(ChromaGrainShader)
      chroma.renderToScreen = true
      composer.addPass(chroma)

      // pós-processamento só no desktop com movimento; some no fallback.
      // Se o composer falhar em runtime, cai para render simples sem travar.
      let usePost = !reducedMotion && !isMobile

      // estado interpolado em runtime
      const cur = {
        x: STATES.hero.x, y: STATES.hero.y, scale: STATES.hero.scale, spin: STATES.hero.spin,
        cam: [...STATES.hero.cam], look: [...STATES.hero.look],
      }
      let target = STATES.hero
      const weights = STATES.hero.w.slice()
      let wTween
      const setTarget = (name) => {
        const s = STATES[name]
        target = s
        wTween?.kill()
        const proxy = { ...weights }
        wTween = gsap.to(proxy, {
          0: s.w[0], 1: s.w[1], 2: s.w[2], 3: s.w[3], 4: s.w[4], 5: s.w[5],
          duration: 1.5, ease: 'power2.inOut',
          onUpdate: () => { for (let k = 0; k < 6; k++) { weights[k] = proxy[k]; uniforms.uW.value[k] = proxy[k] } },
        })
        gsap.to(uniforms.uDrift, { value: s.drift, duration: 1.5, ease: 'power2.inOut' })
        gsap.to(uniforms.uGlow, { value: s.glow, duration: 1.5, ease: 'power2.inOut' })
      }

      let ctx
      if (!reducedMotion) {
        ctx = gsap.context(() => {
          const mk = (trigger, state) =>
            ScrollTrigger.create({ trigger, start: 'top 60%', end: 'bottom 40%', onToggle: (self) => self.isActive && setTarget(state) })
          mk('#hero', 'hero'); mk('#manifesto', 'manifesto'); mk('#servicos', 'servicos')
          mk('#catalogo', 'catalogo'); mk('#processo', 'processo'); mk('#resultados', 'resultados')
          mk('#planos', 'planos'); mk('#contato', 'contato')
          if (document.querySelector('#rodape')) mk('#rodape', 'footer')
        })
      }

      const mouse = { x: 0, y: 0 }
      const onMouse = (e) => { mouse.x = (e.clientX / window.innerWidth) * 2 - 1; mouse.y = (e.clientY / window.innerHeight) * 2 - 1 }
      window.addEventListener('mousemove', onMouse)

      // navegação por DRAG (orbita a quimera com inércia)
      const drag = { active: false, sx: 0, sy: 0, lx: 0, ly: 0, vx: 0, vy: 0, moved: false }
      const onDown = (e) => {
        if (e.target.closest('a, button, input, textarea, [data-no-drag]')) return
        drag.active = true; drag.moved = false
        drag.sx = drag.lx = e.clientX; drag.sy = drag.ly = e.clientY
      }
      const onDragMove = (e) => {
        if (!drag.active) return
        const dx = e.clientX - drag.lx, dy = e.clientY - drag.ly
        drag.lx = e.clientX; drag.ly = e.clientY
        if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) { drag.moved = true; document.body.classList.add('dragging') }
        if (drag.moved) { drag.vx = dy * 0.004; drag.vy = dx * 0.004 }
      }
      const onUp = () => { drag.active = false; document.body.classList.remove('dragging') }
      window.addEventListener('pointerdown', onDown)
      window.addEventListener('pointermove', onDragMove)
      window.addEventListener('pointerup', onUp)
      window.addEventListener('pointercancel', onUp)

      let lastW = -1, lastH = -1
      const onResize = () => {
        const w = window.innerWidth, h = window.innerHeight
        if (w === lastW && h === lastH) return // ignora chamadas redundantes
        if (w === 0 || h === 0) return // viewport ainda não assentou
        lastW = w; lastH = h
        camera.aspect = w / h
        camera.updateProjectionMatrix()
        pixelRatio = computePR()
        renderer.setPixelRatio(pixelRatio)
        renderer.setSize(w, h)
        composer.setPixelRatio(pixelRatio)
        composer.setSize(w, h)
        uniforms.uPixelRatio.value = pixelRatio
      }
      window.addEventListener('resize', onResize)
      // ResizeObserver no mount: dispara no layout inicial e em qualquer
      // mudança de tamanho — robusto contra viewport transitório de 0 que o
      // setSize inicial possa ter pego antes do layout assentar.
      const ro = new ResizeObserver(() => onResize())
      ro.observe(mount)
      onResize()

      const clock = new THREE.Clock()
      let raf, paused = false, firstFrame = false
      const tmpLook = new THREE.Vector3()

      const renderFrame = () => {
        const t = clock.getElapsedTime()
        const l = 0.05
        cur.x += (target.x * (isMobile ? 0.35 : 1) - cur.x) * l
        cur.y += (target.y - cur.y) * l
        cur.scale += (target.scale * (isMobile ? 0.7 : 1) - cur.scale) * l
        cur.spin += (target.spin - cur.spin) * l

        group.position.set(cur.x, cur.y, 0)
        group.scale.setScalar(cur.scale)
        group.rotation.y += 0.0009 + cur.spin * 0.004 + drag.vy
        group.rotation.x += drag.vx
        if (!drag.moved) {
          group.rotation.x += (-mouse.y * 0.12 - group.rotation.x) * 0.03
        }
        drag.vx *= 0.92; drag.vy *= 0.92

        // câmera cinematográfica: voa entre as poses das seções + parallax leve
        for (let i = 0; i < 3; i++) {
          cur.cam[i] += (target.cam[i] - cur.cam[i]) * 0.04
          cur.look[i] += (target.look[i] - cur.look[i]) * 0.04
        }
        camera.position.set(
          cur.cam[0] + mouse.x * 0.25,
          cur.cam[1] - mouse.y * 0.18,
          cur.cam[2]
        )
        tmpLook.set(cur.look[0], cur.look[1], cur.look[2])
        camera.lookAt(tmpLook)

        uniforms.uTime.value = t
        chroma.uniforms.uTime.value = t

        if (usePost) {
          try {
            composer.render()
          } catch {
            usePost = false
            renderer.render(scene, camera)
          }
        } else {
          renderer.render(scene, camera)
        }

        if (!firstFrame) { firstFrame = true; window.dispatchEvent(new Event('chimera:ready')) }
        if (reducedMotion) return
        if (!paused) raf = requestAnimationFrame(renderFrame)
      }
      raf = requestAnimationFrame(renderFrame)

      const onVis = () => { paused = document.hidden; if (!paused && !reducedMotion) raf = requestAnimationFrame(renderFrame) }
      document.addEventListener('visibilitychange', onVis)

      disposers.push(() => {
        cancelAnimationFrame(raf)
        ctx?.revert()
        wTween?.kill()
        window.removeEventListener('mousemove', onMouse)
        window.removeEventListener('pointerdown', onDown)
        window.removeEventListener('pointermove', onDragMove)
        window.removeEventListener('pointerup', onUp)
        window.removeEventListener('pointercancel', onUp)
        document.body.classList.remove('dragging')
        window.removeEventListener('resize', onResize)
        ro.disconnect()
        document.removeEventListener('visibilitychange', onVis)
        geo.dispose(); mat.dispose(); bloom.dispose?.(); composer.dispose?.()
      })

      ScrollTrigger.refresh()
    }

    return () => {
      disposed = true
      clearTimeout(imgTimer)
      disposers.forEach((d) => d())
      renderer.dispose()
      mount.contains(renderer.domElement) && mount.removeChild(renderer.domElement)
    }
  }, [reducedMotion])

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="fixed inset-0 z-[0] [&.chimera-fallback]:bg-[radial-gradient(circle_at_70%_42%,rgba(224,164,88,0.14),transparent_55%)]"
    />
  )
}
