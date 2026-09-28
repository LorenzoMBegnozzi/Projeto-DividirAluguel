import { Link, Navigate } from 'react-router-dom'
import LegalLinks from '../components/LegalLinks'
import { homePath } from '../utils/profile'
import { Home, MapPinned, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'

const features = [
  {
    icon: Sparkles,
    title: 'Compatibilidade de verdade',
    text: 'Hábitos como fumo, bebida, alimentação e pets entram na conta. Você vê o quanto combina com cada pessoa antes de chamar.',
  },
  {
    icon: MapPinned,
    title: 'Perto de você',
    text: 'Filtre por bairro ou marque um ponto no mapa e veja só o que está por perto, com a faculdade ou o trabalho como referência.',
  },
  {
    icon: MessageCircle,
    title: 'Conversa direta',
    text: 'Sem curtida, sem espera. Encontrou alguém compatível? É só chamar para conversar.',
  },
  {
    icon: ShieldCheck,
    title: 'Mais segurança',
    text: 'Perfil verificado por CPF, avaliações de quem já morou junto e bloqueio/denúncia sempre à mão.',
  },
]

export default function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (user) {
    return <Navigate to={homePath(user)} replace />
  }

  const accountDeleted = new URLSearchParams(window.location.search).has('conta-excluida')

  return (
    <div className="min-h-screen bg-paper">
      {accountDeleted && (
        <p className="bg-leaf-tint px-4 py-3 text-center text-sm font-semibold text-leaf">
          Sua conta foi excluída e seus dados pessoais foram apagados.
        </p>
      )}
      <header className="mx-auto flex max-w-5xl items-center justify-between px-4 py-6">
        <span className="text-xl font-black tracking-tight text-ink">
          Racha<span className="text-brand">Ai</span>
        </span>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            to="/login"
            className="rounded-md border border-line-strong px-4 py-2 text-sm font-semibold text-ink-2 transition hover:border-ink hover:text-ink"
          >
            Entrar
          </Link>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pb-16 pt-8 text-center sm:pt-16">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-[13px] font-semibold text-brand-strong">
          <Home className="h-3.5 w-3.5" aria-hidden="true" />
          Feito para Maringá
        </span>
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
          Ache com quem dividir o aluguel, <span className="text-brand">sem grupo de WhatsApp</span>
        </h1>
        <p className="max-w-xl text-lg text-ink-2">
          O RachaAi combina seu perfil com o de outras pessoas e imóveis por compatibilidade, para você
          encontrar moradia com quem realmente combina com a sua rotina.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            to="/registro"
            className="h-[46px] rounded-md bg-brand px-8 text-center text-sm font-semibold leading-[46px] text-on-brand transition hover:bg-brand-strong"
          >
            Criar conta grátis
          </Link>
          <Link
            to="/login"
            className="h-[46px] rounded-md border border-line-strong px-8 text-center text-sm font-semibold leading-[44px] text-ink-2 transition hover:border-ink hover:text-ink"
          >
            Já tenho conta
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-lg border border-line bg-surface p-5">
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-md bg-brand-tint text-brand-strong">
              <Icon className="h-5 w-5" aria-hidden="true" />
            </div>
            <h2 className="mb-1 font-bold text-ink">{title}</h2>
            <p className="text-[13px] text-ink-3">{text}</p>
          </div>
        ))}
      </section>

      <section className="border-t border-line bg-surface">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-14 text-center">
          <Users className="h-8 w-8 text-brand" aria-hidden="true" />
          <h2 className="text-2xl font-extrabold tracking-tight text-ink">Procurando vaga ou anunciando um imóvel?</h2>
          <p className="max-w-lg text-ink-2">
            Cadastre-se de um jeito e ative o outro quando quiser, direto no seu perfil.
          </p>
          <Link
            to="/registro"
            className="h-[46px] rounded-md bg-brand px-8 text-center text-sm font-semibold leading-[46px] text-on-brand transition hover:bg-brand-strong"
          >
            Começar agora
          </Link>
        </div>
      </section>

      <footer className="border-t border-line px-4 py-6">
        <LegalLinks />
      </footer>
    </div>
  )
}
