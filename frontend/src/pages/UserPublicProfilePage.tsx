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
import { Alert, Button, Card, Columns, EmptyState, Input, Page, fieldClass, labelClass } from '../components/ui'
import type { Avaliacao, AvaliacaoResumo, Convivio, ReportReason, UserProfile } from '../types'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

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
        <Alert tone="danger">{error ?? 'Usuário não encontrado'}</Alert>
      </div>
    )
  }

  const isSelf = currentUser?.id === user.id

  return (
    // computador: a pessoa numa coluna fixa à esquerda; convívio e avaliações à direita
    <Page>
      <Columns asideWidth="md" aside={(
      <Card>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <Avatar photoUrl={user.photoUrl} name={user.name} size={56} />
            <div>
              <h1 className="text-h2 text-ink">{user.name}</h1>
              {user.occupation && <p className="text-caption text-ink-3">{user.occupation}</p>}
            </div>
          </div>
          {!isSelf && (
            <div className="flex shrink-0 gap-1">
              <Button
                variant="ghost"
                size="sm"
                icon={Flag}
                onClick={() => setShowReport(true)}
                title="Denunciar"
                className="text-ink-3! hover:bg-danger-tint! hover:text-danger!"
              />
              <Button
                variant="ghost"
                size="sm"
                icon={ShieldOff}
                onClick={handleBlock}
                disabled={blocked}
                title={blocked ? 'Bloqueado' : 'Bloquear'}
                className="text-ink-3! hover:bg-danger-tint! hover:text-danger!"
              />
            </div>
          )}
        </div>
        {user.bio && <p className="mt-3 text-body text-ink-2">{user.bio}</p>}
        {blocked && <p className="mt-3 text-caption text-leaf">Você bloqueou {user.name}.</p>}
        {blockError && <p className="mt-3 text-caption text-danger">{blockError}</p>}
      </Card>
      )}>
      <div className="flex flex-col gap-6">
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
        <Card as="section">
          <h2 className="mb-3 text-h3 text-ink">Convívio</h2>

          {!convivio && (
            <form onSubmit={handlePropose} className="flex flex-col gap-3">
              <p className="text-small text-ink-3">
                Vocês já dividiram moradia? Registre o período para poder avaliar {user.name} depois.
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Input
                  label="Início do período"
                  type="date"
                  value={periodoInicio}
                  onChange={(e) => setPeriodoInicio(e.target.value)}
                />
                <Input
                  label="Fim do período (opcional)"
                  type="date"
                  value={periodoFim}
                  onChange={(e) => setPeriodoFim(e.target.value)}
                />
              </div>
              {convivioError && <Alert tone="danger">{convivioError}</Alert>}
              <Button type="submit" size="sm" disabled={proposing} className="self-start">
                {proposing ? 'Enviando…' : 'Registrar convívio'}
              </Button>
            </form>
          )}

          {convivio?.status === 'PENDENTE' && convivio.propostoPorMim && (
            <p className="text-small text-ink-3">
              Você propôs um convívio a partir de {formatDate(convivio.periodoInicio)}. Aguardando {user.name}{' '}
              confirmar.
            </p>
          )}

          {convivio?.status === 'PENDENTE' && !convivio.propostoPorMim && (
            <div>
              <p className="mb-3 text-small text-ink-3">
                {user.name} registrou que vocês moraram juntos de {formatDate(convivio.periodoInicio)}
                {convivio.periodoFim ? ` até ${formatDate(convivio.periodoFim)}` : ' até hoje'}. Confirma?
              </p>
              {convivioError && (
                <Alert tone="danger" className="mb-2">{convivioError}</Alert>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleConfirm}>
                  Confirmar
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleDecline}
                  className="hover:border-danger! hover:text-danger!"
                >
                  Recusar
                </Button>
              </div>
            </div>
          )}

          {convivio?.status === 'RECUSADO' && <p className="text-small text-ink-3">Convívio recusado.</p>}

          {convivio?.status === 'CONFIRMADO' && !convivio.avaliadoPorMim && !rating && (
            <Button size="sm" onClick={() => setRating(true)}>
              Avaliar {user.name}
            </Button>
          )}

          {convivio?.status === 'CONFIRMADO' && convivio.avaliadoPorMim && (
            <p className="text-small text-leaf">Você já avaliou esse convívio.</p>
          )}

          {rating && convivio && (
            <form onSubmit={handleRate} className="mt-3 flex flex-col gap-3 border-t border-line pt-4">
              <div>
                <p className={labelClass}>Pagamentos em dia</p>
                <StarRating value={notaPontualidade} onChange={setNotaPontualidade} />
              </div>
              <div>
                <p className={labelClass}>Qualidade do convívio</p>
                <StarRating value={notaConvivencia} onChange={setNotaConvivencia} />
              </div>
              <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={2} placeholder="Comentário (opcional)" className={fieldClass({ multiline: true })} />
              {convivioError && <Alert tone="danger">{convivioError}</Alert>}
              <div className="flex gap-2">
                <Button type="submit" size="sm">
                  Enviar avaliação
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setRating(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}

      <Card as="section">
        <h2 className="mb-3 text-h3 text-ink">Avaliações de quem já morou junto</h2>
        {!resumo || resumo.total === 0 ? (
          <EmptyState title="Ainda sem avaliações." />
        ) : (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-8">
            <div>
              <p className="text-caption text-ink-3">Pagamentos em dia</p>
              <div className="flex items-center gap-2">
                <StarRating value={resumo.mediaPontualidade} />
                <span className="text-small tabular-nums text-ink-2">{resumo.mediaPontualidade.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-caption text-ink-3">Qualidade do convívio</p>
              <div className="flex items-center gap-2">
                <StarRating value={resumo.mediaConvivencia} />
                <span className="text-small tabular-nums text-ink-2">{resumo.mediaConvivencia.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-caption text-ink-3 sm:self-end">
              {resumo.total} avaliaç{resumo.total === 1 ? 'ão' : 'ões'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {avaliacoes.map((avaliacao) => (
            <div key={avaliacao.id} className="rounded-md border border-line p-3">
              <div className="flex items-center justify-between">
                <p className="text-small font-semibold text-ink">{avaliacao.avaliadorNome}</p>
                <p className="text-caption text-ink-3">
                  {formatDate(avaliacao.periodoInicio)}
                  {avaliacao.periodoFim ? ` até ${formatDate(avaliacao.periodoFim)}` : ' até hoje'}
                </p>
              </div>
              <div className="mt-1 flex gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-caption text-ink-3">Pontualidade</span>
                  <StarRating value={avaliacao.notaPontualidade} size={14} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-caption text-ink-3">Convívio</span>
                  <StarRating value={avaliacao.notaConvivencia} size={14} />
                </div>
              </div>
              {avaliacao.comentario && <p className="mt-2 text-small text-ink-2">{avaliacao.comentario}</p>}
            </div>
          ))}
        </div>
      </Card>
      </div>
      </Columns>
    </Page>
  )
}
