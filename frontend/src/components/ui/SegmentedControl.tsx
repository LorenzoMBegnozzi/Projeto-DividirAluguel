import { useRef } from 'react'
import type { KeyboardEvent } from 'react'
import { cx, focusRing } from './styles'

export interface SegmentOption<T extends string> {
  value: T
  label: string
}

/**
 * Seletor de 2+ opções com a pílula deslizando até a escolhida (mesmo gesto do
 * "Procuro vaga / Tenho vaga" da landing). Semântica de grupo de rádio: setas trocam a opção.
 */
export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
  tone = 'brand',
  className,
}: {
  options: SegmentOption<T>[]
  value: T
  onChange: (value: T) => void
  /** nome do grupo para leitor de tela */
  label: string
  /** cor da pílula; muda com transição (ex.: a busca fica coral em "imóvel") */
  tone?: 'brand' | 'coral'
  className?: string
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const index = Math.max(0, options.findIndex((o) => o.value === value))

  function onKeyDown(e: KeyboardEvent) {
    const step = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0
    if (!step) return
    e.preventDefault()
    const next = (index + step + options.length) % options.length
    onChange(options[next].value)
    refs.current[next]?.focus()
  }

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cx('relative grid h-11 rounded-full border border-line bg-surface p-1 shadow-sm', className)}
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      {/* a pílula: anda uma coluna inteira por opção */}
      <span
        aria-hidden="true"
        className={cx(
          'absolute inset-y-1 left-1 rounded-full transition-[transform,background-color] duration-(--dur-slow) ease-spring motion-reduce:transition-none',
          tone === 'coral' ? 'bg-coral' : 'bg-brand',
        )}
        style={{ width: `calc((100% - 0.5rem) / ${options.length})`, transform: `translateX(${index * 100}%)` }}
      />
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => { refs.current[i] = el }}
          type="button"
          role="radio"
          aria-checked={i === index}
          tabIndex={i === index ? 0 : -1}
          onClick={() => onChange(o.value)}
          className={cx(
            'relative z-(--z-raised) truncate rounded-full px-3 text-small font-semibold transition-colors duration-(--dur-base)',
            i === index ? 'text-on-brand' : 'text-ink-2 hover:text-ink',
            focusRing,
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
