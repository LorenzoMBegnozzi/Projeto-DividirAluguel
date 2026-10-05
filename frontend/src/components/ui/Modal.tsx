import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { cx } from './styles'

interface Props {
  /** título visível (vira o nome acessível do diálogo) */
  title?: ReactNode
  /** texto curto abaixo do título */
  description?: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** só quando o modal já fechava com Esc; por padrão não fecha (não muda comportamento) */
  onEscape?: () => void
  /** id de um título que está dentro de children (quando não usa `title`) */
  labelledBy?: string
  className?: string
  children: ReactNode
}

const width = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

/**
 * Diálogo centralizado sobre o scrim. O pai decide quando renderizar (padrão do app).
 * Ao abrir, o foco vai para o painel, para teclado e leitor de tela começarem dentro dele.
 */
export default function Modal({ title, description, size = 'sm', onEscape, labelledBy, className, children }: Props) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    panel.current?.focus()
    return () => prev?.focus?.()
  }, [])
  useEffect(() => {
    if (!onEscape) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onEscape() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onEscape])

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-scrim px-4 py-6">
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : labelledBy}
        tabIndex={-1}
        className={cx('max-h-full w-full overflow-y-auto rounded-xl bg-surface p-6 shadow-lg outline-none', width[size], className)}
      >
        {title && <h2 id={titleId} className="mb-1 text-h2 text-ink">{title}</h2>}
        {description && <p className="mb-4 text-small text-ink-3">{description}</p>}
        {children}
      </div>
    </div>
  )
}
