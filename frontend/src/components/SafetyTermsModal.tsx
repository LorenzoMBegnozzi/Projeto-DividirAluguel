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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-50 text-amber-500">
            <ShieldAlert className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-lg font-bold text-zinc-800">Antes de começar</h2>
        </div>

        <p className="mb-3 text-sm leading-relaxed text-zinc-600">
          O RachaAi ajuda você a encontrar pessoas para dividir moradia — mas quem vai morar com você ainda é
          alguém que você não conhece pessoalmente. Alguns cuidados fazem toda a diferença:
        </p>

        <ul className="mb-4 flex flex-col gap-1.5 text-sm text-zinc-600">
          <li className="flex gap-2">
            <span className="text-brand-600">•</span>
            Converse bastante antes de fechar qualquer acordo e, se possível, marque o primeiro encontro em
            local público.
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600">•</span>
            Confira referências e desconfie de propostas urgentes ou de pagamentos fora da plataforma.
          </li>
          <li className="flex gap-2">
            <span className="text-brand-600">•</span>
            Formalize combinados sobre valores, prazos e convivência por escrito.
          </li>
        </ul>

        <p className="mb-4 text-xs leading-relaxed text-zinc-400">
          O RachaAi é um espaço de conexão e não faz verificação de antecedentes nem participa dos acordos entre
          usuários. A segurança nos encontros, negociações e na convivência é de responsabilidade de cada pessoa
          envolvida.
        </p>

        <label className="mb-4 flex cursor-pointer items-start gap-2 text-sm text-zinc-700">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
          />
          Li e estou ciente dos cuidados acima.
        </label>

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <button
          type="button"
          disabled={!checked || loading}
          onClick={handleAccept}
          className="w-full rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Confirmando...' : 'Entendi, continuar'}
        </button>
      </div>
    </div>
  )
}
