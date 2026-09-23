import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState<string | null>(null)
  const [resetToken, setResetToken] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setMessage(null)
    setResetToken(null)
    setLoading(true)
    try {
      const res = await forgotPassword(email)
      setMessage(res.message)
      setResetToken(res.resetToken)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível pedir a redefinição'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-brand-100">
        <h1 className="mb-1 text-center text-2xl font-bold text-brand-600">Esqueci minha senha</h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          Informe seu e-mail e a gente gera um link pra você criar uma senha nova.
        </p>

        {!message && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              required
              placeholder="E-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="mt-2 rounded-lg bg-brand-600 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
            >
              {loading ? 'Enviando...' : 'Gerar link de redefinição'}
            </button>
          </form>
        )}

        {message && (
          <div className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600">{message}</p>

            {resetToken ? (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="mb-2 text-xs font-semibold text-amber-800">
                  O projeto ainda não envia e-mail de verdade — aqui está o link (modo simulado):
                </p>
                <Link
                  to={`/redefinir-senha/${resetToken}`}
                  className="break-all text-sm font-semibold text-brand-600 underline"
                >
                  Clique aqui para criar sua nova senha
                </Link>
              </div>
            ) : (
              <p className="text-xs text-zinc-400">
                Se esse e-mail tiver conta, você teria recebido um link.
              </p>
            )}
          </div>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-brand-600">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}
