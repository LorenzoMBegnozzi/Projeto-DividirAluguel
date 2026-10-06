import { useCallback, useEffect, useState } from 'react'
import { CreditCard, FlaskConical, ShieldCheck } from 'lucide-react'
import { getMyListings } from '../api/listings'
import { cancelPayment, getPayments, getPlan, paymentMethodLabels, simulatePayment, syncPayment } from '../api/billing'
import { apiErrorMessage } from '../api/client'
import { formatDateTime, formatMoney } from '../utils/format'
import type { Listing, Payment, PaymentStatus, Plan } from '../types'
import { Alert, Badge, Button, Card, Columns, EmptyState, Page, PageHeader, buttonClass, cx, kickerClass } from '../components/ui'
import type { BadgeTone } from '../components/ui'

const statusTone: Record<PaymentStatus, BadgeTone> = {
  PENDENTE: 'warning',
  PAGO: 'success',
  CANCELADO: 'danger',
  REEMBOLSADO: 'neutral',
}

const statusLabel: Record<PaymentStatus, string> = {
  PENDENTE: 'Pendente',
  PAGO: 'Pago',
  CANCELADO: 'Cancelado',
  REEMBOLSADO: 'Reembolsado',
}


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
    <Page>
      <PageHeader title="Pagamentos" description="Anúncios extras e destaques que você comprou." />

      {/* computador: avisos e resumo do plano à esquerda (presos ao rolar); histórico à direita */}
      <Columns asideWidth="md" aside={(
      <div className="flex flex-col gap-3">
      {plan?.paymentMode === 'SIMULADO' && (
        <Alert tone="warning" icon={FlaskConical}>
          Ambiente de teste: os pagamentos são simulados. Use o botão "Simular pagamento" para confirmar — nenhuma
          cobrança real é feita.
        </Alert>
      )}
      {plan?.paymentMode === 'MERCADOPAGO' && (
        <div className="flex items-start gap-2.5 rounded-md bg-surface-sunk px-3.5 py-2.5 text-small text-ink-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-leaf" aria-hidden="true" />
          <span>
            Pagamento seguro pelo <strong className="text-ink">Mercado Pago</strong>: Pix, cartão de crédito ou débito. Os
            dados do cartão ficam só com o Mercado Pago.
          </span>
        </div>
      )}

      {plan && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <Card padding="sm">
            <p className={kickerClass}>Anúncios grátis</p>
            <p className="text-h3 tabular-nums text-ink">
              {plan.freeListingsUsed} de {plan.freeListings} em uso
            </p>
          </Card>
          <Card padding="sm">
            <p className={kickerClass}>Créditos de anúncio extra</p>
            <p className="text-h3 tabular-nums text-ink">{plan.extraCredits} disponível(is)</p>
          </Card>
        </div>
      )}
      </div>
      )}>

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {payments.length === 0 ? (
        <EmptyState title="Você ainda não fez nenhuma compra.">
          Em "Meus anúncios" dá para comprar um anúncio extra ou destacar um anúncio.
        </EmptyState>
      ) : (
        <div className="flex flex-col gap-3">
          {payments.map((payment) => (
            <Card key={payment.id} padding="sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-body font-semibold text-ink">{describe(payment)}</p>
                  <p className="text-caption text-ink-3">
                    <span className="tabular-nums">{formatMoney(payment.amount)}</span> · criado em{' '}
                    {formatDateTime(payment.createdAt)}
                    {payment.paidAt && ` · pago em ${formatDateTime(payment.paidAt)}`}
                    {payment.status === 'PAGO' && payment.method && ` · ${paymentMethodLabels[payment.method] ?? payment.method}`}
                  </p>
                  {payment.status === 'PENDENTE' && payment.gatewayStatus === 'rejected' && (
                    <p className="mt-1 text-caption text-danger">A última tentativa foi recusada. Tente de novo ou use outro meio.</p>
                  )}
                  {payment.status === 'PENDENTE' &&
                    (payment.gatewayStatus === 'pending' || payment.gatewayStatus === 'in_process') && (
                      <p className="mt-1 text-caption text-mel">Aguardando a confirmação do Mercado Pago.</p>
                    )}
                </div>
                <Badge tone={statusTone[payment.status]} className="shrink-0">
                  {statusLabel[payment.status]}
                </Badge>
              </div>

              {payment.status === 'PENDENTE' && (
                <div className="mt-3 flex gap-2">
                  {payment.checkoutUrl ? (
                    <a href={payment.checkoutUrl} className={cx(buttonClass(), 'flex-1')}>
                      <CreditCard className="size-4 shrink-0" aria-hidden="true" />
                      Pagar agora
                    </a>
                  ) : (
                    plan?.simulatedMode && (
                      <Button
                        onClick={() => run(payment.id, () => simulatePayment(payment.id), 'Não foi possível confirmar o pagamento')}
                        disabled={busyId === payment.id}
                        className="flex-1"
                      >
                        {busyId === payment.id ? 'Confirmando…' : 'Simular pagamento'}
                      </Button>
                    )
                  )}
                  <Button
                    variant="secondary"
                    onClick={() => run(payment.id, () => cancelPayment(payment.id), 'Não foi possível cancelar')}
                    disabled={busyId === payment.id}
                    className="max-w-32.5 flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
      </Columns>
    </Page>
  )
}
