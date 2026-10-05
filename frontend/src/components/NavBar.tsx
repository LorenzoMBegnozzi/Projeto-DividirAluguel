import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import Avatar from './Avatar'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import InstallAppButton from './InstallAppButton'

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

  // Conta de admin só modera: não vê as áreas de anunciar, pagar e conversar.
  const isAdmin = user.admin
  const isAdvertiser = user.advertiser && !isAdmin
  const hasMobileMenu = isAdvertiser

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface">
      <div className="mx-auto flex h-[60px] max-w-4xl items-center justify-between px-4">
        <Link to="/" aria-label="RachaAi - página inicial">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-0.5 lg:flex">
          {user.renter && !isAdmin && (
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
          {!isAdmin && (
            <NavLink to="/conversas" className={linkClass}>
              Conversas
            </NavLink>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={linkClass}>
              <ShieldCheck className="h-4 w-4" aria-hidden="true" />
              Admin
            </NavLink>
          )}
          <NavLink to="/perfil" className={linkClass}>
            <Avatar photoUrl={user.photoUrl} name={user.name} size={24} />
            Meu perfil
          </NavLink>
          <InstallAppButton className="ml-1" />
          <ThemeToggle />
          {!isAdmin && <NotificationBell />}
        </nav>

        <div className="flex items-center gap-1 lg:hidden">
          <InstallAppButton />
          <ThemeToggle />
          {!isAdmin && <NotificationBell />}
          {hasMobileMenu && (
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

      {hasMobileMenu && mobileOpen && (
        <nav className="flex flex-col gap-0.5 border-t border-line bg-surface px-4 py-2 lg:hidden">
          {isAdvertiser && (
            <NavLink to="/pagamentos" className={mobileLinkClass} onClick={() => setMobileOpen(false)}>
              Pagamentos
            </NavLink>
          )}
        </nav>
      )}
    </header>
  )
}
