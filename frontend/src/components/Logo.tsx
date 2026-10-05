import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { homePath } from '../utils/profile'

// Marca do RachaAi. Tamanhos e variantes fixos (não aceita className de tamanho/cor):
//   size  sm  ícone 20 px + texto 16 px  → cabeçalhos compactos
//         md  ícone 28 px + texto 20 px  → NavBar, header e rodapé da landing (padrão)
//         lg  ícone 36 px + texto 28 px  → topo das telas de autenticação e de fluxo isolado
//   variant full (ícone + nome) | mark (só o ícone: favicon, espaços apertados)
//   tone    auto (segue o tema) | inverse (sobre fundo escuro em qualquer tema)
// Respiro mínimo: metade da altura do ícone em volta; tamanho mínimo: ícone de 20 px.
// O desenho do ícone é o mesmo do favicon e dos ícones do PWA (public/).

export type LogoSize = 'sm' | 'md' | 'lg'

const markSize: Record<LogoSize, string> = { sm: 'size-5', md: 'size-7', lg: 'size-9' }
const textSize: Record<LogoSize, string> = { sm: 'text-logo-sm', md: 'text-logo-md', lg: 'text-logo-lg' }

export function LogoMark({ size = 'md', className = '' }: { size?: LogoSize; className?: string }) {
  return (
    <svg viewBox="0 0 26 26" className={`${markSize[size]} shrink-0 ${className}`} aria-hidden="true">
      <path d="M12.2 3 3 10.4V23h9.2z" fill="var(--color-brand)" />
      <path d="M13.8 3 23 10.4V23h-9.2z" fill="var(--color-coral-bright)" />
    </svg>
  )
}

export default function Logo({ size = 'md', variant = 'full', tone = 'auto' }: { size?: LogoSize; variant?: 'full' | 'mark'; tone?: 'auto' | 'inverse' }) {
  if (variant === 'mark') return <LogoMark size={size} />
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold leading-none tracking-tight ${textSize[size]} ${tone === 'inverse' ? 'text-on-inverse' : 'text-ink'}`}>
      <LogoMark size={size} />
      <span>
        Racha<span className={tone === 'inverse' ? 'text-brand-tint' : 'text-brand'}>Ai</span>
      </span>
    </span>
  )
}

/** Logo que leva para a home certa: landing deslogado, tela inicial do app logado. */
export function LogoLink({ size, className = '' }: { size?: LogoSize; className?: string }) {
  const { user } = useAuth()
  const to = user ? homePath(user) : '/'
  return (
    <Link to={to} aria-label={user ? 'RachaAi, tela inicial' : 'RachaAi, página inicial'} className={`inline-flex rounded-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus ${className}`}>
      <Logo size={size} />
    </Link>
  )
}
