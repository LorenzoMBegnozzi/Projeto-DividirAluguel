import { useState } from 'react'
import { ShieldAlert } from 'lucide-react'
import { acceptSafetyTerms } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-scrim px-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-pop">
        <h2 className="mb-3 flex items-center gap-3 text-xl font-bold tracking-tight text-ink">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-mel-tint text-mel">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          Antes de começar
        </h2>

        <p className="mb-3 text-ink-2">
          O RachaAi ajuda você a encontrar pessoas para dividir moradia — mas quem vai morar com você ainda é
          alguém que você não conhece pessoalmente. Alguns cuidados fazem toda a diferença:
        </p>

        <ol className="mb-4 list-decimal space-y-1.5 pl-5 text-ink-2 marker:font-extrabold marker:text-brand">
          <li>
            Converse bastante antes de fechar qualquer acordo e, se possível, marque o primeiro encontro em
            local público.
          </li>
          <li>Confira referências e desconfie de propostas urgentes ou de pagamentos fora da plataforma.</li>
          <li>Formalize combinados sobre valores, prazos e convivência por escrito.</li>
        </ol>

        <p className="mb-4 text-[13px] leading-relaxed text-ink-3">
          O RachaAi é um espaço de conexão e não faz verificação de antecedentes nem participa dos acordos entre
          usuários. A segurança nos encontros, negociações e na convivência é de responsabilidade de cada pessoa
          envolvida.
        </p>

        <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-ink">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-[18px] w-[18px] accent-brand"
          />
          Li e estou ciente dos cuidados acima.
        </label>

        {error && (
          <p className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            disabled={!checked || loading}
            onClick={handleAccept}
            className="h-[42px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Confirmando…' : 'Entendi, continuar'}
          </button>
        </div>
      </div>
    </div>
  )
}
