import client from './client'
import type { AdvertiserKind, AuthResponse, Role } from '../types'

export function register(data: {
  name: string
  email: string
  password: string
  birthDate: string
  cpf: string
  role: Role
  advertiserKind: AdvertiserKind | null
}) {
  return client.post<AuthResponse>('/auth/register', data).then((res) => res.data)
}

export function login(data: { email: string; password: string }) {
  return client.post<AuthResponse>('/auth/login', data).then((res) => res.data)
}

export function fetchMe() {
  return client.get<AuthResponse['user']>('/users/me').then((res) => res.data)
}

export interface ForgotPasswordResult {
  message: string
  resetToken: string | null
}

export function forgotPassword(email: string) {
  return client.post<ForgotPasswordResult>('/auth/esqueci-senha', { email }).then((res) => res.data)
}

export function resetPassword(token: string, newPassword: string) {
  return client.post('/auth/redefinir-senha', { token, newPassword })
}
