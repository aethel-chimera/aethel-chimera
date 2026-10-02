// Botão em relevo pixelado: sobe no hover e afunda no clique, em degraus secos.
// `variant="dark"` é para fundo claro (card de destaque dos planos).
// Com `href` vira link externo (abre em nova aba), com a mesma aparência.
export default function PixelButton({ children, variant = 'light', size = 'md', className = '', href, ...props }) {
  const classes = `px-btn px-btn--${variant} px-btn--${size} ${className}`
  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...props}>
        {children}
      </a>
    )
  }
  return (
    <button type="button" className={classes} {...props}>
      {children}
    </button>
  )
}
