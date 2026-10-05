import { lazy, Suspense, useRef, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowDown, ArrowRight, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { homePath } from '../utils/profile'
import type { LandingMode } from '../landing3d/Landing3D'
import { hero, modes, promises } from './landing/content'
import { useRevealEach } from './landing/motion'
import LandingHeader from './landing/LandingHeader'
import RotatingWords from './landing/RotatingWords'
import CompatDemo from './landing/CompatDemo'
import PhoneStory from './landing/phone/PhoneStory'
import Bento from './landing/Bento'
import PricingSection from './landing/PricingSection'
import FaqSection from './landing/FaqSection'
import CtaSplit from './landing/CtaSplit'
import LandingFooter from './landing/LandingFooter'
import { Alert } from '../components/ui'
import './home.css'

// O palco 3D (Three.js + GSAP) é um chunk separado: só quem abre a landing baixa.
const Landing3D = lazy(() => import('../landing3d/Landing3D'))

// Ordem da página: topo com o 3D → como funciona (celular 3D que viaja com a rolagem, ver
// landing/phone) → "Experimente" (a compatibilidade na prática) → recursos em mosaico →
// preços → dúvidas → chamada final. Cada seção ocupa a largura toda, sem caixas em volta.

export default function HomePage() {
  const { user, loading } = useAuth()
  // `mode` = o que foi escolhido; `shown` = o texto na tela. Com o 3D carregado, o
  // texto só troca no pico da animação; sem ele, troca na hora.
  const [mode, setMode] = useState<LandingMode>('procurar')
  const [shown, setShown] = useState<LandingMode>('procurar')
  const ready3d = useRef(false)
  const mainRef = useRevealEach()

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-paper text-ink-3">Carregando…</div>
  }

  if (user) {
    return <Navigate to={homePath(user)} replace />
  }

  const accountDeleted = new URLSearchParams(window.location.search).has('conta-excluida')
  const copy = hero[shown]
  const tone = shown === 'procurar' ? 'brand' : 'coral'

  function choose(next: LandingMode) {
    setMode(next)
    if (!ready3d.current) setShown(next)
  }

  return (
    <div className="landing-root min-h-screen bg-paper" data-mode={shown}>
      <LandingHeader />

      <main ref={mainRef} id="topo">
        {accountDeleted && (
          <Alert tone="success" className="mx-auto mt-20 max-w-6xl text-center font-semibold">
            Sua conta foi excluída e seus dados pessoais foram apagados.
          </Alert>
        )}

        {/* TOPO */}
        <section className="landing-hero">
          {modes.map((m) => (
            <div key={m.id} className={`landing-bg${mode === m.id ? ' is-active' : ''}`} data-mode={m.id} aria-hidden="true" />
          ))}
          <div className="landing-grid-bg" aria-hidden="true" />
          <div className="mx-auto grid max-w-6xl items-center gap-6 px-4 pb-10 pt-28 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:gap-4 lg:pb-16 lg:pt-36">
            <div className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-left">
              <div className="mode-switch" role="group" aria-label="Você está procurando ou anunciando?" data-mode={mode}>
                <span className="mode-switch-thumb" aria-hidden="true" />
                {modes.map((m) => (
                  <button key={m.id} type="button" aria-pressed={mode === m.id} onClick={() => choose(m.id)}>
                    {m.label}
                  </button>
                ))}
              </div>

              <div key={shown} className="flex flex-col items-center gap-6 lg:items-start" aria-live="polite">
                <h1 className="hero-title">
                  <span className="hero-lead">{copy.lead}</span>{' '}
                  <RotatingWords words={copy.words} className={shown === 'procurar' ? 'text-brand' : 'text-coral'} />
                </h1>
                <p className="hero-text max-w-lg text-lead text-ink-2">{copy.text}</p>
              </div>

              <div className="hero-actions flex flex-wrap items-center justify-center gap-3 lg:justify-start">
                <Link to={`/registro?perfil=${shown}`} className="landing-btn" data-tone={tone}>
                  {copy.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#experimente" className="landing-btn" data-tone="ghost">
                  Ver como combina <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </a>
              </div>

              <ul className="hero-promises flex flex-wrap justify-center gap-x-5 gap-y-2 lg:justify-start">
                {promises.map((p) => (
                  <li key={p} className="flex items-center gap-1.5 text-caption font-semibold text-ink-3">
                    <Check className="size-3.5 text-leaf" aria-hidden="true" />{p}
                  </li>
                ))}
              </ul>
            </div>

            <Suspense fallback={<div className="aspect-[5/4] max-h-[520px] w-full" />}>
              <Landing3D mode={mode} onPeak={setShown} onReady={() => { ready3d.current = true }} />
            </Suspense>
          </div>
        </section>

        <PhoneStory mode={shown} />

        <section id="experimente" className="landing-section landing-section-alt">
          <div className="mx-auto max-w-6xl px-4 sm:px-6"><CompatDemo /></div>
        </section>

        <section id="recursos" className="landing-section landing-section-alt">
          <div className="mx-auto max-w-6xl px-4 sm:px-6"><Bento /></div>
        </section>

        <section id="precos" className="landing-section">
          <div className="mx-auto max-w-6xl px-4 sm:px-6"><PricingSection /></div>
        </section>

        <section id="duvidas" className="landing-section landing-section-alt">
          <div className="mx-auto max-w-6xl px-4 sm:px-6"><FaqSection /></div>
        </section>

        <section className="landing-section">
          <div className="mx-auto max-w-6xl px-4 sm:px-6"><CtaSplit /></div>
        </section>
      </main>

      <LandingFooter />
    </div>
  )
}
