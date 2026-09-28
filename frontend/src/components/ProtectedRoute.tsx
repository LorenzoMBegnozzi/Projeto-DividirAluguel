import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isAdminAllowedPath, isProfileComplete } from '../utils/profile'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Conta de admin é só de moderação: o resto do site (anunciar, pagar, conversar) leva para /admin.
  if (user.admin) {
    return isAdminAllowedPath(location.pathname) ? <>{children}</> : <Navigate to="/admin" replace />
  }

  // Quem procura vaga precisa completar o perfil (usado no cálculo de compatibilidade e
  // no filtro de vaga por sexo) antes de usar o resto do site.
  if (user.renter && !isProfileComplete(user) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
