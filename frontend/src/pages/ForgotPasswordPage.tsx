import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'
import { LogoLink } from '../components/Logo'
import { Alert, Button, Card, fieldClass } from '../components/ui'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      <LogoLink size="lg" className="mb-6" />
      <Card padding="lg" className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-h2 text-ink">Esqueci minha senha</h1>
        <p className="mb-6 text-center text-small text-ink-3">
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
              className={fieldClass()}
            />
            {error && <Alert tone="danger">{error}</Alert>}
            <Button type="submit" full disabled={loading} className="mt-2">
              {loading ? 'Enviando…' : 'Enviar link de redefinição'}
            </Button>
          </form>
        )}

        {message && (
          <div className="flex flex-col gap-3">
            <p className="text-small text-ink-2">{message}</p>
            <p className="text-caption text-ink-3">
              Confira sua caixa de entrada (e o spam). O link vale por 30 minutos.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-small text-ink-3">
          Lembrou a senha?{' '}
          <Link to="/login" className="font-semibold text-brand hover:text-brand-strong">
            Entrar
          </Link>
        </p>
      </Card>
    </div>
  )
}
