import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { confirmConvivio, declineConvivio, getMyConvivios, rateUser } from '../api/rating'
import { apiErrorMessage } from '../api/client'
import StarRating from './StarRating'
import type { Convivio } from '../types'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function statusLabel(status: Convivio['status']) {
  if (status === 'CONFIRMADO') return { text: 'Confirmado', className: 'text-leaf' }
  if (status === 'RECUSADO') return { text: 'Recusado', className: 'text-danger' }
  return { text: 'Aguardando confirmação', className: 'text-mel' }
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
    <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-line bg-surface p-6">
      <h2 className="mb-1 text-[16px] font-bold text-ink">Convívios e avaliações</h2>
      <p className="mb-4 text-[13px] text-ink-3">
        Só é possível avaliar quem já morou com você. Para registrar um novo convívio, acesse o perfil da pessoa
        (pelo perfil público ou por uma conversa) e use a seção "Convívio" lá.
      </p>

      {error && <div className="mb-4 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <div className="p-4 text-center text-sm text-ink-3">Carregando…</div>
      ) : convivios.length === 0 ? (
        <p className="rounded-md border border-line bg-surface-sunk p-4 text-center text-sm text-ink-3">
          Nenhum convívio registrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {convivios.map((convivio) => {
            const status = statusLabel(convivio.status)
            return (
              <div key={convivio.id} className="rounded-md border border-line p-3">
                <div className="flex items-center justify-between">
                  <Link to={`/usuarios/${convivio.outroUsuarioId}`} className="font-semibold text-ink hover:text-brand">
                    {convivio.outroUsuarioNome}
                  </Link>
                  <span className={`text-xs font-semibold ${status.className}`}>{status.text}</span>
                </div>
                <p className="mt-1 text-[13px] text-ink-3">
                  {formatDate(convivio.periodoInicio)}
                  {convivio.periodoFim ? ` até ${formatDate(convivio.periodoFim)}` : ' até hoje'}
                </p>

                {convivio.status === 'PENDENTE' && !convivio.propostoPorMim && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleConfirm(convivio.id)}
                      className="h-[34px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleDecline(convivio.id)}
                      className="h-[34px] rounded-md border border-line-strong px-4 text-sm font-semibold text-ink-2 hover:border-danger hover:text-danger"
                    >
                      Recusar
                    </button>
                  </div>
                )}

                {convivio.status === 'PENDENTE' && convivio.propostoPorMim && (
                  <p className="mt-2 text-[13px] text-ink-3">Aguardando {convivio.outroUsuarioNome} confirmar.</p>
                )}

                {convivio.status === 'CONFIRMADO' && !convivio.avaliadoPorMim && avaliandoId !== convivio.id && (
                  <button
                    onClick={() => openRating(convivio.id)}
                    className="mt-3 h-[34px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong"
                  >
                    Avaliar
                  </button>
                )}

                {convivio.status === 'CONFIRMADO' && convivio.avaliadoPorMim && (
                  <p className="mt-2 text-[13px] text-leaf">Você já avaliou esse convívio.</p>
                )}

                {avaliandoId === convivio.id && (
                  <form onSubmit={handleRate} className="mt-4 flex flex-col gap-3 border-t border-line pt-4">
                    <div>
                      <p className="mb-1 text-[13px] font-semibold text-ink">Pagamentos em dia</p>
                      <StarRating value={notaPontualidade} onChange={setNotaPontualidade} />
                    </div>
                    <div>
                      <p className="mb-1 text-[13px] font-semibold text-ink">Qualidade do convívio</p>
                      <StarRating value={notaConvivencia} onChange={setNotaConvivencia} />
                    </div>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={2}
                      placeholder="Comentário (opcional)"
                      className="w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
                    />
                    {rateError && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{rateError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="h-[34px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong"
                      >
                        Enviar avaliação
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvaliandoId(null)}
                        className="h-[34px] rounded-md px-4 text-sm font-semibold text-ink-2 hover:bg-surface-sunk hover:text-ink"
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
