import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { clearToken, getToken, setToken } from '../api/client'
import { fetchMe, googleLogin as googleLoginRequest, googleSignup as googleSignupRequest, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/auth'
import { clearPendingGoogleSignup, savePendingGoogleSignup } from '../utils/googleSignup'
import type { AdvertiserKind, Role, UserProfile } from '../types'

interface AuthContextValue {
  user: UserProfile | null
  loading: boolean
  login: (email: string, password: string, remember?: boolean) => Promise<void>
  register: (
    name: string,
    email: string,
    password: string,
    birthDate: string,
    cpf: string,
    role: Role,
    advertiserKind: AdvertiserKind | null,
    acceptTerms: boolean,
  ) => Promise<void>
  /** "Continuar com Google": entra (true) ou guarda o cadastro pendente para a tela "falta pouco" (false). */
  googleLogin: (credential: string, preferredRole?: Role | null) => Promise<boolean>
  completeGoogleSignup: (data: Parameters<typeof googleSignupRequest>[0]) => Promise<void>
  logout: () => void
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refreshUser = useCallback(async () => {
    const token = getToken()
    if (!token) {
      setUser(null)
      return
    }
    try {
      const me = await fetchMe()
      setUser(me)
    } catch {
      clearToken()
      setUser(null)
    }
  }, [])

  useEffect(() => {
    refreshUser().finally(() => setLoading(false))
  }, [refreshUser])

  async function login(email: string, password: string, remember = true) {
    const res = await loginRequest({ email, password })
    setToken(res.token, remember)
    setUser(res.user)
  }

  async function register(
    name: string,
    email: string,
    password: string,
    birthDate: string,
    cpf: string,
    role: Role,
    advertiserKind: AdvertiserKind | null,
    acceptTerms: boolean,
  ) {
    const res = await registerRequest({ name, email, password, birthDate, cpf, role, advertiserKind, acceptTerms })
    setToken(res.token, true)
    setUser(res.user)
  }

  async function googleLogin(credential: string, preferredRole: Role | null = null) {
    const res = await googleLoginRequest(credential)
    if (res.status === 'LOGGED_IN') {
      setToken(res.token, true)
      setUser(res.user)
      return true
    }
    savePendingGoogleSignup({ signupToken: res.signupToken, name: res.name, email: res.email, role: preferredRole })
    return false
  }

  async function completeGoogleSignup(data: Parameters<typeof googleSignupRequest>[0]) {
    const res = await googleSignupRequest(data)
    clearPendingGoogleSignup()
    setToken(res.token, true)
    setUser(res.user)
  }

  function logout() {
    // Avisa o servidor para o token deixar de valer (em todos os aparelhos). Se falhar (sem
    // internet, token já vencido), sai do mesmo jeito neste navegador.
    const token = getToken()
    if (token) logoutRequest(token).catch(() => {})
    clearToken()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, googleLogin, completeGoogleSignup, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider')
  }
  return ctx
}
