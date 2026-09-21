import client from './client'
import type { BlockedUser, ReportReason } from '../types'

export function blockUser(bloqueadoId: number) {
  return client.post<BlockedUser>('/bloqueios', { bloqueadoId }).then((res) => res.data)
}

export function unblockUser(bloqueadoId: number) {
  return client.delete(`/bloqueios/${bloqueadoId}`)
}

export function getBlockedUsers() {
  return client.get<BlockedUser[]>('/bloqueios').then((res) => res.data)
}

export function reportUser(denunciadoId: number, motivo: ReportReason, descricao: string, conversaId?: number) {
  return client
    .post('/denuncias', { denunciadoId, motivo, descricao: descricao || null, conversaId: conversaId ?? null })
    .then((res) => res.data)
}
