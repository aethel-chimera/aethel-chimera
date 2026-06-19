import { useEffect, useState } from 'react'
import { isMuted, toggleMute, onMuteChange } from '../audio'

// Toggle de áudio visível (estilo Active Theory). Mudo por padrão.
export default function AudioToggle({ className = '' }) {
  const [muted, setMuted] = useState(isMuted())
  useEffect(() => onMuteChange(setMuted), [])

  return (
    <button
      type="button"
      onClick={() => setMuted(toggleMute())}
      className={`audio-toggle ${muted ? '' : 'is-on'} ${className}`}
      aria-pressed={!muted}
      aria-label={muted ? 'Ativar som ambiente' : 'Silenciar som ambiente'}
    >
      <span className="audio-bars" aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </span>
      {muted ? 'Som' : 'Som on'}
    </button>
  )
}
