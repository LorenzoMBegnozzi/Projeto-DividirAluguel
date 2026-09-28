import client from './client'
import type { ListingType } from '../types'

export type ReportStatus = 'ABERTA' | 'RESOLVIDA' | 'DESCARTADA'

export type ReportReason = 'COMPORTAMENTO_SUSPEITO' | 'GOLPE_OU_FRAUDE' | 'CONTEUDO_IMPROPRIO' | 'ASSEDIO' | 'OUTRO'

export interface AdminSummary {
  totalUsers: number
  blockedUsers: number
  activeListings: number
  openReports: number
  paidPayments: number
  pendingPayments: number
}

export interface AdminReportPerson {
  id: number
  name: string
  email: string
  blocked: boolean
  reportsReceived: number
}

export interface AdminReport {
  id: number
  reporter: AdminReportPerson
  reported: AdminReportPerson
  conversationId: number | null
  reason: ReportReason
  description: string | null
  status: ReportStatus
  createdAt: string
  resolvedAt: string | null
  resolvedByName: string | null
  adminNote: string | null
}

export interface AdminUser {
  id: number
  name: string
  email: string
  createdAt: string
  renter: boolean
  advertiser: boolean
  admin: boolean
  blocked: boolean
  blockedAt: string | null
  blockReason: string | null
  reportsReceived: number
  activeListings: number
}

export interface AdminListing {
  id: number
  title: string
  type: ListingType
  ownerId: number
  ownerName: string
  ownerBlocked: boolean
  active: boolean
  available: boolean
  highlighted: boolean
  createdAt: string
}

export const reportReasonLabels: Record<ReportReason, string> = {
  COMPORTAMENTO_SUSPEITO: 'Comportamento suspeito',
  GOLPE_OU_FRAUDE: 'Golpe ou fraude',
  CONTEUDO_IMPROPRIO: 'Conteúdo impróprio',
  ASSEDIO: 'Assédio',
  OUTRO: 'Outro',
}

export const reportStatusLabels: Record<ReportStatus, string> = {
  ABERTA: 'Aberta',
  RESOLVIDA: 'Resolvida',
  DESCARTADA: 'Descartada',
}

export function getAdminSummary() {
  return client.get<AdminSummary>('/admin/resumo').then((res) => res.data)
}

export function getAdminReports(status: ReportStatus | null) {
  return client
    .get<AdminReport[]>('/admin/denuncias', { params: status ? { status } : {} })
    .then((res) => res.data)
}

export function closeAdminReport(id: number, status: Exclude<ReportStatus, 'ABERTA'>, note: string, blockReported: boolean) {
  return client
    .post<AdminReport>(`/admin/denuncias/${id}/fechar`, { status, note, blockReported })
    .then((res) => res.data)
}

export function getAdminUsers(search: string) {
  return client.get<AdminUser[]>('/admin/usuarios', { params: { busca: search } }).then((res) => res.data)
}

export function blockAdminUser(id: number, reason: string) {
  return client.post<AdminUser>(`/admin/usuarios/${id}/bloquear`, { reason }).then((res) => res.data)
}

export function unblockAdminUser(id: number) {
  return client.post<AdminUser>(`/admin/usuarios/${id}/desbloquear`).then((res) => res.data)
}

export function getAdminListings(search: string) {
  return client.get<AdminListing[]>('/admin/anuncios', { params: { busca: search } }).then((res) => res.data)
}

export function deactivateAdminListing(id: number) {
  return client.post<AdminListing>(`/admin/anuncios/${id}/desativar`).then((res) => res.data)
}
