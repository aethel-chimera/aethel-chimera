import { useEffect, useState } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { isMuted, toggleMute, onMuteChange } from '../audio'

// Liga e desliga o som ambiente. Mudo por padrão: alto-falante riscado.
export default function AudioToggle({ className = '' }) {
  const [muted, setMuted] = useState(isMuted())
  useEffect(() => onMuteChange(setMuted), [])

  const Icon = muted ? VolumeX : Volume2
  return (
    <button
      type="button"
      onClick={() => setMuted(toggleMute())}
      className={`audio-toggle ${className}`}
      aria-pressed={!muted}
      aria-label={muted ? 'Ativar som ambiente' : 'Silenciar som ambiente'}
    >
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
    </button>
  )
}
