import { Link } from 'react-router-dom'
import Logo from '../../components/Logo'
import { LEGAL } from '../legal/legalVersion'

// O e-mail de contato só aparece depois de preenchido em legalVersion.ts (hoje é um [MARCADOR]).
const contactEmail = LEGAL.supportEmail.startsWith('[') ? null : LEGAL.supportEmail

const sections = [
  { title: 'Produto', links: [['Como funciona', '#como-funciona'], ['Experimente', '#experimente'], ['Recursos', '#recursos'], ['Preços', '#precos'], ['Dúvidas', '#duvidas']] },
  { title: 'Conta', links: [['Criar conta', '/registro'], ['Entrar', '/login']] },
  { title: 'Legal', links: [['Termos de Uso', '/termos'], ['Política de Privacidade', '/privacidade']] },
] as const

export default function LandingFooter() {
  return (
    <footer className="mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6">
      <div className="grid gap-10 border-t border-line pt-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo className="text-lg" />
          <p className="mt-3 max-w-xs text-sm text-ink-3">Para achar com quem dividir o aluguel em Maringá, sem grupo de WhatsApp.</p>
          {contactEmail && (
            <a href={`mailto:${contactEmail}`} className="mt-3 inline-block text-sm font-semibold text-brand hover:underline">{contactEmail}</a>
          )}
        </div>
        {sections.map((s) => (
          <nav key={s.title} aria-label={s.title}>
            <p className="landing-kicker mb-4">{s.title}</p>
            <ul className="space-y-2.5">
              {s.links.map(([label, to]) => (
                <li key={to}>
                  {to.startsWith('#')
                    ? <a href={to} className="text-sm text-ink-2 transition hover:text-ink">{label}</a>
                    : <Link to={to} className="text-sm text-ink-2 transition hover:text-ink">{label}</Link>}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <p className="mt-12 text-xs text-ink-3">© {new Date().getFullYear()} RachaAi · feito em Maringá</p>
    </footer>
  )
}
