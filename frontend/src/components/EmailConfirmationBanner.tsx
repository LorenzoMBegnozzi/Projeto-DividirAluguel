import { useState } from 'react'
import { MailWarning } from 'lucide-react'
import { resendEmailConfirmation } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

/**
 * Aviso no topo para quem ainda não confirmou o e-mail. Até confirmar, anunciar, conversar e
 * demonstrar interesse ficam bloqueados (o backend recusa com a mesma explicação).
 */
export default function EmailConfirmationBanner() {
  const { user } = useAuth()
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [error, setError] = useState<string | null>(null)

  if (!user || user.emailConfirmed || user.admin) return null

  async function handleResend() {
    setState('sending')
    setError(null)
    try {
      await resendEmailConfirmation()
      setState('sent')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível reenviar'))
      setState('idle')
    }
  }

  return (
    <div className="border-b border-mel/30 bg-mel-tint px-4 py-2 text-small text-ink">
      <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-x-4 gap-y-1.5">
        <p className="flex items-center gap-2">
          <MailWarning className="h-4 w-4 shrink-0 text-mel" aria-hidden="true" />
          <span>
            <strong>Confirme seu e-mail</strong> para anunciar e conversar. Enviamos um link para{' '}
            <strong>{user.email}</strong>.
          </span>
        </p>
        {state === 'sent' ? (
          <span className="font-semibold text-leaf">Enviado! Confira também o spam.</span>
        ) : (
          <button onClick={handleResend} disabled={state === 'sending'} className="inline-flex min-h-11 items-center rounded-sm font-bold text-brand hover:text-brand-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-60">
            {state === 'sending' ? 'Enviando…' : 'Reenviar e-mail'}
          </button>
        )}
        {error && <span className="w-full text-danger">{error}</span>}
      </div>
    </div>
  )
}
