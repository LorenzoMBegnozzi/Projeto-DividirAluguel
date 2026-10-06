import { useState } from 'react'
import { RangeSlider, cx, focusRing } from '../ui'
import { STEP, brl, effectiveRange, type PriceRange, type PriceStats } from './price'

// Bloco "Valor por mês" do painel de filtros: mínimo e máximo editáveis, histograma e a barra
// de duas alças. Roda no navegador: a lista muda enquanto a alça anda.

export default function PriceFilter({ stats, value, onChange, matching }: {
  stats: PriceStats
  value: PriceRange | null
  onChange: (r: PriceRange | null) => void
  /** quantos anúncios caem na faixa (com os outros filtros valendo) */
  matching: number
}) {
  const shown: PriceRange = value ?? [stats.min, stats.max]
  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <ValueBox label="Mínimo" value={shown[0]} stats={stats} onCommit={(n) => onChange(effectiveRange([n, shown[1]], stats))} />
        <span aria-hidden="true" className="mb-5 h-0.5 w-3 shrink-0 rounded-full bg-line-strong" />
        <ValueBox label="Máximo" value={shown[1]} stats={stats} plus={shown[1] >= stats.max} onCommit={(n) => onChange(effectiveRange([shown[0], n], stats))} />
      </div>
      <RangeSlider
        className="mt-3"
        min={stats.min}
        max={stats.max}
        step={STEP}
        value={shown}
        histogram={stats.histogram}
        label="Valor por mês"
        format={(n) => (n >= stats.max ? `${brl(n)} ou mais` : brl(n))}
        onChange={(r) => onChange(effectiveRange(r, stats))}
      />
      <div className="mt-1 flex min-h-11 items-center justify-between gap-3">
        <p className="text-caption text-ink-3" aria-live="polite">
          {matching === 1 ? '1 anúncio nessa faixa' : `${matching} anúncios nessa faixa`}
        </p>
        {value && (
          <button type="button" onClick={() => onChange(null)} className={cx('min-h-11 rounded-sm px-2 text-small font-semibold text-brand hover:underline', focusRing)}>
            Limpar
          </button>
        )}
      </div>
    </div>
  )
}

/** Caixa com o valor; tocar permite digitar (confirma ao sair do campo ou com Enter). */
function ValueBox({ label, value, stats, plus, onCommit }: {
  label: string; value: number; stats: PriceStats; plus?: boolean; onCommit: (n: number) => void
}) {
  // fora da edição o campo mostra o valor da alça; ao focar, vira rascunho até confirmar
  const [draft, setDraft] = useState(String(value))
  const [editing, setEditing] = useState(false)
  const commit = () => {
    setEditing(false)
    const n = Number(draft.replace(/\D/g, ''))
    if (!Number.isFinite(n) || draft.trim() === '') return setDraft(String(value))
    onCommit(Math.min(stats.max, Math.max(stats.min, Math.round(n / STEP) * STEP)))
  }
  return (
    <label className="min-w-0 flex-1">
      <span className="text-label uppercase text-ink-3">{label}</span>
      <span className="mt-1 flex h-11 items-center gap-1 rounded-md border border-field bg-surface px-3 focus-within:border-brand focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
        <span className="text-small font-semibold text-ink-3">R$</span>
        <input
          inputMode="numeric"
          value={editing ? draft : value.toLocaleString('pt-BR')}
          onFocus={() => { setEditing(true); setDraft(String(value)) }}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur() }}
          className="w-full min-w-0 bg-transparent text-body font-semibold text-ink outline-none"
        />
        {plus && <span className="text-small font-semibold text-ink-3">+</span>}
      </span>
    </label>
  )
}
