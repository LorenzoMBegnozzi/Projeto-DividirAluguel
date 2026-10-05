import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Check } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { badgeClass, chipClass, cx } from './styles'
import type { BadgeTone } from './styles'

interface ChipProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** marcado (vira aria-pressed) */
  pressed?: boolean
  size?: 'sm' | 'md'
  icon?: LucideIcon
  /** mostra ✓ quando marcado */
  showCheck?: boolean
  children: ReactNode
}

/** Opção selecionável em forma de pílula (hábitos, filtros, escolhas múltiplas). */
export function Chip({ pressed = false, size, icon: Icon, showCheck = false, className, children, type = 'button', ...rest }: ChipProps) {
  return (
    <button type={type} aria-pressed={pressed} className={cx(chipClass({ pressed, size }), className)} {...rest}>
      {showCheck && pressed ? <Check className="size-3.5 shrink-0" aria-hidden="true" /> : Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
    </button>
  )
}

/** Rótulo estático (status, tipo, contagem). Não é clicável. */
export function Badge({ tone, shape, icon: Icon, className, children }: { tone?: BadgeTone; shape?: 'tag' | 'pill'; icon?: LucideIcon; className?: string; children: ReactNode }) {
  return (
    <span className={cx(badgeClass({ tone, shape }), className)}>
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      {children}
    </span>
  )
}
