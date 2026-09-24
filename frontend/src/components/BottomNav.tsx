import { NavLink } from 'react-router-dom'
import { Search, ClipboardList, MessageCircle, User } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const itemClass = ({ isActive }: { isActive: boolean }) =>
  `flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-[11px] font-semibold transition ${
    isActive ? 'text-brand' : 'text-ink-3 hover:text-ink-2'
  }`

export default function BottomNav() {
  const { user } = useAuth()

  if (!user) return null

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {user.renter && (
        <NavLink to="/browse" className={itemClass} end>
          <Search className="h-5 w-5" aria-hidden="true" />
          Buscar
        </NavLink>
      )}
      {user.advertiser && (
        <NavLink to="/anuncio" className={itemClass} end>
          <ClipboardList className="h-5 w-5" aria-hidden="true" />
          Anúncios
        </NavLink>
      )}
      <NavLink to="/conversas" className={itemClass}>
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
        Chat
      </NavLink>
      <NavLink to="/perfil" className={itemClass}>
        <User className="h-5 w-5" aria-hidden="true" />
        Perfil
      </NavLink>
    </nav>
  )
}
