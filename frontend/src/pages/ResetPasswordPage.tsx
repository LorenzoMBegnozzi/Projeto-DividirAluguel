import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'
import { apiErrorMessage } from '../api/client'
import { LogoLink } from '../components/Logo'
import { Alert, Button, Card, fieldClass } from '../components/ui'

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      <LogoLink size="lg" className="mb-6" />
      <Card padding="lg" className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-h2 text-ink">Nova senha</h1>

        {done ? (
          <>
            <p className="mb-6 text-center text-small text-ink-3">Senha redefinida! Agora é só entrar com a senha nova.</p>
            <Button full onClick={() => navigate('/login')}>
              Ir para o login
            </Button>
          </>
        ) : (
          <>
            <p className="mb-6 text-center text-small text-ink-3">Escolha uma nova senha para sua conta.</p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="password"
                required
                minLength={8}
                placeholder="Senha nova (mínimo 8 caracteres)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className={fieldClass()}
              />
              <input
                type="password"
                required
                minLength={8}
                placeholder="Confirme a senha nova"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={fieldClass()}
              />
              {error && <Alert tone="danger">{error}</Alert>}
              <Button type="submit" full disabled={loading} className="mt-2">
                {loading ? 'Salvando…' : 'Redefinir senha'}
              </Button>
            </form>

            <p className="mt-6 text-center text-small text-ink-3">
              <Link to="/esqueci-senha" className="font-semibold text-brand hover:text-brand-strong">
                Pedir um novo link
              </Link>
            </p>
          </>
        )}
      </Card>
    </div>
  )
}
