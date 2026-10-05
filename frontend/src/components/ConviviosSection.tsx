import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { confirmConvivio, declineConvivio, getMyConvivios, rateUser } from '../api/rating'
import { apiErrorMessage } from '../api/client'
import StarRating from './StarRating'
import type { Convivio } from '../types'
import { Alert, Badge, Button, Card, EmptyState, fieldClass } from './ui'
import type { BadgeTone } from './ui'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function statusLabel(status: Convivio['status']): { text: string; tone: BadgeTone } {
  if (status === 'CONFIRMADO') return { text: 'Confirmado', tone: 'success' }
  if (status === 'RECUSADO') return { text: 'Recusado', tone: 'danger' }
  return { text: 'Aguardando confirmação', tone: 'warning' }
}

export default function ConviviosSection() {
  const [convivios, setConvivios] = useState<Convivio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [avaliandoId, setAvaliandoId] = useState<number | null>(null)
  const [notaPontualidade, setNotaPontualidade] = useState(5)
  const [notaConvivencia, setNotaConvivencia] = useState(5)
  const [comentario, setComentario] = useState('')
  const [rateError, setRateError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    setLoading(true)
    getMyConvivios()
      .then(setConvivios)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar seus convívios')))
      .finally(() => setLoading(false))
  }

  async function handleConfirm(id: number) {
    try {
      await confirmConvivio(id)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível confirmar o convívio'))
    }
  }

  async function handleDecline(id: number) {
    try {
      await declineConvivio(id)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível recusar o convívio'))
    }
  }

  function openRating(id: number) {
    setAvaliandoId(id)
    setNotaPontualidade(5)
    setNotaConvivencia(5)
    setComentario('')
    setRateError(null)
  }

  async function handleRate(e: FormEvent) {
    e.preventDefault()
    if (!avaliandoId) return
    setRateError(null)
    try {
      await rateUser(avaliandoId, notaPontualidade, notaConvivencia, comentario)
      setAvaliandoId(null)
      load()
    } catch (err) {
      setRateError(apiErrorMessage(err, 'Não foi possível enviar a avaliação'))
    }
  }

  return (
    <Card className="mx-auto mt-6 max-w-2xl">
      <h2 className="mb-1 text-h3 text-ink">Convívios e avaliações</h2>
      <p className="mb-4 text-caption text-ink-3">
        Só é possível avaliar quem já morou com você. Para registrar um novo convívio, acesse o perfil da pessoa
        (pelo perfil público ou por uma conversa) e use a seção "Convívio" lá.
      </p>

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="p-4 text-center text-small text-ink-3">Carregando…</div>
      ) : convivios.length === 0 ? (
        <EmptyState title="Nenhum convívio registrado ainda." />
      ) : (
        <div className="flex flex-col gap-3">
          {convivios.map((convivio) => {
            const status = statusLabel(convivio.status)
            return (
              <div key={convivio.id} className="rounded-md border border-line p-4">
                <div className="flex items-center justify-between gap-3">
                  <Link to={`/usuarios/${convivio.outroUsuarioId}`} className="font-semibold text-ink hover:text-brand">
                    {convivio.outroUsuarioNome}
                  </Link>
                  <Badge tone={status.tone}>{status.text}</Badge>
                </div>
                <p className="mt-1 text-caption text-ink-3">
                  {formatDate(convivio.periodoInicio)}
                  {convivio.periodoFim ? ` até ${formatDate(convivio.periodoFim)}` : ' até hoje'}
                </p>

                {convivio.status === 'PENDENTE' && !convivio.propostoPorMim && (
                  <div className="mt-3 flex gap-2">
                    <Button size="sm" onClick={() => handleConfirm(convivio.id)}>
                      Confirmar
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDecline(convivio.id)}
                      className="hover:border-danger hover:text-danger"
                    >
                      Recusar
                    </Button>
                  </div>
                )}

                {convivio.status === 'PENDENTE' && convivio.propostoPorMim && (
                  <p className="mt-2 text-caption text-ink-3">Aguardando {convivio.outroUsuarioNome} confirmar.</p>
                )}

                {convivio.status === 'CONFIRMADO' && !convivio.avaliadoPorMim && avaliandoId !== convivio.id && (
                  <Button size="sm" onClick={() => openRating(convivio.id)} className="mt-3">
                    Avaliar
                  </Button>
                )}

                {convivio.status === 'CONFIRMADO' && convivio.avaliadoPorMim && (
                  <p className="mt-2 text-caption text-leaf">Você já avaliou esse convívio.</p>
                )}

                {avaliandoId === convivio.id && (
                  <form onSubmit={handleRate} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                    <div>
                      <p className="mb-1 text-small font-semibold text-ink">Pagamentos em dia</p>
                      <StarRating value={notaPontualidade} onChange={setNotaPontualidade} />
                    </div>
                    <div>
                      <p className="mb-1 text-small font-semibold text-ink">Qualidade do convívio</p>
                      <StarRating value={notaConvivencia} onChange={setNotaConvivencia} />
                    </div>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={2}
                      placeholder="Comentário (opcional)"
                      className={fieldClass({ multiline: true })}
                    />
                    {rateError && <Alert tone="danger">{rateError}</Alert>}
                    <div className="flex gap-2">
                      <Button type="submit" size="sm">
                        Enviar avaliação
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => setAvaliandoId(null)}>
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </Card>
  )
}
