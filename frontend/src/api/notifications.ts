import client from './client'
import type { AppNotification } from '../types'

export function getNotifications() {
  return client.get<AppNotification[]>('/notificacoes').then((res) => res.data)
}

export function getUnreadCount() {
  return client.get<{ count: number }>('/notificacoes/nao-lidas').then((res) => res.data.count)
}

export function markNotificationRead(id: number) {
  return client.post(`/notificacoes/${id}/lida`)
}

export function markAllNotificationsRead() {
  return client.post('/notificacoes/lidas')
}
