// Conta do simulador de quem anuncia, separada do componente para dar para conferir à parte.
// Regras (as mesmas da cobrança, ver ListingService/BillingService no backend):
//  - até `freeListings` anúncios ativos ao mesmo tempo são grátis e não vencem;
//  - do (free + 1)º em diante, cada anúncio extra custa `extraListingPrice` e vale `extraListingDays`;
//  - o destaque no topo é avulso: `highlightPrice` por `highlightDays`.
import { formatMoney } from '../../utils/format'
import type { PublicPrices } from '../../types'

/**
 * Padrão do backend (application.yml: FREE_LISTINGS, EXTRA_LISTING_PRICE, HIGHLIGHT_PRICE…).
 * Só aparece, esmaecido, enquanto o GET /billing/precos não responde, para o cartão não mudar
 * de tamanho quando os valores chegam. O valor que vale é sempre o da API.
 */
export const DEFAULT_PRICES: PublicPrices = { freeListings: 3, extraListingPrice: 1, extraListingDays: 30, highlightPrice: 1, highlightDays: 30 }

export function simulate(n: number, highlight: boolean, p: PublicPrices) {
  const free = Math.min(n, p.freeListings)
  const extra = Math.max(0, n - p.freeListings)
  const extraCost = extra * p.extraListingPrice
  const hlCost = highlight ? p.highlightPrice : 0
  const total = extraCost + hlCost

  const head = `${n} ${n === 1 ? 'anúncio' : 'anúncios'} →`
  const parts = [`${free} grátis`]
  if (extra) parts.push(`${extra} × ${formatMoney(p.extraListingPrice)}`)
  if (highlight) parts.push(`destaque ${formatMoney(p.highlightPrice)}`)

  let period: string
  if (!total) period = 'sem prazo para vencer'
  else if (extra && highlight && p.extraListingDays !== p.highlightDays) period = `extras por ${p.extraListingDays} dias, destaque por ${p.highlightDays} dias`
  else period = `por ${extra ? p.extraListingDays : p.highlightDays} dias`

  return { free, extra, total, line: `${head} ${parts.join(' + ')} = ${formatMoney(total)}`, period }
}
