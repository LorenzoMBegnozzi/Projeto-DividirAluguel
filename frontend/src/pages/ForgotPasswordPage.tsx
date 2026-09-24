import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível pedir a redefinição'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <h1 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-ink">Esqueci minha senha</h1>
        <p className="mb-6 text-center text-sm text-ink-3">
          Informe seu e-mail e a gente envia um link pra você criar uma senha nova.
        </p>

        {!message && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
            />
            {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 h-[42px] rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
            >
              {loading ? 'Enviando…' : 'Enviar link de redefinição'}
            </button>
          </form>
        )}

        {message && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-ink-2">{message}</p>
            <p className="text-[13px] text-ink-3">
              Confira sua caixa de entrada (e o spam). O link vale por 30 minutos.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-sm text-ink-3">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-brand hover:text-brand-strong">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
