import client from './client'
import type { UserProfile } from '../types'

export interface InterestStatus {
  interested: boolean
  total: number
}

export function getInterestStatus(listingId: number) {
  return client.get<InterestStatus>(`/listings/${listingId}/interest`).then((res) => res.data)
}

export function markInterest(listingId: number) {
  return client.post<InterestStatus>(`/listings/${listingId}/interest`).then((res) => res.data)
}

export function unmarkInterest(listingId: number) {
  return client.delete<InterestStatus>(`/listings/${listingId}/interest`).then((res) => res.data)
}

export function getInterestedPeople(listingId: number) {
  return client.get<UserProfile[]>(`/listings/${listingId}/interest/people`).then((res) => res.data)
}
