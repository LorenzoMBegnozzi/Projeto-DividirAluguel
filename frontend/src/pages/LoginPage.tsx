import { useState } from 'react'
import { LogoLink } from '../components/Logo'
import LegalLinks from '../components/LegalLinks'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { apiErrorMessage } from '../api/client'
import { Alert, Button, Card, Checkbox, fieldClass } from '../components/ui'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      <h1 className="mb-6 flex justify-center">
        <LogoLink size="lg" />
      </h1>
      <Card padding="lg" className="w-full max-w-sm">
        <p className="mb-6 text-center text-small text-ink-3">Encontre com quem dividir o aluguel</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={fieldClass()}
          />
          <input
            type="password"
            required
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={fieldClass()}
          />
          <div className="-mt-1 flex items-center justify-between gap-3">
            <Checkbox
              label="Manter conectado"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              className="text-caption! text-ink-3!"
            />
            <Link
              to="/esqueci-senha"
              className="inline-flex min-h-11 items-center text-caption font-semibold text-brand hover:text-brand-strong"
            >
              Esqueci minha senha
            </Link>
          </div>
          {error && <Alert tone="danger">{error}</Alert>}
          <Button type="submit" full disabled={loading} className="mt-2">
            {loading ? 'Entrando…' : 'Entrar'}
          </Button>
        </form>

        <p className="mt-6 text-center text-small text-ink-3">
          Ainda não tem conta?{' '}
          <Link to="/registro" className="font-semibold text-brand hover:text-brand-strong">
            Cadastre-se
          </Link>
        </p>
        <LegalLinks className="mt-6" />
      </Card>
    </div>
  )
}
