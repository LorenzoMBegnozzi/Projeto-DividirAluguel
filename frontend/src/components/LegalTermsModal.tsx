import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText } from 'lucide-react'
import { acceptLegalTerms } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { LEGAL_VERSION_LABEL } from '../pages/legal/legalVersion'
import { Alert, Button, Checkbox, Modal } from './ui'

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
    <Modal size="md" labelledBy="legal-title">
      <h2 id="legal-title" className="mb-3 flex items-center gap-3 text-h2 text-ink">
        <span className="flex size-9 items-center justify-center rounded-md bg-brand-tint text-brand-strong">
          <FileText className="size-5" aria-hidden="true" />
        </span>
        Termos e privacidade
      </h2>

      <p className="mb-3 text-body text-ink-2">
        Publicamos os <strong className="text-ink">Termos de Uso</strong> e a{' '}
        <strong className="text-ink">Política de Privacidade</strong> do RachaAi (versão de {LEGAL_VERSION_LABEL}). Eles
        explicam as regras da plataforma, quais dados guardamos, para quê, e como excluir sua conta.
      </p>
      <p className="mb-2 flex flex-wrap gap-x-4 text-small">
        <a href="/termos" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-brand hover:text-brand-strong">
          Ler os Termos de Uso ↗
        </a>
        <a href="/privacidade" target="_blank" rel="noreferrer" className="inline-flex min-h-11 items-center font-semibold text-brand hover:text-brand-strong">
          Ler a Política de Privacidade ↗
        </a>
      </p>

      <Checkbox
        className="mb-3 text-ink"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        label="Li e aceito os Termos de Uso e a Política de Privacidade."
      />

      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

      <Button full onClick={handleAccept} disabled={!checked || loading}>
        {loading ? 'Salvando…' : 'Aceitar e continuar'}
      </Button>
      <Button
        variant="ghost"
        full
        className="mt-2"
        onClick={() => {
          logout()
          navigate('/')
        }}
      >
        Não aceito, sair
      </Button>
    </Modal>
  )
}
