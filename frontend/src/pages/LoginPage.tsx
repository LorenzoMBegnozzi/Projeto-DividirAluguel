import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password)
      navigate('/browse')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível entrar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <h1 className="mb-1 text-center text-2xl font-black tracking-tight text-ink">
          Racha<span className="text-brand">Ai</span>
        </h1>
        <p className="mb-6 text-center text-sm text-ink-3">Encontre com quem dividir o aluguel</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
          />
          <Link to="/esqueci-senha" className="-mt-1 text-right text-xs font-semibold text-brand hover:text-brand-strong">
            Esqueci minha senha
          </Link>
          {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-[42px] rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-ink-3">
          Ainda não tem conta?{' '}
          <Link to="/registro" className="font-semibold text-brand hover:text-brand-strong">
            Cadastre-se
          </Link>
        </p>
      </div>
    </div>
  )
}
