interface Option<T extends string> {
  value: T
  label: string
}

const chipClass = (selected: boolean) =>
  `inline-flex h-[34px] items-center gap-1.5 rounded-sm border px-3 text-[13px] font-semibold transition ${
    selected
      ? 'border-inverse bg-inverse text-on-inverse'
      : 'border-line-strong bg-surface text-ink-2 hover:border-ink hover:text-ink'
  }`

/** Seleção única: clicar de novo no chip selecionado limpa a escolha. */
export function ChipPicker<T extends string>({
  options,
  value,
  onChange,
}: {
  options: Option<T>[]
  value: T | null
  onChange: (value: T | null) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(value === option.value ? null : option.value)}
          className={chipClass(value === option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

/** Múltipla escolha: cada chip liga/desliga independente dos outros. */
export function ChipMultiPicker<T extends string>({
  options,
  values,
  onChange,
}: {
  options: Option<T>[]
  values: T[]
  onChange: (values: T[]) => void
}) {
  function toggle(option: T) {
    onChange(values.includes(option) ? values.filter((v) => v !== option) : [...values, option])
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => toggle(option.value)}
          className={chipClass(values.includes(option.value))}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
