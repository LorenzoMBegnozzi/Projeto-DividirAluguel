import type { HTMLAttributes, ReactNode } from 'react'
import { AlertTriangle, CheckCircle2, Info, XCircle } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { alertClass, cx } from './styles'
import type { AlertTone } from './styles'

const alertIcon: Record<AlertTone, LucideIcon> = { info: Info, success: CheckCircle2, warning: AlertTriangle, danger: XCircle }

interface AlertProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  tone?: AlertTone
  title?: ReactNode
  /** false esconde o ícone; ou passe outro ícone */
  icon?: LucideIcon | false
  /** botão/link à direita */
  action?: ReactNode
  children?: ReactNode
}

/**
 * Aviso em linha: info (azul), success (verde), warning (mel), danger (vermelho).
 * Não define `role` sozinho (não muda o que o leitor de tela anuncia); passe role="alert"
 * onde o aviso já era anunciado.
 */
export function Alert({ tone = 'info', title, icon, action, className, children, ...rest }: AlertProps) {
  const Icon = icon === false ? null : (icon ?? alertIcon[tone])
  return (
    <div className={cx(alertClass(tone), className)} {...rest}>
      {Icon && <Icon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />}
      <div className="min-w-0 flex-1">
        {title && <p className="font-bold">{title}</p>}
        {children}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}

/** Estado vazio: ícone num círculo, título, texto e ação opcional. */
export function EmptyState({ icon: Icon, title, children, action, className }: { icon?: LucideIcon; title: ReactNode; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <div className={cx('flex flex-col items-center rounded-xl border border-dashed border-line-strong bg-surface px-6 py-10 text-center', className)}>
      {Icon && (
        <span className="mb-3 grid size-12 place-items-center rounded-full bg-surface-sunk text-ink-3">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-h3 text-ink">{title}</p>
      {children && <div className="mt-1 max-w-sm text-small text-ink-3">{children}</div>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/** Bloco de carregamento (pulsa; parado com reduced-motion). Use classes de tamanho. */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx('block animate-pulse rounded-sm bg-surface-sunk motion-reduce:animate-none', className)} />
}
