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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-scrim px-4">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-pop">
        {done ? (
          <>
            <h2 className="mb-2 text-xl font-bold tracking-tight text-ink">Denúncia enviada</h2>
            <p className="mb-4 text-ink-2">
              Obrigado por avisar. Vamos analisar o que você relatou sobre {userName}.
            </p>
            <button
              onClick={onClose}
              className="h-[42px] w-full rounded-md bg-brand text-sm font-semibold text-on-brand hover:bg-brand-strong"
            >
              Fechar
            </button>
          </>
        ) : (
          <form onSubmit={handleSubmit}>
            <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Denunciar {userName}</h2>
            <p className="mb-4 text-[13px] text-ink-3">
              A pessoa denunciada não é avisada. Use isso para nos ajudar a manter a comunidade segura.
            </p>

            <label className="mb-1 block text-[13px] font-semibold text-ink">Motivo</label>
            <select
              value={motivo}
              onChange={(e) => setMotivo(e.target.value as ReportReason)}
              className="mb-3 h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
            >
              {REASONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>

            <label className="mb-1 block text-[13px] font-semibold text-ink">Conte o que aconteceu (opcional)</label>
            <textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={3}
              className="mb-3 w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-sm text-ink outline-none focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
            />

            {error && <p className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                type="submit"
                disabled={loading}
                className="h-[42px] flex-1 rounded-md border border-danger bg-surface text-sm font-semibold text-danger transition hover:bg-danger-tint disabled:opacity-60"
              >
                {loading ? 'Enviando…' : 'Enviar denúncia'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="h-[42px] rounded-md px-4 text-sm font-semibold text-ink-2 transition hover:bg-surface-sunk hover:text-ink"
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
