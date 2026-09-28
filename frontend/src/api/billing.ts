import client from './client'
import type { Payment, PaymentType, Plan } from '../types'

export function getPlan() {
  return client.get<Plan>('/billing/plan').then((res) => res.data)
}

export function getPayments() {
  return client.get<Payment[]>('/billing/payments').then((res) => res.data)
}

export function createPayment(type: PaymentType, listingId?: number) {
  return client.post<Payment>('/billing/payments', { type, listingId }).then((res) => res.data)
}

/** Pergunta ao Mercado Pago como está o pagamento (a confirmação nunca vem da URL de retorno). */
export function syncPayment(id: number) {
  return client.post<Payment>(`/billing/payments/${id}/sincronizar`).then((res) => res.data)
}

export function cancelPayment(id: number) {
  return client.post<Payment>(`/billing/payments/${id}/cancelar`).then((res) => res.data)
}

/** Depois de criar a compra: com Mercado Pago vai para o checkout; no modo simulado, para a tela de pagamentos. */
export function goToCheckout(payment: Payment, navigate: (path: string) => void) {
  if (payment.checkoutUrl) {
    window.location.href = payment.checkoutUrl
  } else {
    navigate('/pagamentos')
  }
}

export const paymentMethodLabels: Record<string, string> = {
  pix: 'Pix',
  credit_card: 'Cartão de crédito',
  debit_card: 'Cartão de débito',
  prepaid_card: 'Cartão pré-pago',
  account_money: 'Saldo do Mercado Pago',
}

export function simulatePayment(id: number) {
  return client.post<Payment>(`/billing/payments/${id}/simulate`).then((res) => res.data)
}
