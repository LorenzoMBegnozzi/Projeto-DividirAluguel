import client from './client'
import type { UserProfile, Routine } from '../types'

export interface ProfilePayload {
  smoker: boolean | null
  drinksAlcohol: boolean | null
  vegetarian: boolean | null
  hasPets: boolean | null
  likesAnimals: boolean | null
  allergies: string
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
