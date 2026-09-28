import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/**
 * Só deixa administradores verem a página. É só conveniência de navegação: quem protege de
 * verdade é o backend (/api/admin/** exige ROLE_ADMIN).
 */
export default function AdminRoute({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  if (user && !user.admin) {
    return <Navigate to="/" replace />
  }
  return <>{children}</>
}
