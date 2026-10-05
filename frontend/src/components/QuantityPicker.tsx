import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cx, focusRing, labelClass } from './ui'

interface Props {
  label: string
  /** Quantidade em texto ('' = não informado), igual aos outros campos numéricos do formulário. */
  value: string
  onChange: (value: string) => void
  max?: number
}

const QUICK_OPTIONS = [1, 2, 3, 4]

/**
 * Quantidade em caixas 1 · 2 · 3 · 4 · +. Clicar na caixa marcada desmarca (volta para não informado).
 * O "+" abre um campo para digitar qualquer outro número (inclusive 0).
 */
export default function QuantityPicker({ label, value, onChange, max = 20 }: Props) {
  const isQuick = value !== '' && QUICK_OPTIONS.includes(Number(value))
  const [typing, setTyping] = useState(value !== '' && !isQuick)
  const showInput = typing || (value !== '' && !isQuick)

  const box = cx(
    'inline-flex h-11 min-w-11 items-center justify-center rounded-md border text-small font-semibold tabular-nums',
    'transition-[background-color,border-color,color] duration-(--dur-fast) motion-reduce:transition-none',
    focusRing,
  )
  const idle = 'border-field bg-surface text-ink-2 hover:border-ink hover:text-ink'
  const selected = 'border-brand bg-brand-tint text-brand-strong'

  return (
    <div>
      <p className={labelClass}>{label}</p>
      <div role="group" aria-label={label} className="flex flex-wrap gap-2">
        {QUICK_OPTIONS.filter((n) => n <= max).map((n) => {
          const active = !showInput && Number(value) === n && value !== ''
          return (
            <button
              key={n}
              type="button"
              aria-pressed={active}
              onClick={() => {
                setTyping(false)
                onChange(active ? '' : String(n))
              }}
              className={cx(box, active ? selected : idle)}
            >
              {n}
            </button>
          )
        })}
        {showInput ? (
          <input
            type="number"
            min="0"
            max={max}
            autoFocus={typing && value === ''}
            aria-label={`${label}: outro número`}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={() => {
              if (value === '') setTyping(false)
            }}
            placeholder="Nº"
            className={cx(box, 'w-18 border-brand bg-surface px-2 text-center text-ink outline-none')}
          />
        ) : (
          <button
            type="button"
            aria-label={`${label}: outro número`}
            title="Outro número"
            onClick={() => {
              setTyping(true)
              onChange('')
            }}
            className={cx(box, idle)}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
