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
  acceptTerms: boolean
}) {
  return client.post<AuthResponse>('/auth/register', data).then((res) => res.data)
}

export function login(data: { email: string; password: string }) {
  return client.post<AuthResponse>('/auth/login', data).then((res) => res.data)
}

/** Invalida todos os logins abertos da conta no servidor (o token atual também deixa de valer). */
// O token vai explícito: quem chama apaga o token do navegador logo em seguida, antes de o
// interceptor do axios (assíncrono) ter lido.
export function logout(token: string) {
  return client.post('/auth/logout', null, { headers: { Authorization: `Bearer ${token}` } })
}

/** Link do e-mail de confirmação. */
export function confirmEmail(token: string) {
  return client.post('/auth/confirmar-email', { token })
}

// ---------------------------------------------------------------- login com Google

/** null = login com Google desligado no servidor (sem GOOGLE_CLIENT_ID): o botão não aparece. */
export function googleConfig() {
  return client.get<{ clientId: string | null }>('/auth/google/config').then((res) => res.data)
}

export type GoogleLoginResponse =
  | { status: 'LOGGED_IN'; token: string; user: AuthResponse['user'] }
  | { status: 'SIGNUP_REQUIRED'; signupToken: string; name: string; email: string }

/** credential = o token que o botão do Google entrega ao site. */
export function googleLogin(credential: string) {
  return client.post<GoogleLoginResponse>('/auth/google', { credential }).then((res) => res.data)
}

/** Tela "falta pouco": completa o cadastro de quem entrou com o Google pela primeira vez. */
export function googleSignup(data: {
  signupToken: string
  birthDate: string
  cpf: string
  role: Role
  advertiserKind: AdvertiserKind | null
  acceptTerms: boolean
}) {
  return client.post<AuthResponse>('/auth/google/cadastro', data).then((res) => res.data)
}

export function fetchMe() {
  return client.get<AuthResponse['user']>('/users/me').then((res) => res.data)
}

export interface ForgotPasswordResult {
  message: string
}

export function forgotPassword(email: string) {
  return client.post<ForgotPasswordResult>('/auth/esqueci-senha', { email }).then((res) => res.data)
}

export function resetPassword(token: string, newPassword: string) {
  return client.post('/auth/redefinir-senha', { token, newPassword })
}
