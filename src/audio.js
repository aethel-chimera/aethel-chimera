// ---------------------------------------------------------------------------
// Camada nova E — som sincronizado (linhagem Igloo / Active Theory).
// Web Audio puro: blips curtos e graves em marcos de scroll/hover. SEMPRE
// inicia MUDO (autoplay de áudio é bloqueado e intrusivo); o usuário liga no
// toggle visível. Sintetizado em runtime — nenhum asset de áudio carregado.
// ---------------------------------------------------------------------------

let ctx = null
let muted = true
const listeners = new Set()

function ensure() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (AC) ctx = new AC()
  }
  if (ctx && ctx.state === 'suspended') ctx.resume()
  return ctx
}

export function isMuted() {
  return muted
}

export function onMuteChange(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function toggleMute() {
  muted = !muted
  if (!muted) ensure() // primeiro gesto do usuário destrava o AudioContext
  listeners.forEach((fn) => fn(muted))
  if (!muted) blip(440, 0.04, 'sine')
  return muted
}

// blip sintetizado: freq em Hz, ganho de pico, forma de onda
export function blip(freq = 220, gain = 0.05, type = 'sine') {
  if (muted) return
  const ac = ensure()
  if (!ac) return
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.value = freq
  g.gain.value = 0
  osc.connect(g)
  g.connect(ac.destination)
  const t = ac.currentTime
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(gain, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22)
  osc.start(t)
  osc.stop(t + 0.24)
}

// marco de seção: acorde grave curto, distinto por índice
export function sectionTone(index = 0) {
  if (muted) return
  const base = 110 * Math.pow(2, (index % 6) / 12)
  blip(base, 0.05, 'triangle')
  setTimeout(() => blip(base * 1.5, 0.03, 'sine'), 60)
}
