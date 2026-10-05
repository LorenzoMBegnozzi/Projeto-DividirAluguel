import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { paymentMethodLabels, syncPayment } from '../api/billing'
import { apiErrorMessage } from '../api/client'
import { formatMoney } from '../utils/format'
import type { Payment } from '../types'

/**
 * Para onde o Mercado Pago manda a pessoa depois de pagar (ou desistir):
 * /pagamentos/retorno?pagamento=<id>&...parâmetros do Mercado Pago.
 *
 * Os parâmetros do Mercado Pago na URL (status=approved...) são IGNORADOS: qualquer um pode digitá-los.
 * A página pergunta ao backend, que pergunta ao Mercado Pago. Pix pode levar alguns segundos, então
 * enquanto estiver pendente a página confere de novo a cada 5 s (por até 2 minutos).
 */
export default function PaymentReturnPage() {
  const [params] = useSearchParams()
  const paymentId = Number(params.get('pagamento'))
  const [payment, setPayment] = useState<Payment | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [giveUp, setGiveUp] = useState(false)
  const attempts = useRef(0)

  useEffect(() => {
    if (!paymentId) {
      setError('Pagamento não informado.')
      return
    }
    let timer: ReturnType<typeof setTimeout>
    let stopped = false
    const check = async () => {
      try {
        const result = await syncPayment(paymentId)
        if (stopped) return
        setPayment(result)
        attempts.current += 1
        if (result.status === 'PENDENTE' && result.gatewayStatus !== 'rejected') {
          if (attempts.current < 24) {
            timer = setTimeout(check, 5000)
          } else {
            setGiveUp(true)
          }
        }
      } catch (err) {
        if (!stopped) setError(apiErrorMessage(err, 'Não foi possível conferir o pagamento'))
      }
    }
    check()
    return () => {
      stopped = true
      clearTimeout(timer)
    }
  }, [paymentId])

  const what = payment?.type === 'DESTAQUE' ? 'Seu anúncio está em destaque no topo da busca.' : 'Você ganhou 1 crédito de anúncio extra: já pode publicar.'
  const rejected = payment?.status === 'PENDENTE' && payment.gatewayStatus === 'rejected'

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8 text-center">
        {error ? (
          <>
            <XCircle className="mx-auto mb-3 h-10 w-10 text-danger" aria-hidden="true" />
            <h1 className="mb-2 text-xl font-serif font-medium text-ink">Não deu para conferir</h1>
            <p className="mb-6 text-sm text-ink-2">{error}</p>
          </>
        ) : !payment ? (
          <p className="text-ink-3">Conferindo o pagamento com o Mercado Pago…</p>
        ) : payment.status === 'PAGO' ? (
          <>
            <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-leaf" aria-hidden="true" />
            <h1 className="mb-2 text-xl font-serif font-medium text-ink">Pagamento aprovado!</h1>
            <p className="mb-1 text-sm text-ink-2">{what}</p>
            <p className="mb-6 text-[13px] text-ink-3">
              {formatMoney(payment.amount)}
              {payment.method && ` · ${paymentMethodLabels[payment.method] ?? payment.method}`}
            </p>
          </>
        ) : rejected ? (
          <>
            <XCircle className="mx-auto mb-3 h-10 w-10 text-danger" aria-hidden="true" />
            <h1 className="mb-2 text-xl font-serif font-medium text-ink">Pagamento recusado</h1>
            <p className="mb-6 text-sm text-ink-2">Nada foi cobrado. Tente de novo com outro cartão ou use o Pix.</p>
            {payment.checkoutUrl && (
              <a href={payment.checkoutUrl} className="mb-3 inline-flex h-[42px] items-center rounded-md bg-brand px-6 text-sm font-semibold text-on-brand hover:bg-brand-strong">
                Tentar de novo
              </a>
            )}
          </>
        ) : payment.status === 'CANCELADO' ? (
          <>
            <XCircle className="mx-auto mb-3 h-10 w-10 text-ink-3" aria-hidden="true" />
            <h1 className="mb-6 text-xl font-serif font-medium text-ink">Compra cancelada</h1>
          </>
        ) : (
          <>
            <Clock className="mx-auto mb-3 h-10 w-10 text-mel" aria-hidden="true" />
            <h1 className="mb-2 text-xl font-serif font-medium text-ink">Aguardando o pagamento</h1>
            <p className="mb-6 text-sm text-ink-2">
              {giveUp
                ? 'Ainda não recebemos a confirmação. Se você já pagou, ela aparece em Pagamentos em alguns minutos.'
                : 'Se você pagou com Pix, a confirmação leva alguns segundos. Esta página se atualiza sozinha.'}
            </p>
          </>
        )}
        <div className="flex flex-col gap-2">
          <Link to="/anuncio" className="text-sm font-semibold text-brand hover:text-brand-strong">
            Ir para Meus anúncios
          </Link>
          <Link to="/pagamentos" className="text-sm font-semibold text-ink-3 hover:text-ink">
            Ver pagamentos
          </Link>
        </div>
      </div>
    </div>
  )
}
