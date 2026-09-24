import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.renter ? '/browse' : '/anuncio'} replace />
}
