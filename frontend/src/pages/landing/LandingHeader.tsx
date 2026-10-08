import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import ThemeToggle from '../../components/ThemeToggle'

const nav = [['Como funciona', '#como-funciona'], ['Experimente', '#experimente'], ['Preços', '#precos'], ['Dúvidas', '#duvidas']] as const

// Cabeçalho transparente sobre o topo; ganha fundo, desfoque e borda depois de rolar.
export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`landing-header${scrolled ? ' is-scrolled' : ''}`}>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        {/* nome da marca é longo: no celular o logo fica no tamanho pequeno para caber com os botões */}
        <a href="#topo" aria-label="Toc Toc Who?, voltar ao topo" className="shrink-0">
          <span className="sm:hidden"><Logo size="sm" /></span>
          <span className="hidden sm:inline"><Logo size="md" /></span>
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Seções">
          {nav.map(([label, href]) => (
            <a key={href} href={href} className="nav-link">{label}</a>
          ))}
        </nav>
        <div className="flex items-center gap-1 sm:gap-2">
          <ThemeToggle />
          {/* o wrapper esconde no celular: o display do .nav-link (CSS da landing) venceria o "hidden" */}
          <span className="hidden sm:inline"><Link to="/login" className="nav-link">Entrar</Link></span>
          <Link to="/registro" className="landing-btn landing-btn-sm" data-tone="ink">Criar conta</Link>
        </div>
      </div>
    </header>
  )
}
