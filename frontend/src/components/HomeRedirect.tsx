import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePath } from '../utils/profile'

export default function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  return <Navigate to={homePath(user)} replace />
}
