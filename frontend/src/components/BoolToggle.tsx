import { Check, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cx, focusRing } from './ui'

interface Props {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  icon?: LucideIcon
}

/** Pergunta de sim/não: ✓ = sim, ✕ = não. Clicar de novo na opção marcada volta para "não informado". */
export default function BoolToggle({ label, value, onChange, icon: Icon }: Props) {
  // 36 px visuais; 44 px de toque em tela de toque
  const base = cx(
    'inline-flex h-9 w-10 items-center justify-center rounded-sm pointer-coarse:min-h-11 pointer-coarse:min-w-11',
    'transition-[background-color,color] duration-(--dur-fast) motion-reduce:transition-none',
    focusRing,
  )
  const idle = 'text-ink-3 hover:bg-surface-sunk hover:text-ink'
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-small font-semibold text-ink">
        {Icon && <Icon className="size-4 shrink-0 text-ink-3" aria-hidden="true" />}
        {label}
      </p>
      <div role="group" aria-label={label} className="flex shrink-0 gap-0.5 rounded-md border border-field bg-surface p-0.5">
        <button
          type="button"
          aria-label="Sim"
          aria-pressed={value === true}
          title="Sim"
          onClick={() => onChange(value === true ? null : true)}
          className={cx(base, value === true ? 'bg-leaf text-on-inverse' : idle)}
        >
          <Check className="size-4" strokeWidth={2.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Não"
          aria-pressed={value === false}
          title="Não"
          onClick={() => onChange(value === false ? null : false)}
          className={cx(base, value === false ? 'bg-danger text-on-inverse' : idle)}
        >
          <X className="size-4" strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
