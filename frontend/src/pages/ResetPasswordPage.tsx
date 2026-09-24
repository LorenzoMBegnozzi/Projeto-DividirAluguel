import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'

export default function ResetPasswordPage() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    if (newPassword !== confirmPassword) {
      setError('As senhas não são iguais')
      return
    }
    if (!token) {
      setError('Link inválido')
      return
    }
    setLoading(true)
    try {
      await resetPassword(token, newPassword)
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível redefinir a senha'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <h1 className="mb-1 text-center text-2xl font-extrabold tracking-tight text-ink">Nova senha</h1>

        {done ? (
          <>
            <p className="mb-6 text-center text-sm text-ink-3">Senha redefinida! Agora é só entrar com a senha nova.</p>
            <button
              onClick={() => navigate('/login')}
              className="h-[42px] w-full rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong"
            >
              Ir para o login
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-ink-3">Escolha uma nova senha para sua conta.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                required
                minLength={8}
                placeholder="Senha nova (mínimo 8 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Confirme a senha nova"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
              />
              {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 h-[42px] rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
              >
                {loading ? 'Salvando…' : 'Redefinir senha'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-ink-3">
              <Link to="/esqueci-senha" className="font-semibold text-brand hover:text-brand-strong">
                Pedir um novo link
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
