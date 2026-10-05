import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { CheckCircle2, XCircle } from 'lucide-react'
import { confirmEmail } from '../api/auth'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { LogoLink } from '../components/Logo'
import { ButtonLink, Card } from '../components/ui'

/** Página aberta pelo link do e-mail de confirmação (/confirmar-email/<token>). */
export default function ConfirmEmailPage() {
  const { token } = useParams()
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading')
  const [error, setError] = useState<string | null>(null)
  const sent = useRef(false)

  useEffect(() => {
    // O link é de uso único: em modo de desenvolvimento o React roda o efeito duas vezes, e a
    // segunda chamada daria "link já usado".
    if (sent.current || !token) return
    sent.current = true
    confirmEmail(token)
      .then(async () => {
        setStatus('ok')
        await refreshUser()
      })
      .catch((err) => {
        setError(apiErrorMessage(err, 'Não foi possível confirmar o e-mail'))
        setStatus('error')
      })
  }, [token, refreshUser])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      {/* Logado, a NavBar (App.tsx) já mostra a marca no topo. */}
      {!user && <LogoLink size="lg" className="mb-6" />}
      <Card padding="lg" className="w-full max-w-sm text-center">
        {status === 'loading' && <p className="text-body text-ink-3">Confirmando seu e-mail…</p>}

        {status === 'ok' && (
          <>
            <CheckCircle2 className="mx-auto mb-3 size-10 text-leaf" aria-hidden="true" />
            <h1 className="mb-2 text-h2 text-ink">E-mail confirmado!</h1>
            <p className="mb-6 text-small text-ink-2">Agora você pode anunciar e conversar com outras pessoas.</p>
            <ButtonLink to={user ? '/' : '/login'}>
              {user ? 'Continuar' : 'Entrar'}
            </ButtonLink>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-3 size-10 text-danger" aria-hidden="true" />
            <h1 className="mb-2 text-h2 text-ink">Não deu certo</h1>
            <p className="mb-6 text-small text-ink-2">{error}</p>
            <Link
              to={user ? '/' : '/login'}
              className="inline-flex min-h-11 items-center text-small font-semibold text-brand hover:text-brand-strong"
            >
              {user ? 'Voltar ao site' : 'Entrar na conta'}
            </Link>
          </>
        )}
      </Card>
    </div>
  )
}
