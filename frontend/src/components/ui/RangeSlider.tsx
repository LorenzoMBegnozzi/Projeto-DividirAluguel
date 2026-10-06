import { cx } from './styles'

/**
 * Barra com duas alças (mínimo e máximo). Por baixo são dois <input type="range"> nativos
 * sobrepostos: teclado, toque e leitor de tela funcionam sem nada extra. O visual das alças
 * fica em index.css (.range-input). Opcional: histograma de quantos itens há em cada faixa.
 */
export default function RangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  label,
  format = String,
  histogram,
  className,
}: {
  min: number
  max: number
  step?: number
  value: [number, number]
  onChange: (value: [number, number]) => void
  /** nome do controle para leitor de tela ("Valor por mês") */
  label: string
  format?: (n: number) => string
  /** contagem por faixa, da esquerda para a direita (mesma escala da barra) */
  histogram?: number[]
  className?: string
}) {
  const [lo, hi] = value
  const span = Math.max(1, max - min)
  const pct = (n: number) => ((n - min) / span) * 100
  // a alça nativa anda de 22 px até (largura − 22 px): o trecho azul e o histograma acompanham isso
  const at = (p: number) => `calc(22px + (100% - 44px) * ${p / 100})`
  const peak = Math.max(1, ...(histogram ?? [0]))
  // quando as duas alças se encostam no fim, a de baixo precisa ficar por cima para poder voltar
  const loOnTop = lo >= max - step

  return (
    <div className={className}>
      {histogram && (
        <div aria-hidden="true" className="flex h-12 items-end gap-0.5 px-5.5">
          {histogram.map((n, i) => {
            const a = min + (span * i) / histogram.length, b = min + (span * (i + 1)) / histogram.length
            const inside = b > lo && a < hi
            return (
              <span
                key={i}
                className={cx('flex-1 rounded-t-xs transition-colors duration-(--dur-base)', inside ? 'bg-brand' : 'bg-line')}
                style={{ height: n ? `${Math.max(12, (n / peak) * 100)}%` : '3px', opacity: inside ? 0.85 : 1 }}
              />
            )
          })}
        </div>
      )}
      <div className="relative h-11">
        <span aria-hidden="true" className="absolute inset-x-5.5 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-line" />
        <span
          aria-hidden="true"
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-brand"
          style={{ left: at(pct(lo)), width: `calc((100% - 44px) * ${(pct(hi) - pct(lo)) / 100})` }}
        />
        <input
          type="range"
          className={cx('range-input', loOnTop && 'z-(--z-raised)')}
          min={min}
          max={max}
          step={step}
          value={lo}
          aria-label={`${label}: mínimo`}
          aria-valuetext={format(lo)}
          onChange={(e) => onChange([Math.min(Number(e.target.value), hi - step), hi])}
        />
        <input
          type="range"
          className="range-input"
          min={min}
          max={max}
          step={step}
          value={hi}
          aria-label={`${label}: máximo`}
          aria-valuetext={format(hi)}
          onChange={(e) => onChange([lo, Math.max(Number(e.target.value), lo + step)])}
        />
      </div>
    </div>
  )
}
