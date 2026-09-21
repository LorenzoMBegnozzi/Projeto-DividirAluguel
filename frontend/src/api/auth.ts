import client from './client'
import type { AuthResponse, Role } from '../types'

export function register(data: {
  name: string
  email: string
  password: string
  birthDate: string
  cpf: string
  role: Role
}) {
  return client.post<AuthResponse>('/auth/register', data).then((res) => res.data)
}

export function login(data: { email: string; password: string }) {
  return client.post<AuthResponse>('/auth/login', data).then((res) => res.data)
}

export function fetchMe() {
  return client.get<AuthResponse['user']>('/users/me').then((res) => res.data)
}
