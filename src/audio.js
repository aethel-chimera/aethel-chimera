// ---------------------------------------------------------------------------
// Camada nova E - som sincronizado (linhagem Igloo / Active Theory).
// Web Audio puro: blips curtos e graves em marcos de scroll/hover. SEMPRE
// inicia MUDO (autoplay de áudio é bloqueado e intrusivo); o usuário liga no
// toggle visível. Sintetizado em runtime - nenhum asset de áudio carregado.
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

// o clique no botão de som sempre responde: duas notas subindo ao ligar e
// descendo ao desligar. Toca mesmo indo para o mudo, por isso usa tone()
export function toggleMute() {
  muted = !muted
  ensure() // o clique é o gesto do usuário que destrava o AudioContext
  listeners.forEach((fn) => fn(muted))
  const [first, second] = muted ? [494, 247] : [330, 494]
  tone(first, 0.04, 'sine')
  setTimeout(() => tone(second, 0.04, 'sine'), 70)
  return muted
}

// blip sintetizado: freq em Hz, ganho de pico, forma de onda
export function blip(freq = 220, gain = 0.05, type = 'sine') {
  if (muted) return
  tone(freq, gain, type)
}

function tone(freq, gain, type) {
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

// som de "encher": tique curto cujo tom sobe com o progresso (0..1), em degraus
// de 40 ms no máximo para soar como catraca e não como zumbido
let lastFill = 0
export function fill(progress = 0) {
  if (muted) return
  const now = performance.now()
  if (now - lastFill < 40) return
  lastFill = now
  const p = Math.min(1, Math.max(0, progress))
  tone(160 * Math.pow(2, p * 2.2), 0.03, 'triangle')
}

// marco de seção: acorde grave curto, distinto por índice
export function sectionTone(index = 0) {
  if (muted) return
  const base = 110 * Math.pow(2, (index % 6) / 12)
  blip(base, 0.05, 'triangle')
  setTimeout(() => blip(base * 1.5, 0.03, 'sine'), 60)
}
