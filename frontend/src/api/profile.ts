import client from './client'
import type { AllergyTag, Diet, DrinkingHabit, PetPreference, Routine, SmokingHabit, UserProfile } from '../types'

export interface ProfilePayload {
  smokingHabit: SmokingHabit | null
  drinkingHabit: DrinkingHabit | null
  diet: Diet | null
  petPreferences: PetPreference[]
  allergyTags: AllergyTag[]
  allergyOther: string
  musicTaste: string
  routine: Routine | null
  bio: string
  occupation: string
}

export function updateProfile(payload: ProfilePayload) {
  return client.put<UserProfile>('/users/me/profile', payload).then((res) => res.data)
}

export function getUser(id: number) {
  return client.get<UserProfile>(`/users/${id}`).then((res) => res.data)
}

export function searchUsers(query: string) {
  return client.get<UserProfile[]>('/users', { params: { q: query } }).then((res) => res.data)
}

export function acceptSafetyTerms() {
  return client.post<UserProfile>('/users/me/aceitar-termos').then((res) => res.data)
}

export function uploadPhoto(file: File) {
  const form = new FormData()
  form.append('file', file)
  return client.post('/users/me/foto', form, { headers: { 'Content-Type': 'multipart/form-data' } })
}

export function removePhoto() {
  return client.delete('/users/me/foto')
}
