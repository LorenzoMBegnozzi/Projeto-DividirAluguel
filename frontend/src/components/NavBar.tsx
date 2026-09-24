import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import Avatar from './Avatar'
import ThemeToggle from './ThemeToggle'

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex h-[60px] items-center gap-1.5 px-3 text-sm font-semibold transition after:absolute after:inset-x-3 after:-bottom-px after:h-[3px] after:rounded-t-[3px] ${
    isActive ? 'text-ink after:bg-brand' : 'text-ink-2 after:bg-transparent hover:text-ink'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-semibold transition ${
    isActive ? 'bg-surface-sunk text-ink' : 'text-ink-2 hover:bg-surface-sunk hover:text-ink'
  }`

export default function NavBar() {
  const { user } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  const isAdvertiser = user.advertiser

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex h-[60px] max-w-4xl items-center justify-between px-4">
        <Link to="/" aria-label="RachaAi - página inicial" className="text-xl font-black tracking-tight text-ink">
          Racha<span className="text-brand">Ai</span>
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {user.renter && (
            <NavLink to="/browse" className={linkClass}>
              Buscar
            </NavLink>
          )}
          {isAdvertiser && (
            <>
              <NavLink to="/anuncio" className={linkClass}>
                Meus anúncios
              </NavLink>
              <NavLink to="/pagamentos" className={linkClass}>
                Pagamentos
              </NavLink>
            </>
          )}
          <NavLink to="/conversas" className={linkClass}>
            Conversas
          </NavLink>
          <NavLink to="/perfil" className={linkClass}>
            <Avatar photoUrl={user.photoUrl} name={user.name} size={24} />
            Meu perfil
          </NavLink>
          <ThemeToggle className="ml-1" />
          <NotificationBell />
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <ThemeToggle />
          <NotificationBell />
          {isAdvertiser && (
            <button
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 transition hover:bg-surface-sunk hover:text-ink"
            >
              {mobileOpen ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
            </button>
          )}
        </div>
      </div>

      {isAdvertiser && mobileOpen && (
        <nav className="flex flex-col gap-0.5 border-t border-line bg-surface px-4 py-2 lg:hidden">
          <NavLink to="/pagamentos" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
            Pagamentos
          </NavLink>
        </nav>
      )}
    </header>
  )
}
