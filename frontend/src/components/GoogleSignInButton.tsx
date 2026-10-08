import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { googleConfig } from '../api/auth'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import type { Role } from '../types'
import { Alert, cx } from './ui'

// Tipagem mínima do Google Identity Services (só o que usamos).
interface GoogleIdApi {
  initialize(config: { client_id: string; callback: (res: { credential: string }) => void; ux_mode?: 'popup' }): void
  renderButton(el: HTMLElement, options: Record<string, string | number>): void
}
declare global {
  interface Window {
    google?: { accounts: { id: GoogleIdApi } }
  }
}

// Config e script carregados uma vez por página, e só quando um botão aparece.
let configPromise: Promise<string | null> | null = null
let scriptPromise: Promise<GoogleIdApi> | null = null

function loadClientId() {
  configPromise ??= googleConfig().then((c) => c.clientId).catch(() => null)
  return configPromise
}

function loadGoogleScript() {
  scriptPromise ??= new Promise<GoogleIdApi>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.onload = () => (window.google ? resolve(window.google.accounts.id) : reject(new Error('Google indisponível')))
    script.onerror = () => {
      scriptPromise = null   // tenta de novo na próxima vez (ex.: estava sem internet)
      reject(new Error('Google indisponível'))
    }
    document.head.append(script)
  })
  return scriptPromise
}

/**
 * "Continuar com Google" (botão oficial do Google, que abre a escolha de conta num popup).
 * Já tem conta → entra e vai para a tela inicial. Conta nova → vai para a tela obrigatória
 * "falta pouco" (/completar-cadastro). Sem GOOGLE_CLIENT_ID no servidor, não aparece nada.
 *
 * @param preferredRole perfil já escolhido na tela de cadastro, para vir marcado no "falta pouco"
 */
export default function GoogleSignInButton({ text, preferredRole = null, className }: {
  text: 'continue_with' | 'signup_with'
  preferredRole?: Role | null
  className?: string
}) {
  const { googleLogin } = useAuth()
  const { theme } = useTheme()
  const navigate = useNavigate()
  const slotRef = useRef<HTMLDivElement>(null)
  const [clientId, setClientId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  // callback mais recente sem redesenhar o botão do Google a cada render
  const onCredential = useRef<(credential: string) => void>(() => {})

  useEffect(() => {
    onCredential.current = async (credential: string) => {
      setError(null)
      setBusy(true)
      try {
        const loggedIn = await googleLogin(credential, preferredRole)
        navigate(loggedIn ? '/' : '/completar-cadastro')
      } catch (err) {
        setError(apiErrorMessage(err, 'Não foi possível entrar com o Google'))
      } finally {
        setBusy(false)
      }
    }
  })

  useEffect(() => {
    let alive = true
    loadClientId().then((id) => { if (alive) setClientId(id) })
    return () => { alive = false }
  }, [])

  useEffect(() => {
    const slot = slotRef.current
    if (!clientId || !slot) return
    let alive = true
    loadGoogleScript()
      .then((gsi) => {
        if (!alive) return
        gsi.initialize({ client_id: clientId, callback: (res) => onCredential.current(res.credential), ux_mode: 'popup' })
        slot.replaceChildren()
        gsi.renderButton(slot, {
          type: 'standard',
          theme: theme === 'dark' ? 'filled_black' : 'outline',
          size: 'large',
          shape: 'pill',
          text,
          logo_alignment: 'center',
          locale: 'pt-BR',
          width: Math.min(400, Math.max(200, Math.round(slot.getBoundingClientRect().width))),
        })
      })
      .catch(() => { if (alive) setError('Não foi possível carregar o login com Google agora.') })
    return () => { alive = false }
  }, [clientId, theme, text])

  if (!clientId) return null

  return (
    <div className={cx('flex flex-col gap-3', className)}>
      <div className="flex items-center gap-3 text-caption text-ink-3" aria-hidden="true">
        <span className="h-px flex-1 bg-line" />ou<span className="h-px flex-1 bg-line" />
      </div>
      <div ref={slotRef} className={cx('flex min-h-11 justify-center', busy && 'pointer-events-none opacity-60')} aria-busy={busy} />
      {error && <Alert tone="danger">{error}</Alert>}
    </div>
  )
}
