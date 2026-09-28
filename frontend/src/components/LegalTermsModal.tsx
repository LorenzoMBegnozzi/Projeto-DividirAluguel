import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { acceptLegalTerms } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { LEGAL_VERSION_LABEL } from '../pages/legal/legalVersion'

/**
 * Aparece para quem ainda não aceitou a versão atual dos Termos de Uso e da Política de
 * Privacidade (contas antigas ou versão nova publicada). Sem aceitar, não dá para usar o site;
 * a alternativa é sair ou excluir a conta.
 */
export default function LegalTermsModal() {
  const { refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setError(null)
    setLoading(true)
    try {
      await acceptLegalTerms()
      await refreshUser()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível registrar o aceite. Tente novamente.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-scrim px-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-pop" role="dialog" aria-modal="true" aria-labelledby="legal-title">
        <h2 id="legal-title" className="mb-3 flex items-center gap-3 text-xl font-bold tracking-tight text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-tint text-brand-strong">
            <FileText className="h-5 w-5" aria-hidden="true" />
          </span>
          Termos e privacidade
        </h2>

        <p className="mb-3 text-ink-2">
          Publicamos os <strong className="text-ink">Termos de Uso</strong> e a{' '}
          <strong className="text-ink">Política de Privacidade</strong> do RachaAi (versão de {LEGAL_VERSION_LABEL}). Eles
          explicam as regras da plataforma, quais dados guardamos, para quê, e como excluir sua conta.
        </p>
        <p className="mb-4 flex flex-wrap gap-x-4 text-sm">
          <a href="/termos" target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-brand-strong">
            Ler os Termos de Uso ↗
          </a>
          <a href="/privacidade" target="_blank" rel="noreferrer" className="font-semibold text-brand hover:text-brand-strong">
            Ler a Política de Privacidade ↗
          </a>
        </p>

        <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] shrink-0 accent-brand"
          />
          Li e aceito os Termos de Uso e a Política de Privacidade.
        </label>

        {error && <p className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

        <button
          onClick={handleAccept}
          disabled={!checked || loading}
          className="h-[42px] w-full rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-50"
        >
          {loading ? 'Salvando…' : 'Aceitar e continuar'}
        </button>
        <button
          onClick={() => {
            logout()
            navigate('/')
          }}
          className="mt-2 w-full py-2 text-sm font-semibold text-ink-3 hover:text-ink"
        >
          Não aceito, sair
        </button>
      </div>
    </div>
  )
}
