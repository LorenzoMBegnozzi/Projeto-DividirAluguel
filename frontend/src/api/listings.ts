import client from './client'
import type { Listing, ListingType, UserProfile } from '../types'

export interface ListingPayload {
  type: ListingType
  title: string
  description: string
  preferredNeighborhood: string
  nearCollege: string
  price: number | null
  availableSlots: number | null
  address: string | null
  latitude: number | null
  longitude: number | null
  acceptsPets: boolean | null
  acceptsSmoker: boolean | null
}

export function getMyListings() {
  return client.get<Listing[]>('/listings/mine').then((res) => res.data)
}

export function getListing(id: number) {
  return client.get<Listing>(`/listings/${id}`).then((res) => res.data)
}

export function createListing(payload: ListingPayload) {
  return client.post<Listing>('/listings', payload).then((res) => res.data)
}

export function deleteListing(id: number) {
  return client.delete(`/listings/${id}`)
}

export function getListingChatContacts(id: number) {
  return client.get<UserProfile[]>(`/listings/${id}/contatos-chat`).then((res) => res.data)
}

export function markListingUnavailable(id: number, closedWithUserId: number | null) {
  return client.post<Listing>(`/listings/${id}/indisponivel`, { closedWithUserId }).then((res) => res.data)
}

export function markListingAvailable(id: number) {
  return client.post<Listing>(`/listings/${id}/disponivel`).then((res) => res.data)
}

export function getListingPhotos(id: number) {
  return client.get<string[]>(`/listings/${id}/fotos`).then((res) => res.data)
}

export function uploadListingPhoto(id: number, file: File) {
  const form = new FormData()
  form.append('file', file)
  return client.post(`/listings/${id}/fotos`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export function deleteListingPhoto(id: number, photoUrl: string) {
  const photoId = photoUrl.split('/').pop()
  return client.delete(`/listings/${id}/fotos/${photoId}`)
}
