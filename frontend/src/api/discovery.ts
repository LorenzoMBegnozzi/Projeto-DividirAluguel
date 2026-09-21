import client from './client'
import type { BrowseItem, ConversationSummary, Message } from '../types'

export function browseRoommates() {
  return client.get<BrowseItem[]>('/browse/roommates').then((res) => res.data)
}

export function browseEstablishments() {
  return client.get<BrowseItem[]>('/browse/establishments').then((res) => res.data)
}

export function startConversation(listingId: number) {
  return client.post<ConversationSummary>('/conversations', { listingId }).then((res) => res.data)
}

export function getConversations() {
  return client.get<ConversationSummary[]>('/conversations').then((res) => res.data)
}

export function getMessages(conversationId: number) {
  return client.get<Message[]>(`/conversations/${conversationId}/messages`).then((res) => res.data)
}

export function sendMessage(conversationId: number, content: string) {
  return client.post<Message>(`/conversations/${conversationId}/messages`, { content }).then((res) => res.data)
}
