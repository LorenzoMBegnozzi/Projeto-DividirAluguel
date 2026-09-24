import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import type { Role } from '../types'

export default function RoleRoute({ role, redirectTo, children }: { role: Role; redirectTo: string; children: ReactNode }) {
  const { user } = useAuth()
  const hasCapability = role === 'RENTER' ? user?.renter : user?.advertiser

  if (user && !hasCapability) {
    return <Navigate to={redirectTo} replace />
  }

  return <>{children}</>
}
