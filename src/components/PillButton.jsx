// Pílula com contorno que preenche no hover. Versão leve do LiquidButton, que
// ficou só no CTA final: cada LiquidButton é um contexto WebGL próprio.
export default function PillButton({
  children,
  color = '#F4F2EC',
  ink = '#0B0B10',
  width,
  height = 48,
  fontSize = 12,
  className = '',
  style,
  ...props
}) {
  return (
    <button
      type="button"
      className={`pill-btn ${className}`}
      style={{ '--pill': color, '--pill-ink': ink, width, height, fontSize, ...style }}
      {...props}
    >
      {children}
    </button>
  )
}
