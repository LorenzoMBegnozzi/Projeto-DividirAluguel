import client from './client'
import type { BrowseItem, ConversationSummary, Message } from '../types'

export interface BrowseFilters {
  bairro?: string
  lat?: number
  lng?: number
  precoMax?: number
}

export function browseRoommates(filters: BrowseFilters = {}) {
  return client.get<BrowseItem[]>('/browse/roommates', { params: filters }).then((res) => res.data)
}

export function browseEstablishments(filters: BrowseFilters = {}) {
  return client.get<BrowseItem[]>('/browse/establishments', { params: filters }).then((res) => res.data)
}

export function startConversation(listingId: number) {
  return client.post<ConversationSummary>('/conversations', { listingId }).then((res) => res.data)
}

export function startConversationWithInterested(listingId: number, otherUserId: number) {
  return client
    .post<ConversationSummary>('/conversations/interessados', { listingId, otherUserId })
    .then((res) => res.data)
}

export function getConversations() {
  return client.get<ConversationSummary[]>('/conversations').then((res) => res.data)
}

export function getConversation(conversationId: number) {
  return client.get<ConversationSummary>(`/conversations/${conversationId}`).then((res) => res.data)
}

export function getMessages(conversationId: number) {
  return client.get<Message[]>(`/conversations/${conversationId}/messages`).then((res) => res.data)
}

export function sendMessage(conversationId: number, content: string) {
  return client.post<Message>(`/conversations/${conversationId}/messages`, { content }).then((res) => res.data)
}
