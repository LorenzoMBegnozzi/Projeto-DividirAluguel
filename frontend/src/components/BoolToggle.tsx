import { Check, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

interface Props {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  icon?: LucideIcon
}

/** Pergunta de sim/não: ✓ = sim, ✕ = não. Clicar de novo na opção marcada volta para "não informado". */
export default function BoolToggle({ label, value, onChange, icon: Icon }: Props) {
  const base =
    'inline-flex h-[34px] w-[38px] items-center justify-center rounded-[7px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
  const idle = 'text-ink-3 hover:bg-surface-sunk hover:text-ink'
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-ink">
        {Icon && <Icon className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />}
        {label}
      </p>
      <div role="group" aria-label={label} className="flex shrink-0 gap-[3px] rounded-md border border-line-strong bg-surface p-[3px]">
        <button
          type="button"
          aria-label="Sim"
          aria-pressed={value === true}
          title="Sim"
          onClick={() => onChange(value === true ? null : true)}
          className={`${base} ${value === true ? 'bg-leaf text-on-inverse' : idle}`}
        >
          <Check className="h-4 w-4" strokeWidth={2.75} aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Não"
          aria-pressed={value === false}
          title="Não"
          onClick={() => onChange(value === false ? null : false)}
          className={`${base} ${value === false ? 'bg-danger text-on-inverse' : idle}`}
        >
          <X className="h-4 w-4" strokeWidth={2.75} aria-hidden="true" />
        </button>
      </div>
    </div>
  )
}
