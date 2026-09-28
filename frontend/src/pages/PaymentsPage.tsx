import { useCallback, useEffect, useState } from 'react'
import { CreditCard, FlaskConical, ShieldCheck } from 'lucide-react'
import { getMyListings } from '../api/listings'
import { cancelPayment, getPayments, getPlan, paymentMethodLabels, simulatePayment, syncPayment } from '../api/billing'
import { apiErrorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../utils/format'
import type { Listing, Payment, PaymentStatus, Plan } from '../types'

const statusStyle: Record<PaymentStatus, string> = {
  PENDENTE: 'bg-mel-tint text-mel',
  PAGO: 'bg-leaf-tint text-leaf',
  CANCELADO: 'bg-surface-sunk text-ink-2',
  REEMBOLSADO: 'bg-surface-sunk text-ink-2',
}

const statusLabel: Record<PaymentStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
}

const buttonBase = 'h-[42px] flex-1 rounded-md text-sm font-semibold transition disabled:opacity-60'

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)

  const load = useCallback(async () => {
    try {
      const [paymentList, listingList, planInfo] = await Promise.all([getPayments(), getMyListings(), getPlan()])
      // Quem pagou e fechou a página antes de voltar ao site: confere no Mercado Pago ao abrir a tela.
      const pendingAtGateway = paymentList.filter((p) => p.status === 'PENDENTE' && p.checkoutUrl)
      const synced = await Promise.all(pendingAtGateway.map((p) => syncPayment(p.id).catch(() => p)))
      const byId = new Map(synced.map((p) => [p.id, p]))
      setPayments(paymentList.map((p) => byId.get(p.id) ?? p))
      setListings(listingList)
      setPlan(planInfo)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível carregar seus pagamentos'))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  async function run(id: number, action: () => Promise<unknown>, fallback: string) {
    setBusyId(id)
    setError(null)
    try {
      await action()
      await load()
    } catch (err) {
      setError(apiErrorMessage(err, fallback))
    } finally {
      setBusyId(null)
    }
  }

  function describe(payment: Payment) {
    if (payment.type === 'ANUNCIO_EXTRA') {
      const usedBy = listings.find((l) => l.id === payment.listingId)
      if (payment.status !== 'PAGO') return `Anúncio extra (${plan?.extraListingDays ?? 30} dias)`
      return usedBy ? `Anúncio extra usado em "${usedBy.title}"` : 'Anúncio extra (crédito disponível)'
    }
    const target = listings.find((l) => l.id === payment.listingId)
    return `Destaque de ${plan?.highlightDays ?? 30} dias${target ? ` em "${target.title}"` : ''}`
  }

  if (loading) {
    return <div className="p-8 text-center text-ink-3">Carregando…</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-[28px] font-extrabold tracking-tight text-ink">Pagamentos</h1>
      <p className="mb-6 text-sm text-ink-3">Anúncios extras e destaques que você comprou.</p>

      {plan?.paymentMode === 'SIMULADO' && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-mel-tint px-4 py-3 text-sm text-mel">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Ambiente de teste: os pagamentos são simulados. Use o botão "Simular pagamento" para confirmar — nenhuma
            cobrança real é feita.
          </span>
        </div>
      )}
      {plan?.paymentMode === 'MERCADOPAGO' && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-surface-sunk px-4 py-3 text-sm text-ink-2">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-leaf" aria-hidden="true" />
          <span>
            Pagamento seguro pelo <strong className="text-ink">Mercado Pago</strong>: Pix, cartão de crédito ou débito. Os
            dados do cartão ficam só com o Mercado Pago.
          </span>
        </div>
      )}

      {error && <div className="mb-4 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">{error}</div>}

      {plan && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Anúncios grátis</p>
            <p className="text-lg font-bold text-ink">
              {plan.freeListingsUsed} de {plan.freeListings} em uso
            </p>
          </div>
          <div className="rounded-lg border border-line bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-3">Créditos de anúncio extra</p>
            <p className="text-lg font-bold text-ink">{plan.extraCredits} disponível(is)</p>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-8 text-center text-sm text-ink-3">
          Você ainda não fez nenhuma compra. Em "Meus anúncios" dá para comprar um anúncio extra ou destacar um anúncio.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-lg border border-line bg-surface p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-ink">{describe(payment)}</p>
                  <p className="text-[13px] text-ink-3">
                    <span className="tabular-nums">{formatMoney(payment.amount)}</span> · criado em{' '}
                    {formatDateTime(payment.createdAt)}
                    {payment.paidAt && ` · pago em ${formatDateTime(payment.paidAt)}`}
                    {payment.status === 'PAGO' && payment.method && ` · ${paymentMethodLabels[payment.method] ?? payment.method}`}
                  </p>
                  {payment.status === 'PENDENTE' && payment.gatewayStatus === 'rejected' && (
                    <p className="mt-1 text-[13px] text-danger">A última tentativa foi recusada. Tente de novo ou use outro meio.</p>
                  )}
                  {payment.status === 'PENDENTE' &&
                    (payment.gatewayStatus === 'pending' || payment.gatewayStatus === 'in_process') && (
                      <p className="mt-1 text-[13px] text-mel">Aguardando a confirmação do Mercado Pago.</p>
                    )}
                </div>
                <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-bold ${statusStyle[payment.status]}`}>
                  {statusLabel[payment.status]}
                </span>
              </div>

              {payment.status === 'PENDENTE' && (
                <div className="mt-3 flex gap-2">
                  {payment.checkoutUrl ? (
                    <a
                      href={payment.checkoutUrl}
                      className={`${buttonBase} inline-flex items-center justify-center gap-2 bg-brand text-on-brand hover:bg-brand-strong`}
                    >
                      <CreditCard className="h-4 w-4" aria-hidden="true" />
                      Pagar agora
                    </a>
                  ) : (
                    plan?.simulatedMode && (
                      <button
                        onClick={() => run(payment.id, () => simulatePayment(payment.id), 'Não foi possível confirmar o pagamento')}
                        disabled={busyId === payment.id}
                        className={`${buttonBase} bg-brand text-on-brand hover:bg-brand-strong`}
                      >
                        {busyId === payment.id ? 'Confirmando…' : 'Simular pagamento'}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => run(payment.id, () => cancelPayment(payment.id), 'Não foi possível cancelar')}
                    disabled={busyId === payment.id}
                    className={`${buttonBase} max-w-[130px] border border-line-strong text-ink-2 hover:border-ink hover:text-ink`}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
