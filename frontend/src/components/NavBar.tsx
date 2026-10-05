import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Menu, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import NotificationBell from './NotificationBell'
import Avatar from './Avatar'
import { LogoLink } from './Logo'
import { Button } from './ui'
import ThemeToggle from './ThemeToggle'
import InstallAppButton from './InstallAppButton'

// item da barra: sublinhado de 3 px na aba ativa (mesma cor de ação da marca)
const linkClass = ({ isActive }: { isActive: boolean }) =>
  `relative flex h-15 items-center gap-1.5 px-3 text-small font-semibold transition-colors duration-(--dur-fast) after:absolute after:inset-x-3 after:-bottom-px after:h-0.75 after:rounded-t-sm focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ${
    isActive ? 'text-ink after:bg-brand' : 'text-ink-2 after:bg-transparent hover:text-ink'
  }`

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex min-h-11 items-center gap-2 rounded-md px-3 text-small font-semibold transition-colors ${
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
    <header className="sticky top-0 z-(--z-sticky) border-b border-line bg-surface">
      <div className="mx-auto flex h-15 max-w-4xl items-center justify-between px-4">
        <LogoLink />

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
            <Button
              variant="ghost"
              size="sm"
              icon={mobileOpen ? X : Menu}
              onClick={() => setMobileOpen((prev) => !prev)}
              aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
              aria-expanded={mobileOpen}
            />
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
