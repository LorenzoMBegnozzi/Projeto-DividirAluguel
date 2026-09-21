import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiErrorMessage } from '../api/client'
import type { ReportReason } from '../types'

const REASONS: { value: ReportReason; label: string }[] = [
  { value: 'COMPORTAMENTO_SUSPEITO', label: 'Comportamento suspeito' },
  { value: 'GOLPE_OU_FRAUDE', label: 'Golpe ou fraude' },
  { value: 'CONTEUDO_IMPROPRIO', label: 'Conteúdo impróprio' },
  { value: 'ASSEDIO', label: 'Assédio' },
  { value: 'OUTRO', label: 'Outro motivo' },
]

interface Props {
  userName: string
  onClose: () => void
  onSubmit: (motivo: ReportReason, descricao: string) => Promise<void>
}

export default function ReportUserModal({ userName, onClose, onSubmit }: Props) {
  const [motivo, setMotivo] = useState<ReportReason>('COMPORTAMENTO_SUSPEITO')
  const [descricao, setDescricao] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await onSubmit(motivo, descricao)
      setDone(true)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível enviar a denúncia'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        {done ? (
          <>
            <h2 className="mb-2 text-lg font-bold text-zinc-800">Denúncia enviada</h2>
            <p className="mb-4 text-sm text-zinc-600">
              Obrigado por avisar. Vamos analisar o que você relatou sobre {userName}.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Fechar
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="mb-1 text-lg font-bold text-zinc-800">Denunciar {userName}</h2>
            <p className="mb-4 text-sm text-zinc-500">
              A pessoa denunciada não é avisada. Use isso para nos ajudar a manter a comunidade segura.
            </p>

            <label className="mb-1 block text-sm font-medium text-zinc-700">Motivo</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as ReportReason)}
              className="mb-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-sm font-medium text-zinc-700">Conte o que aconteceu (opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />

            {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600 disabled:opacity-60"
              >
                {loading ? 'Enviando...' : 'Enviar denúncia'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500"
              >
                Cancelar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
