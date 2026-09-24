import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldOff, Flag } from 'lucide-react'
import { getUser } from '../api/profile'
import {
  confirmConvivio,
  declineConvivio,
  getMyConvivios,
  getUserRatings,
  getUserRatingsSummary,
  proposeConvivio,
  rateUser,
} from '../api/rating'
import { blockUser, reportUser } from '../api/moderation'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'
import ReportUserModal from '../components/ReportUserModal'
import Avatar from '../components/Avatar'
import type { Avaliacao, AvaliacaoResumo, Convivio, ReportReason, UserProfile } from '../types'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

const inputClass =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2 text-sm text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

export default function UserPublicProfilePage() {
  const { userId } = useParams()
  const { user: currentUser } = useAuth()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [resumo, setResumo] = useState<AvaliacaoResumo | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [convivio, setConvivio] = useState<Convivio | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFim, setPeriodoFim] = useState('')
  const [proposing, setProposing] = useState(false)
  const [convivioError, setConvivioError] = useState<string | null>(null)
  const [rating, setRating] = useState(false)
  const [notaPontualidade, setNotaPontualidade] = useState(5)
  const [notaConvivencia, setNotaConvivencia] = useState(5)
  const [comentario, setComentario] = useState('')

  useEffect(() => {
    if (!userId) return
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  function load() {
    setLoading(true)
    Promise.all([
      getUser(Number(userId)),
      getUserRatingsSummary(Number(userId)),
      getUserRatings(Number(userId)),
      getMyConvivios(),
    ])
      .then(([userData, resumoData, avaliacoesData, convivios]) => {
        setUser(userData)
        setResumo(resumoData)
        setAvaliacoes(avaliacoesData)
        setConvivio(convivios.find((c) => c.outroUsuarioId === Number(userId)) ?? null)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar o perfil')))
      .finally(() => setLoading(false))
  }

  async function reloadRatings() {
    if (!userId) return
    const [resumoData, avaliacoesData] = await Promise.all([
      getUserRatingsSummary(Number(userId)),
      getUserRatings(Number(userId)),
    ])
    setResumo(resumoData)
    setAvaliacoes(avaliacoesData)
  }

  async function handleBlock() {
    if (!user) return
    setBlockError(null)
    try {
      await blockUser(user.id)
      setBlocked(true)
    } catch (err) {
      setBlockError(apiErrorMessage(err, 'Não foi possível bloquear'))
    }
  }

  async function handlePropose(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setConvivioError(null)
    if (!periodoInicio) {
      setConvivioError('Informe o início do período')
      return
    }
    setProposing(true)
    try {
      const created = await proposeConvivio(user.id, periodoInicio, periodoFim)
      setConvivio(created)
      setPeriodoInicio('')
      setPeriodoFim('')
    } catch (err) {
      setConvivioError(apiErrorMessage(err, 'Não foi possível registrar o convívio'))
    } finally {
      setProposing(false)
    }
  }

  async function handleConfirm() {
    if (!convivio) return
    setConvivioError(null)
    try {
      setConvivio(await confirmConvivio(convivio.id))
    } catch (err) {
      setConvivioError(apiErrorMessage(err, 'Não foi possível confirmar o convívio'))
    }
  }

  async function handleDecline() {
    if (!convivio) return
    setConvivioError(null)
    try {
      setConvivio(await declineConvivio(convivio.id))
    } catch (err) {
      setConvivioError(apiErrorMessage(err, 'Não foi possível recusar o convívio'))
    }
  }

  async function handleRate(e: FormEvent) {
    e.preventDefault()
    if (!convivio) return
    setConvivioError(null)
    try {
      await rateUser(convivio.id, notaPontualidade, notaConvivencia, comentario)
      setConvivio({ ...convivio, avaliadoPorMim: true })
      setRating(false)
      setComentario('')
      await reloadRatings()
    } catch (err) {
      setConvivioError(apiErrorMessage(err, 'Não foi possível enviar a avaliação'))
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-ink-3">Carregando…</div>
  }

  if (error || !user) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">{error ?? 'Usuário não encontrado'}</p>
      </div>
    )
  }

  const isSelf = currentUser?.id === user.id

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar photoUrl={user.photoUrl} name={user.name} size={56} />
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-ink">{user.name}</h1>
              {user.occupation && <p className="text-[13px] text-ink-3">{user.occupation}</p>}
            </div>
          </div>
          {!isSelf && (
            <div className="flex shrink-0 gap-1">
              <button
                onClick={() => setShowReport(true)}
                title="Denunciar"
                className="rounded-md p-2 text-ink-3 transition hover:bg-danger-tint hover:text-danger"
              >
                <Flag className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                onClick={handleBlock}
                disabled={blocked}
                title={blocked ? 'Bloqueado' : 'Bloquear'}
                className="rounded-md p-2 text-ink-3 transition hover:bg-danger-tint hover:text-danger disabled:opacity-40"
              >
                <ShieldOff className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>
        {user.bio && <p className="mt-3 text-ink-2">{user.bio}</p>}
        {blocked && <p className="mt-3 text-[13px] text-leaf">Você bloqueou {user.name}.</p>}
        {blockError && <p className="mt-3 text-[13px] text-danger">{blockError}</p>}
      </div>

      {showReport && (
        <ReportUserModal
          userName={user.name}
          onClose={() => setShowReport(false)}
          onSubmit={async (motivo: ReportReason, descricao: string) => {
            await reportUser(user.id, motivo, descricao)
          }}
        />
      )}

      {!isSelf && (
        <div className="mt-6 rounded-lg border border-line bg-surface p-6">
          <h2 className="mb-3 text-[16px] font-bold text-ink">Convívio</h2>

          {!convivio && (
            <form onSubmit={handlePropose} className="flex flex-col gap-3">
              <p className="text-sm text-ink-3">
                Vocês já dividiram moradia? Registre o período para poder avaliar {user.name} depois.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Início do período</label>
                  <input
                    type="date"
                    value={periodoInicio}
                    onChange={(e) => setPeriodoInicio(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink">Fim do período (opcional)</label>
                  <input
                    type="date"
                    value={periodoFim}
                    onChange={(e) => setPeriodoFim(e.target.value)}
                    className={inputClass}
                  />
                </div>
              </div>
              {convivioError && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{convivioError}</p>}
              <button
                type="submit"
                disabled={proposing}
                className="h-[34px] self-start rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
              >
                {proposing ? 'Enviando…' : 'Registrar convívio'}
              </button>
            </form>
          )}

          {convivio?.status === 'PENDENTE' && convivio.propostoPorMim && (
            <p className="text-sm text-ink-3">
              Você propôs um convívio a partir de {formatDate(convivio.periodoInicio)}. Aguardando {user.name}{' '}
              confirmar.
            </p>
          )}

          {convivio?.status === 'PENDENTE' && !convivio.propostoPorMim && (
            <div>
              <p className="mb-3 text-sm text-ink-3">
                {user.name} registrou que vocês moraram juntos de {formatDate(convivio.periodoInicio)}
                {convivio.periodoFim ? ` até ${formatDate(convivio.periodoFim)}` : ' até hoje'}. Confirma?
              </p>
              {convivioError && (
                <p className="mb-2 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{convivioError}</p>
              )}
              <div className="flex gap-2">
                <button
                  onClick={handleConfirm}
                  className="h-[34px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong"
                >
                  Confirmar
                </button>
                <button
                  onClick={handleDecline}
                  className="h-[34px] rounded-md border border-line-strong px-4 text-sm font-semibold text-ink-2 hover:border-danger hover:text-danger"
                >
                  Recusar
                </button>
              </div>
            </div>
          )}

          {convivio?.status === 'RECUSADO' && <p className="text-sm text-ink-3">Convívio recusado.</p>}

          {convivio?.status === 'CONFIRMADO' && !convivio.avaliadoPorMim && !rating && (
            <button
              onClick={() => setRating(true)}
              className="h-[34px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong"
            >
              Avaliar {user.name}
            </button>
          )}

          {convivio?.status === 'CONFIRMADO' && convivio.avaliadoPorMim && (
            <p className="text-sm text-leaf">Você já avaliou esse convívio.</p>
          )}

          {rating && convivio && (
            <form onSubmit={handleRate} className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
              <div>
                <p className="mb-1 text-[13px] font-semibold text-ink">Pagamentos em dia</p>
                <StarRating value={notaPontualidade} onChange={setNotaPontualidade} />
              </div>
              <div>
                <p className="mb-1 text-[13px] font-semibold text-ink">Qualidade do convívio</p>
                <StarRating value={notaConvivencia} onChange={setNotaConvivencia} />
              </div>
              <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Comentário (opcional)" className={inputClass} />
              {convivioError && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{convivioError}</p>}
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="h-[34px] rounded-md bg-brand px-4 text-sm font-semibold text-on-brand hover:bg-brand-strong"
                >
                  Enviar avaliação
                </button>
                <button
                  type="button"
                  onClick={() => setRating(false)}
                  className="h-[34px] rounded-md px-4 text-sm font-semibold text-ink-2 hover:bg-surface-sunk hover:text-ink"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-line bg-surface p-6">
        <h2 className="mb-3 text-[16px] font-bold text-ink">Avaliações de quem já morou junto</h2>
        {!resumo || resumo.total === 0 ? (
          <p className="text-sm text-ink-3">Ainda sem avaliações.</p>
        ) : (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-8">
            <div>
              <p className="text-xs text-ink-3">Pagamentos em dia</p>
              <div className="flex items-center gap-2">
                <StarRating value={resumo.mediaPontualidade} />
                <span className="text-sm tabular-nums text-ink-2">{resumo.mediaPontualidade.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-ink-3">Qualidade do convívio</p>
              <div className="flex items-center gap-2">
                <StarRating value={resumo.mediaConvivencia} />
                <span className="text-sm tabular-nums text-ink-2">{resumo.mediaConvivencia.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-xs text-ink-3 sm:self-end">
              {resumo.total} avaliaç{resumo.total === 1 ? 'ão' : 'ões'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {avaliacoes.map((avaliacao) => (
            <div key={avaliacao.id} className="rounded-md border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-ink">{avaliacao.avaliadorNome}</p>
                <p className="text-xs text-ink-3">
                  {formatDate(avaliacao.periodoInicio)}
                  {avaliacao.periodoFim ? ` até ${formatDate(avaliacao.periodoFim)}` : ' até hoje'}
                </p>
              </div>
              <div className="mt-1 flex gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-ink-3">Pontualidade</span>
                  <StarRating value={avaliacao.notaPontualidade} size={14} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-ink-3">Convívio</span>
                  <StarRating value={avaliacao.notaConvivencia} size={14} />
                </div>
              </div>
              {avaliacao.comentario && <p className="mt-2 text-sm text-ink-2">{avaliacao.comentario}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
