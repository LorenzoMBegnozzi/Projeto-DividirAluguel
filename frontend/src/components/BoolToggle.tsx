interface Props {
  label: string
  value: boolean | null
  onChange: (value: boolean | null) => void
  trueLabel?: string
  falseLabel?: string
}

export default function BoolToggle({ label, value, onChange, trueLabel = 'Sim', falseLabel = 'Não' }: Props) {
  const base = 'flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition'
  return (
    <div>
      <p className="mb-1 text-sm font-medium text-zinc-700">{label}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => onChange(value === true ? null : true)}
          className={`${base} ${value === true ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500 hover:border-brand-300'}`}
        >
          {trueLabel}
        </button>
        <button
          type="button"
          onClick={() => onChange(value === false ? null : false)}
          className={`${base} ${value === false ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500 hover:border-brand-300'}`}
        >
          {falseLabel}
        </button>
      </div>
    </div>
  )
}
