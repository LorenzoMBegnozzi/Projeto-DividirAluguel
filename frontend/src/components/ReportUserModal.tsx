import { useState } from 'react'
import type { FormEvent } from 'react'
import { apiErrorMessage } from '../api/client'
import type { ReportReason } from '../types'
import { Alert, Button, Modal, Select, Textarea } from './ui'

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
    <Modal labelledBy="report-title">
      {done ? (
        <>
          <h2 id="report-title" className="mb-2 text-h2 text-ink">Denúncia enviada</h2>
          <p className="mb-4 text-body text-ink-2">
            Obrigado por avisar. Vamos analisar o que você relatou sobre {userName}.
          </p>
          <Button full onClick={onClose}>
            Fechar
          </Button>
        </>
      ) : (
        <form onSubmit={handleSubmit}>
          <h2 id="report-title" className="mb-1 text-h2 text-ink">Denunciar {userName}</h2>
          <p className="mb-4 text-caption text-ink-3">
            A pessoa denunciada não é avisada. Use isso para nos ajudar a manter a comunidade segura.
          </p>

          <Select label="Motivo" wrapperClassName="mb-3" value={motivo} onChange={(e) => setMotivo(e.target.value as ReportReason)}>
            {REASONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </Select>

          <Textarea label="Conte o que aconteceu (opcional)" wrapperClassName="mb-3" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={3} />

          {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

          <div className="flex gap-2">
            <Button type="submit" variant="secondary" disabled={loading} className="flex-1 border-danger text-danger hover:border-danger hover:bg-danger-tint">
              {loading ? 'Enviando…' : 'Enviar denúncia'}
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </form>
      )}
    </Modal>
  )
}
