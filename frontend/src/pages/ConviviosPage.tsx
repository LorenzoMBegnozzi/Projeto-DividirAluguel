import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  confirmConvivio,
  declineConvivio,
  getMyConvivios,
  proposeConvivio,
  rateUser,
} from '../api/rating'
import { apiErrorMessage } from '../api/client'
import StarRating from '../components/StarRating'
import type { Convivio } from '../types'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function statusLabel(status: Convivio['status']) {
  if (status === 'CONFIRMADO') return { text: 'Confirmado', className: 'text-emerald-600' }
  if (status === 'RECUSADO') return { text: 'Recusado', className: 'text-red-500' }
  return { text: 'Aguardando confirmação', className: 'text-amber-600' }
}

export default function ConviviosPage() {
  const [searchParams] = useSearchParams()
  const [convivios, setConvivios] = useState<Convivio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [outroUsuarioId, setOutroUsuarioId] = useState(searchParams.get('outro') ?? '')
  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

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

  async function handlePropose(e: FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!outroUsuarioId || !periodoInicio) {
      setFormError('Informe o usuário e o início do período')
      return
    }
    setSubmitting(true)
    try {
      await proposeConvivio(Number(outroUsuarioId), periodoInicio, periodoFim)
      setOutroUsuarioId('')
      setPeriodoInicio('')
      setPeriodoFim('')
      load()
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Não foi possível registrar o convívio'))
    } finally {
      setSubmitting(false)
    }
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Convívios e avaliações</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Só é possível avaliar quem já morou com você. Registre o convívio, espere a outra pessoa confirmar
        e depois avalie.
      </p>

      <form onSubmit={handlePropose} className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold text-zinc-700">Registrar novo convívio</h2>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">ID do usuário com quem morou</label>
          <input
            type="number"
            value={outroUsuarioId}
            onChange={(e) => setOutroUsuarioId(e.target.value)}
            placeholder="Ex.: 12"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Início do período</label>
            <input
              type="date"
              value={periodoInicio}
              onChange={(e) => setPeriodoInicio(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Fim do período (opcional)</label>
            <input
              type="date"
              value={periodoFim}
              onChange={(e) => setPeriodoFim(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>
        </div>
        {formError && <p className="text-sm text-red-600">{formError}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="self-start rounded-lg bg-brand-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
        >
          {submitting ? 'Enviando...' : 'Registrar convívio'}
        </button>
      </form>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-zinc-400">Carregando...</div>
      ) : convivios.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Nenhum convívio registrado ainda.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {convivios.map((convivio) => {
            const status = statusLabel(convivio.status)
            return (
              <div key={convivio.id} className="rounded-2xl bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <Link
                    to={`/usuarios/${convivio.outroUsuarioId}`}
                    className="font-semibold text-zinc-800 hover:text-brand-600"
                  >
                    {convivio.outroUsuarioNome}
                  </Link>
                  <span className={`text-xs font-medium ${status.className}`}>{status.text}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500">
                  {formatDate(convivio.periodoInicio)}
                  {convivio.periodoFim ? ` até ${formatDate(convivio.periodoFim)}` : ' até hoje'}
                </p>

                {convivio.status === 'PENDENTE' && !convivio.propostoPorMim && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => handleConfirm(convivio.id)}
                      className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => handleDecline(convivio.id)}
                      className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-500 hover:border-red-300 hover:text-red-500"
                    >
                      Recusar
                    </button>
                  </div>
                )}

                {convivio.status === 'PENDENTE' && convivio.propostoPorMim && (
                  <p className="mt-2 text-xs text-zinc-400">Aguardando {convivio.outroUsuarioNome} confirmar.</p>
                )}

                {convivio.status === 'CONFIRMADO' && !convivio.avaliadoPorMim && avaliandoId !== convivio.id && (
                  <button
                    onClick={() => openRating(convivio.id)}
                    className="mt-3 rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    Avaliar
                  </button>
                )}

                {convivio.status === 'CONFIRMADO' && convivio.avaliadoPorMim && (
                  <p className="mt-2 text-xs text-emerald-600">Você já avaliou esse convívio.</p>
                )}

                {avaliandoId === convivio.id && (
                  <form onSubmit={handleRate} className="mt-4 flex flex-col gap-3 border-t border-zinc-100 pt-4">
                    <div>
                      <p className="mb-1 text-sm font-medium text-zinc-700">Pagamentos em dia</p>
                      <StarRating value={notaPontualidade} onChange={setNotaPontualidade} />
                    </div>
                    <div>
                      <p className="mb-1 text-sm font-medium text-zinc-700">Qualidade do convívio</p>
                      <StarRating value={notaConvivencia} onChange={setNotaConvivencia} />
                    </div>
                    <textarea
                      value={comentario}
                      onChange={(e) => setComentario(e.target.value)}
                      rows={2}
                      placeholder="Comentário (opcional)"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                    {rateError && <p className="text-sm text-red-600">{rateError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700"
                      >
                        Enviar avaliação
                      </button>
                      <button
                        type="button"
                        onClick={() => setAvaliandoId(null)}
                        className="rounded-lg border border-zinc-200 px-4 py-1.5 text-sm font-medium text-zinc-500"
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
