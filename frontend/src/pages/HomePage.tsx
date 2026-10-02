import { lazy, Suspense, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { Link, Navigate } from 'react-router-dom'
import LegalLinks from '../components/LegalLinks'
import { homePath } from '../utils/profile'
import { Home, MapPinned, MessageCircle, ShieldCheck, Sparkles, Users } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import ThemeToggle from '../components/ThemeToggle'
import { useReveal } from '../hooks/useReveal'
import type { LandingMode } from '../landing3d/Landing3D'
import './home.css'

// O palco 3D (Three.js + GSAP) é um chunk separado: só quem abre a landing baixa.
const Landing3D = lazy(() => import('../landing3d/Landing3D'))

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

const heroCopy: Record<LandingMode, { title: string; highlight: string; text: string; cta: string }> = {
  procurar: {
    title: 'Ache com quem dividir o aluguel, ',
    highlight: 'sem grupo de WhatsApp',
    text: 'O RachaAi combina seu perfil com o de outras pessoas e imóveis por compatibilidade, para você encontrar moradia com quem realmente combina com a sua rotina.',
    cta: 'Criar conta grátis',
  },
  anunciar: {
    title: 'Anuncie sua vaga para quem ',
    highlight: 'combina com você',
    text: 'Publique o quarto ou o imóvel com fotos e veja a compatibilidade de cada interessado antes de responder. Os 3 primeiros anúncios são grátis.',
    cta: 'Anunciar grátis',
  },
}

const modes: Array<{ id: LandingMode; label: string }> = [
  { id: 'procurar', label: 'Procuro vaga' },
  { id: 'anunciar', label: 'Tenho vaga' },
]

export default function HomePage() {
  const { user, loading } = useAuth()
  // `mode` = o que foi escolhido; `shown` = o texto na tela. Com o 3D carregado, o
  // texto só troca no pico da animação; sem ele, troca na hora.
  const [mode, setMode] = useState<LandingMode>('procurar')
  const [shown, setShown] = useState<LandingMode>('procurar')
  const ready3d = useRef(false)
  const featuresRef = useReveal<HTMLElement>()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (user) {
    return <Navigate to={homePath(user)} replace />
  }

  const accountDeleted = new URLSearchParams(window.location.search).has('conta-excluida')
  const copy = heroCopy[shown]

  function choose(next: LandingMode) {
    setMode(next)
    if (!ready3d.current) setShown(next)
  }

  return (
    <div className="min-h-screen bg-paper">
      {accountDeleted && (
        <p className="bg-leaf-tint px-4 py-3 text-center text-sm font-semibold text-leaf">
          Sua conta foi excluída e seus dados pessoais foram apagados.
        </p>
      )}
      <div className="landing-hero">
        {modes.map((m) => (
          <div key={m.id} className={`landing-bg${mode === m.id ? ' is-active' : ''}`} data-mode={m.id} aria-hidden="true" />
        ))}

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

        <section className="mx-auto grid max-w-5xl items-center gap-6 px-4 pb-12 pt-4 lg:grid-cols-[1.05fr_1fr] lg:gap-2 lg:pb-16 lg:pt-8">
          <div className="flex flex-col items-center gap-6 text-center lg:items-start lg:text-left">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-tint px-3 py-1 text-[13px] font-semibold text-brand-strong">
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              Feito para Maringá
            </span>

            <div className="mode-switch" role="group" aria-label="Você está procurando ou anunciando?" data-mode={mode}>
              <span className="mode-switch-thumb" aria-hidden="true" />
              {modes.map((m) => (
                <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => choose(m.id)}>
                  {m.label}
                </button>
              ))}
            </div>

            <div key={shown} className="landing-swap flex flex-col items-center gap-6 lg:items-start" aria-live="polite">
              <h1 className="max-w-2xl text-4xl font-extrabold leading-tight tracking-tight text-ink sm:text-5xl">
                {copy.title}
                <span className={shown === 'procurar' ? 'text-brand' : 'text-leaf'}>{copy.highlight}</span>
              </h1>
              <p className="max-w-xl text-lg text-ink-2">{copy.text}</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                to="/registro"
                className={`h-[46px] rounded-md px-8 text-center text-sm font-semibold leading-[46px] text-on-brand transition ${
                  shown === 'procurar' ? 'bg-brand hover:bg-brand-strong' : 'bg-leaf hover:brightness-110'
                }`}
              >
                {copy.cta}
              </Link>
              <Link
                to="/login"
                className="h-[46px] rounded-md border border-line-strong px-8 text-center text-sm font-semibold leading-[44px] text-ink-2 transition hover:border-ink hover:text-ink"
              >
                Já tenho conta
              </Link>
            </div>
          </div>

          <Suspense fallback={<div className="aspect-[5/4] max-h-[520px] w-full" />}>
            <Landing3D
              mode={mode}
              onPeak={setShown}
              onReady={() => { ready3d.current = true }}
            />
          </Suspense>
        </section>
      </div>

      <section ref={featuresRef} className="mx-auto grid max-w-5xl grid-cols-1 gap-4 px-4 pb-20 sm:grid-cols-2 lg:grid-cols-4">
        {features.map(({ icon: Icon, title, text }, i) => (
          <div key={title} className="reveal rounded-lg border border-line bg-surface p-5" style={{ '--i': i } as CSSProperties}>
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
