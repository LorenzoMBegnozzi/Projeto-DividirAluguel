import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LinkProps } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'
import { buttonClass, cx } from './styles'
import type { ButtonSize, ButtonVariant } from './styles'

interface Common {
  variant?: ButtonVariant
  size?: ButtonSize
  /** ocupa a largura toda */
  full?: boolean
  icon?: LucideIcon
  iconRight?: LucideIcon
  children?: ReactNode
}

function Spinner() {
  return <span aria-hidden="true" className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent motion-reduce:animate-none" />
}

function Content({ icon: Icon, iconRight: IconRight, loading, children }: Common & { loading?: boolean }) {
  return (
    <>
      {loading ? <Spinner /> : Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      {children}
      {IconRight && !loading && <IconRight className="size-4 shrink-0" aria-hidden="true" />}
    </>
  )
}

export interface ButtonProps extends Common, Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** mostra o spinner e desabilita; o texto continua (não muda de largura) */
  loading?: boolean
}

/**
 * Botão padrão. Variantes: primary (ação principal), secondary (contorno), ghost (sem borda),
 * danger (destrutiva), accent (coral, chamadas de "anunciar"), inverse (escuro sobre claro).
 * Tamanhos sm 36 px (44 px de toque), md 44 px, lg 52 px. Só ícone: passe `aria-label`.
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant, size, full, icon, iconRight, loading = false, disabled, className, children, type = 'button', ...rest },
  ref,
) {
  const iconOnly = !children && !!icon
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(buttonClass({ variant, size, full, iconOnly }), className)}
      {...rest}
    >
      <Content icon={icon} iconRight={iconRight} loading={loading}>{children}</Content>
    </button>
  )
})
export default Button

/** Link do roteador com cara de botão (mesmas variantes e tamanhos). */
export function ButtonLink({ variant, size, full, icon, iconRight, className, children, ...rest }: Common & LinkProps) {
  const iconOnly = !children && !!icon
  return (
    <Link className={cx(buttonClass({ variant, size, full, iconOnly }), className)} {...rest}>
      <Content icon={icon} iconRight={iconRight}>{children}</Content>
    </Link>
  )
}
