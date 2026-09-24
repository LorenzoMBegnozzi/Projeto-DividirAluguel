import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { getMyListings } from '../api/listings'
import { getPayments, getPlan, simulatePayment } from '../api/billing'
import { apiErrorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../utils/format'
import type { Listing, Payment, PaymentStatus, Plan } from '../types'

const statusStyle: Record<PaymentStatus, string> = {
  PENDENTE: 'bg-mel-tint text-mel',
  PAGO: 'bg-leaf-tint text-leaf',
  CANCELADO: 'bg-surface-sunk text-ink-2',
}

const statusLabel: Record<PaymentStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [listings, setListings] = useState<Listing[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [confirmingId, setConfirmingId] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    Promise.all([getPayments(), getMyListings(), getPlan()])
      .then(([paymentList, listingList, planInfo]) => {
        setPayments(paymentList)
        setListings(listingList)
        setPlan(planInfo)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar seus pagamentos')))
      .finally(() => setLoading(false))
  }

  async function handleSimulate(id: number) {
    setConfirmingId(id)
    setError(null)
    try {
      await simulatePayment(id)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível confirmar o pagamento'))
    } finally {
      setConfirmingId(null)
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

      {plan?.simulatedMode && (
        <div className="mb-4 flex items-start gap-2 rounded-md bg-mel-tint px-4 py-3 text-sm text-mel">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Ambiente de teste: os pagamentos são simulados. Use o botão "Simular pagamento" para confirmar — nenhuma
            cobrança real é feita.
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
                  </p>
                </div>
                <span className={`shrink-0 rounded-sm px-2 py-1 text-xs font-bold ${statusStyle[payment.status]}`}>
                  {statusLabel[payment.status]}
                </span>
              </div>

              {payment.status === 'PENDENTE' && plan?.simulatedMode && (
                <button
                  onClick={() => handleSimulate(payment.id)}
                  disabled={confirmingId === payment.id}
                  className="mt-3 h-[42px] w-full rounded-md bg-brand text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
                >
                  {confirmingId === payment.id ? 'Confirmando…' : 'Simular pagamento'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
