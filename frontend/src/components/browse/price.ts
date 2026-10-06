// Regras do filtro de valor (faixas, histograma, rótulos). Componentes em PriceFilter.tsx.

export type PriceRange = [number, number]
export const STEP = 50
/** Escala fixa da barra: de R$ 0 a R$ 4.000 (a alça no fim = "R$ 4.000 ou mais"). */
export const PRICE_MIN = 0
export const PRICE_MAX = 4000
const BUCKETS = 20  // barras de R$ 200

export const brl = (n: number) => `R$ ${n.toLocaleString('pt-BR')}`

/** Limites da barra e o histograma dos preços da lista atual (acima de 4.000 cai na última barra). */
export function priceStats(prices: number[]) {
  const min = PRICE_MIN, max = PRICE_MAX
  const histogram = Array.from({ length: BUCKETS }, () => 0)
  for (const p of prices) histogram[Math.max(0, Math.min(BUCKETS - 1, Math.floor(((p - min) / (max - min)) * BUCKETS)))]++
  return { min, max, histogram }
}

/** A faixa escolhida, presa aos limites atuais; null quando cobre tudo (= sem filtro). */
export function effectiveRange(range: PriceRange | null, stats: ReturnType<typeof priceStats>): PriceRange | null {
  if (!range || !stats) return null
  const lo = Math.max(stats.min, Math.min(range[0], stats.max - STEP))
  const hi = Math.min(stats.max, Math.max(range[1], lo + STEP))
  return lo <= stats.min && hi >= stats.max ? null : [lo, hi]
}

/** Texto curto da faixa: "R$ 400 – R$ 900", "até R$ 900", "a partir de R$ 400". */
export function rangeLabel(r: PriceRange, stats: NonNullable<ReturnType<typeof priceStats>>) {
  if (r[0] <= stats.min) return `até ${brl(r[1])}`
  if (r[1] >= stats.max) return `a partir de ${brl(r[0])}`
  return `${brl(r[0])} – ${brl(r[1])}`
}

export type PriceStats = NonNullable<ReturnType<typeof priceStats>>
