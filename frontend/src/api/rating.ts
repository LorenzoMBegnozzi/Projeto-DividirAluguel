import client from './client'
import type { Avaliacao, AvaliacaoResumo, Convivio } from '../types'

export function proposeConvivio(outroUsuarioId: number, periodoInicio: string, periodoFim: string) {
  return client
    .post<Convivio>('/convivios', { outroUsuarioId, periodoInicio, periodoFim: periodoFim || null })
    .then((res) => res.data)
}

export function getMyConvivios() {
  return client.get<Convivio[]>('/convivios').then((res) => res.data)
}

export function confirmConvivio(id: number) {
  return client.post<Convivio>(`/convivios/${id}/confirmar`).then((res) => res.data)
}

export function declineConvivio(id: number) {
  return client.post<Convivio>(`/convivios/${id}/recusar`).then((res) => res.data)
}

export function rateUser(
  convivioId: number,
  notaPontualidade: number,
  notaConvivencia: number,
  comentario: string,
) {
  return client
    .post<Avaliacao>('/avaliacoes', { convivioId, notaPontualidade, notaConvivencia, comentario: comentario || null })
    .then((res) => res.data)
}

export function getUserRatings(userId: number) {
  return client.get<Avaliacao[]>(`/usuarios/${userId}/avaliacoes`).then((res) => res.data)
}

export function getUserRatingsSummary(userId: number) {
  return client.get<AvaliacaoResumo>(`/usuarios/${userId}/avaliacoes/resumo`).then((res) => res.data)
}
