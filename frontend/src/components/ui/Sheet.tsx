import { useEffect, useId, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import Button from './Button'
import { cx } from './styles'

/**
 * Gaveta que sobe da base da tela (filtros no celular). Fica sempre montada para animar a
 * entrada e a saída; fechada, é inerte. Abre com foco no painel, fecha com Esc, com o "x" ou
 * tocando fora, trava a rolagem da página e devolve o foco a quem abriu.
 */
export default function Sheet({ open, onClose, title, footer, children }: {
  open: boolean
  onClose: () => void
  title: string
  /** barra fixa no pé (ex.: "Ver 12 anúncios") */
  footer?: ReactNode
  children: ReactNode
}) {
  const panel = useRef<HTMLDivElement>(null)
  const titleId = useId()
  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      prev?.focus?.()
    }
  }, [open, onClose])

  return (
    <div className={cx('fixed inset-0 z-(--z-modal)', !open && 'pointer-events-none')} inert={!open} aria-hidden={!open}>
      <div
        className={cx('absolute inset-0 bg-scrim transition-opacity duration-(--dur-base) motion-reduce:transition-none', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cx(
          'absolute inset-x-0 bottom-0 flex max-h-[92dvh] flex-col rounded-t-xl bg-surface shadow-lg outline-none',
          'transition-transform duration-(--dur-slow) ease-out motion-reduce:transition-none',
          open ? 'translate-y-0' : 'translate-y-full',
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2">
          <h2 id={titleId} className="text-h3 text-ink">{title}</h2>
          <Button variant="ghost" icon={X} aria-label="Fechar" onClick={onClose} />
        </div>
        <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">{children}</div>
        {footer && <div className="border-t border-line px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
      </div>
    </div>
  )
}
