import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { deleteAccount } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

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

  const inputClass =
    'w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

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
    <section className="mt-6 rounded-lg border border-danger/40 bg-surface p-6">
      <h2 className="mb-1 text-[16px] font-bold text-ink">Excluir minha conta</h2>
      <p className="mb-4 text-sm text-ink-3">
        Apaga seus dados pessoais do RachaAi. <strong className="text-ink-2">Não dá para desfazer.</strong>
      </p>

      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex h-[38px] items-center gap-2 rounded-md border border-danger px-4 text-sm font-semibold text-danger transition hover:bg-danger-tint"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Quero excluir minha conta
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-md bg-danger-tint p-3 text-danger">
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
            <div className="rounded-md bg-surface-sunk p-3 text-ink-2">
              <p className="mb-1 font-bold text-ink">Fica guardado, sem identificar você</p>
              <ul className="list-disc space-y-0.5 pl-4">
                <li>registros de pagamento (exigência fiscal)</li>
                <li>denúncias feitas ou recebidas (segurança dos usuários)</li>
              </ul>
              <p className="mt-2 text-[13px] text-ink-3">Nas conversas, você passa a aparecer como “Usuário excluído”.</p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Sua senha</label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">
              Para confirmar, digite <strong>EXCLUIR</strong>
            </label>
            <input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} className={inputClass} />
          </div>

          {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={loading || !password || confirmText.trim().toUpperCase() !== 'EXCLUIR'}
              className="inline-flex h-[42px] items-center gap-2 rounded-md bg-danger px-5 text-sm font-semibold text-on-inverse transition hover:opacity-90 disabled:opacity-50"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              {loading ? 'Excluindo…' : 'Excluir minha conta definitivamente'}
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false)
                setPassword('')
                setConfirmText('')
                setError(null)
              }}
              className="h-[42px] rounded-md px-4 text-sm font-semibold text-ink-2 hover:text-ink"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
