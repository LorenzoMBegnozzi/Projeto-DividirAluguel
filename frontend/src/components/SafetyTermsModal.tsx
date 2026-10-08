import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { acceptSafetyTerms } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { Alert, Button, Checkbox, Modal } from './ui'

export default function SafetyTermsModal() {
  const { refreshUser } = useAuth()
  const [checked, setChecked] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleAccept() {
    setError(null)
    setLoading(true)
    try {
      await acceptSafetyTerms()
      await refreshUser()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível confirmar. Tente novamente.'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal size="md" labelledBy="safety-title">
      <h2 id="safety-title" className="mb-3 flex items-center gap-3 text-h2 text-ink">
        <span className="flex size-9 items-center justify-center rounded-md bg-mel-tint text-mel">
          <ShieldAlert className="size-5" aria-hidden="true" />
        </span>
        Antes de começar
      </h2>

      <p className="mb-3 text-body text-ink-2">
        O Toc Toc Who? ajuda você a encontrar pessoas para dividir moradia — mas quem vai morar com você ainda é
        alguém que você não conhece pessoalmente. Alguns cuidados fazem toda a diferença:
      </p>

      <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-body text-ink-2 marker:font-extrabold marker:text-brand">
        <li>
          Converse bastante antes de fechar qualquer acordo e, se possível, marque o primeiro encontro em
          local público.
        </li>
        <li>Confira referências e desconfie de propostas urgentes ou de pagamentos fora da plataforma.</li>
        <li>Formalize combinados sobre valores, prazos e convivência por escrito.</li>
      </ol>

      <p className="mb-3 text-caption text-ink-3">
        O Toc Toc Who? é um espaço de conexão e não faz verificação de antecedentes nem participa dos acordos entre
        usuários. A segurança nos encontros, negociações e na convivência é de responsabilidade de cada pessoa
        envolvida.
      </p>

      <Checkbox
        className="mb-3 text-ink"
        checked={checked}
        onChange={(e) => setChecked(e.target.checked)}
        label="Li e estou ciente dos cuidados acima."
      />

      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

      <div className="flex justify-end">
        <Button disabled={!checked || loading} onClick={handleAccept}>
          {loading ? 'Confirmando…' : 'Entendi, continuar'}
        </Button>
      </div>
    </Modal>
  )
}
