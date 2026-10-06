import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { deleteAccount } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, Card, Input } from './ui'

/**
 * "Excluir minha conta" (LGPD). Pede a senha e a palavra EXCLUIR, para não acontecer por
 * engano. O que é apagado e o que fica está explicado na tela e na Política de Privacidade.
 */
export default function DeleteAccountSection() {
  const { logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmText, setConfirmText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await deleteAccount(password)
      // A conta já não existe: limpa o navegador (a chamada de logout ao servidor só falha em silêncio).
      logout()
      navigate('/?conta-excluida=1', { replace: true })
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível excluir a conta'))
      setLoading(false)
    }
  }

  return (
    <Card as="section" tone="danger">
      <h2 className="mb-1 text-h3 text-ink">Excluir minha conta</h2>
      <p className="mb-4 text-small text-ink-3">
        Apaga seus dados pessoais do RachaAi. <strong className="text-ink-2">Não dá para desfazer.</strong>
      </p>

      {!open ? (
        <Button
          variant="secondary"
          icon={Trash2}
          onClick={() => setOpen(true)}
          className="border-danger text-danger hover:border-danger hover:bg-danger-tint"
        >
          Quero excluir minha conta
        </Button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 text-small sm:grid-cols-2">
            <div className="rounded-lg bg-danger-tint p-4 text-danger">
              <p className="mb-1 font-bold">É apagado na hora</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>nome, e-mail, CPF e nascimento</li>
                <li>perfil de convivência e foto</li>
                <li>seus anúncios e as fotos deles</li>
                <li>o texto das mensagens que você enviou</li>
                <li>notificações, interesses e bloqueios</li>
                <li>avaliações que você recebeu</li>
              </ul>
            </div>
            <Card tone="sunk" padding="sm" className="text-ink-2">
              <p className="mb-1 font-bold text-ink">Fica guardado, sem identificar você</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>registros de pagamento (exigência fiscal)</li>
                <li>denúncias feitas ou recebidas (segurança dos usuários)</li>
              </ul>
              <p className="mt-2 text-caption text-ink-3">Nas conversas, você passa a aparecer como “Usuário excluído”.</p>
            </Card>
          </div>

          <Input
            label="Sua senha"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <Input
            label={<>Para confirmar, digite <strong>EXCLUIR</strong></>}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
          />

          {error && <Alert tone="danger">{error}</Alert>}

          <div className="flex flex-wrap gap-2">
            <Button
              type="submit"
              variant="danger"
              icon={Trash2}
              disabled={loading || !password || confirmText.trim().toUpperCase() !== 'EXCLUIR'}
            >
              {loading ? 'Excluindo…' : 'Excluir minha conta definitivamente'}
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setOpen(false)
                setPassword('')
                setConfirmText('')
                setError(null)
              }}
            >
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Card>
  )
}
