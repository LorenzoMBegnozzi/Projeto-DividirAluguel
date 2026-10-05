import { NavLink } from 'react-router-dom'
import { Search, ClipboardList, MessageCircle, ShieldCheck, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-micro font-semibold transition-colors ${
    isActive ? 'text-brand' : 'text-ink-3 hover:text-ink-2'
  }`

export default function BottomNav() {
  const { user } = useAuth()

  if (!user) return null

  // Conta de admin só modera: Admin e Perfil.
  const isAdmin = user.admin

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-(--z-sticky) flex border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      {user.renter && !isAdmin && (
        <NavLink to="/browse" className={itemClass} end>
          <Search className="h-5 w-5" aria-hidden="true" />
          Buscar
        </NavLink>
      )}
      {user.advertiser && !isAdmin && (
        <NavLink to="/anuncio" className={itemClass} end>
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          Anúncios
        </NavLink>
      )}
      {!isAdmin && (
        <NavLink to="/conversas" className={itemClass}>
          <MessageCircle className="h-5 w-5" aria-hidden="true" />
          Chat
        </NavLink>
      )}
      {isAdmin && (
        <NavLink to="/admin" className={itemClass}>
          <ShieldCheck className="h-5 w-5" aria-hidden="true" />
          Admin
        </NavLink>
      )}
      <NavLink to="/perfil" className={itemClass}>
        <User className="h-5 w-5" aria-hidden="true" />
        Perfil
      </NavLink>
    </nav>
  )
}
