import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

// Dropdown no estilo dos campos (px-field): o <select> nativo abria a lista
// padrão do sistema, fora da identidade da página. Teclado: setas, Home/End,
// Enter/Espaço escolhe, Esc fecha.
export default function PixelSelect({ id, value, onChange, options, placeholder = 'Selecione' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const rootRef = useRef(null)
  const listId = useId()

  useEffect(() => {
    if (!open) return
    const onDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false)
    }
    window.addEventListener('pointerdown', onDown)
    return () => window.removeEventListener('pointerdown', onDown)
  }, [open])

  const openList = () => {
    setActive(Math.max(0, options.indexOf(value)))
    setOpen(true)
  }
  const choose = (i) => {
    onChange(options[i])
    setOpen(false)
  }

  const onKeyDown = (e) => {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) {
        e.preventDefault()
        openList()
      }
      return
    }
    if (e.key === 'ArrowDown') setActive((i) => Math.min(options.length - 1, i + 1))
    else if (e.key === 'ArrowUp') setActive((i) => Math.max(0, i - 1))
    else if (e.key === 'Home') setActive(0)
    else if (e.key === 'End') setActive(options.length - 1)
    else if (e.key === 'Enter' || e.key === ' ') choose(active)
    else if (e.key === 'Escape' || e.key === 'Tab') {
      setOpen(false)
      return
    } else return
    e.preventDefault()
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        id={id}
        type="button"
        className="px-field !flex w-full items-center justify-between gap-3 text-left"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
        onClick={() => (open ? setOpen(false) : openList())}
        onKeyDown={onKeyDown}
      >
        <span className={value ? 'text-ivory' : 'text-titanium/40'}>{value || placeholder}</span>
        <ChevronDown
          size={16}
          aria-hidden="true"
          className={`shrink-0 text-titanium transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul id={listId} role="listbox" className="px-menu">
          {options.map((o, i) => (
            <li
              key={o}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o === value}
              className={`px-option ${i === active ? 'is-active' : ''}`}
              onPointerEnter={() => setActive(i)}
              onClick={() => choose(i)}
            >
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
