import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { isProfileComplete } from '../utils/profile'

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Quem procura vaga precisa completar o perfil (usado no cálculo de compatibilidade e
  // no filtro de vaga por sexo) antes de usar o resto do site.
  if (user.renter && !isProfileComplete(user) && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}
