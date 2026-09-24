interface Props {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  trueLabel?: string
  falseLabel?: string
}

export default function BoolToggle({ label, value, onChange, trueLabel = 'Sim', falseLabel = 'Não' }: Props) {
  const base = 'h-[34px] flex-1 rounded-[7px] text-sm font-semibold transition'
  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-ink">{label}</p>
      <div className="inline-grid min-w-[200px] grid-flow-col auto-cols-fr gap-[3px] rounded-md border border-line-strong bg-surface p-[3px]">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`${base} ${value === true ? 'bg-inverse text-on-inverse' : 'text-ink-2 hover:bg-surface-sunk hover:text-ink'}`}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`${base} ${value === false ? 'bg-inverse text-on-inverse' : 'text-ink-2 hover:bg-surface-sunk hover:text-ink'}`}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  )
}
