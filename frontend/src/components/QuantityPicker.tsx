import { useState } from 'react'
import { Plus } from 'lucide-react'

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

  const box =
    'inline-flex h-[40px] min-w-[40px] items-center justify-center rounded-md border text-sm font-semibold tabular-nums transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus'
  const idle = 'border-line-strong bg-surface text-ink-2 hover:border-ink hover:text-ink'
  const selected = 'border-inverse bg-inverse text-on-inverse'

  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-ink">{label}</p>
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
              className={`${box} ${active ? selected : idle}`}
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
            className={`${box} w-[72px] border-inverse bg-surface px-2 text-center text-ink outline-none`}
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
            className={`${box} ${idle}`}
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
          </button>
        )}
      </div>
    </div>
  )
}
