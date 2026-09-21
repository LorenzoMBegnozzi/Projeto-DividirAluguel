import { useEffect, useState } from 'react'
import { FlaskConical } from 'lucide-react'
import { getMyListings } from '../api/listings'
import { getPayments, getPlan, simulatePayment } from '../api/billing'
import { apiErrorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../utils/format'
import type { Listing, Payment, PaymentStatus, Plan } from '../types'

const statusStyle: Record<PaymentStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-700',
  PAGO: 'bg-emerald-100 text-emerald-700',
  CANCELADO: 'bg-zinc-100 text-zinc-500',
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
    return <div className="p-8 text-center text-zinc-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Pagamentos</h1>
      <p className="mb-6 text-sm text-zinc-500">Anúncios extras e destaques que você comprou.</p>

      {plan?.simulatedMode && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Ambiente de teste: os pagamentos são simulados. Use o botão "Simular pagamento" para confirmar — nenhuma
            cobrança real é feita.
          </span>
        </div>
      )}

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {plan && (
        <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-zinc-400">Anúncios grátis</p>
            <p className="text-lg font-semibold text-zinc-800">
              {plan.freeListingsUsed} de {plan.freeListings} em uso
            </p>
          </div>
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-zinc-400">Créditos de anúncio extra</p>
            <p className="text-lg font-semibold text-zinc-800">{plan.extraCredits} disponível(is)</p>
          </div>
        </div>
      )}

      {payments.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Você ainda não fez nenhuma compra. Em "Meus anúncios" dá para comprar um anúncio extra ou destacar um anúncio.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-zinc-800">{describe(payment)}</p>
                  <p className="text-sm text-zinc-500">
                    {formatMoney(payment.amount)} · criado em {formatDateTime(payment.createdAt)}
                    {payment.paidAt && ` · pago em ${formatDateTime(payment.paidAt)}`}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${statusStyle[payment.status]}`}>
                  {statusLabel[payment.status]}
                </span>
              </div>

              {payment.status === 'PENDENTE' && plan?.simulatedMode && (
                <button
                  onClick={() => handleSimulate(payment.id)}
                  disabled={confirmingId === payment.id}
                  className="mt-3 w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {confirmingId === payment.id ? 'Confirmando...' : 'Simular pagamento'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
