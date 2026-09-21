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

export function simulatePayment(id: number) {
  return client.post<Payment>(`/billing/payments/${id}/simulate`).then((res) => res.data)
}
