import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `px-3 py-2 rounded-lg text-sm font-medium transition ${
    isActive ? 'bg-brand-600 text-white' : 'text-zinc-600 hover:bg-zinc-100'
  }`

export default function NavBar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!user) return null

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <span className="text-lg font-bold text-brand-600">RachaAi</span>
        <nav className="flex items-center gap-1">
          {user.role === 'RENTER' && (
            <NavLink to="/browse" className={linkClass}>
              Buscar
            </NavLink>
          )}
          <NavLink to="/anuncio" className={linkClass}>
            {user.role === 'RENTER' ? 'Minha busca' : 'Meus anúncios'}
          </NavLink>
          {user.role === 'ADVERTISER' && (
            <NavLink to="/pagamentos" className={linkClass}>
              Pagamentos
            </NavLink>
          )}
          <NavLink to="/conversas" className={linkClass}>
            Conversas
          </NavLink>
          <NavLink to="/convivios" className={linkClass}>
            Convívios
          </NavLink>
          <NavLink to="/perfil" className={linkClass}>
            Meu perfil
          </NavLink>
          <NotificationBell />
          <button
            onClick={() => {
              logout()
              navigate('/login')
            }}
            className="ml-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
          >
            Sair
          </button>
        </nav>
      </div>
    </header>
  )
}
