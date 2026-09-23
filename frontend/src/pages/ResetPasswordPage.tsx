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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-brand-50 to-white px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-lg shadow-brand-100">
        <h1 className="mb-1 text-center text-2xl font-bold text-brand-600">Nova senha</h1>

        {done ? (
          <>
            <p className="mb-6 text-center text-sm text-zinc-500">
              Senha redefinida! Agora é só entrar com a senha nova.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white transition hover:bg-brand-700"
            >
              Ir para o login
            </button>
          </>
        ) : (
          <>
            <p className="mb-6 text-center text-sm text-zinc-500">Escolha uma nova senha para sua conta.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                required
                minLength={8}
                placeholder="Senha nova (mínimo 8 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Confirme a senha nova"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
              />
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                type="submit"
                disabled={loading}
                className="mt-2 rounded-lg bg-brand-600 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {loading ? 'Salvando...' : 'Redefinir senha'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500">
              <Link to="/esqueci-senha" className="font-semibold text-brand-600">
                Pedir um novo link
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
