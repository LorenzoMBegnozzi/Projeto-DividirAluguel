import { useState } from 'react'
import Logo from '../components/Logo'
import LegalLinks from '../components/LegalLinks'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await login(email, password, remember)
      // A página inicial manda cada conta para o lugar dela (admin, busca ou anúncios).
      navigate('/')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível entrar'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface p-8">
        <h1 className="mb-2 flex justify-center">
          <Logo className="text-2xl" />
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
          <div className="-mt-1 flex items-center justify-between">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-ink-3">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="h-4 w-4 accent-brand"
              />
              Manter conectado
            </label>
            <Link to="/esqueci-senha" className="text-xs font-semibold text-brand hover:text-brand-strong">
              Esqueci minha senha
            </Link>
          </div>
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
        <LegalLinks className="mt-6" />
      </div>
    </div>
  )
}
