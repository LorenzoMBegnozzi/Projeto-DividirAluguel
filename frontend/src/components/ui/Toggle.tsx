import { useId } from 'react'
import type { ReactNode } from 'react'
import { cx, focusRing } from './styles'

interface Props {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  /** texto de apoio abaixo do rótulo */
  hint?: ReactNode
  disabled?: boolean
  className?: string
}

/** Interruptor liga/desliga (role="switch"). A linha inteira é clicável e tem ≥ 44 px. */
export default function Toggle({ checked, onChange, label, hint, disabled, className }: Props) {
  const id = useId()
  return (
    <div className={cx('flex min-h-11 items-center justify-between gap-4', className)}>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-small font-semibold text-ink">{label}</span>
        {hint && <span className="block text-caption text-ink-3">{hint}</span>}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cx(
          'relative h-6 w-11 shrink-0 rounded-full transition-colors duration-(--dur-fast) disabled:opacity-55',
          'before:absolute before:-inset-2.5 before:content-[""]', // área de toque de 44 px
          checked ? 'bg-brand' : 'bg-field',
          focusRing,
        )}
      >
        <span className={cx('absolute left-0.5 top-0.5 size-5 rounded-full bg-surface shadow-sm transition-transform duration-(--dur-fast) ease-(--ease-spring) motion-reduce:transition-none', checked && 'translate-x-5')} />
      </button>
    </div>
  )
}
