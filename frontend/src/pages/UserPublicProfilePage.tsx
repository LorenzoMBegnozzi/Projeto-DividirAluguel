import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ShieldOff, Flag } from 'lucide-react'
import { getUser } from '../api/profile'
import { getUserRatings, getUserRatingsSummary } from '../api/rating'
import { blockUser, reportUser } from '../api/moderation'
import { apiErrorMessage } from '../api/client'
import StarRating from '../components/StarRating'
import ReportUserModal from '../components/ReportUserModal'
import type { Avaliacao, AvaliacaoResumo, ReportReason, UserProfile } from '../types'

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

export default function UserPublicProfilePage() {
  const { userId } = useParams()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [resumo, setResumo] = useState<AvaliacaoResumo | null>(null)
  const [avaliacoes, setAvaliacoes] = useState<Avaliacao[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blocked, setBlocked] = useState(false)
  const [blockError, setBlockError] = useState<string | null>(null)
  const [showReport, setShowReport] = useState(false)

  useEffect(() => {
    if (!userId) return
    setLoading(true)
    Promise.all([getUser(Number(userId)), getUserRatingsSummary(Number(userId)), getUserRatings(Number(userId))])
      .then(([userData, resumoData, avaliacoesData]) => {
        setUser(userData)
        setResumo(resumoData)
        setAvaliacoes(avaliacoesData)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar o perfil')))
      .finally(() => setLoading(false))
  }, [userId])

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

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Carregando...</div>
  }

  if (error || !user) {
    return <div className="mx-auto max-w-2xl px-4 py-8 text-sm text-red-600">{error ?? 'Usuário não encontrado'}</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="rounded-2xl bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-zinc-800">{user.name}</h1>
            {user.occupation && <p className="text-sm text-zinc-500">{user.occupation}</p>}
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setShowReport(true)}
              title="Denunciar"
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={handleBlock}
              disabled={blocked}
              title={blocked ? 'Bloqueado' : 'Bloquear'}
              className="rounded-lg p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
            >
              <ShieldOff className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        {user.bio && <p className="mt-3 text-sm text-zinc-600">{user.bio}</p>}
        {blocked && <p className="mt-3 text-xs text-emerald-600">Você bloqueou {user.name}.</p>}
        {blockError && <p className="mt-3 text-xs text-red-600">{blockError}</p>}
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

      <div className="mt-6 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="mb-3 text-sm font-semibold text-zinc-700">Avaliações de quem já morou junto</h2>
        {!resumo || resumo.total === 0 ? (
          <p className="text-sm text-zinc-400">Ainda sem avaliações.</p>
        ) : (
          <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:gap-8">
            <div>
              <p className="text-xs text-zinc-500">Pagamentos em dia</p>
              <div className="flex items-center gap-2">
                <StarRating value={resumo.mediaPontualidade} />
                <span className="text-sm text-zinc-600">{resumo.mediaPontualidade.toFixed(1)}</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Qualidade do convívio</p>
              <div className="flex items-center gap-2">
                <StarRating value={resumo.mediaConvivencia} />
                <span className="text-sm text-zinc-600">{resumo.mediaConvivencia.toFixed(1)}</span>
              </div>
            </div>
            <p className="text-xs text-zinc-400 sm:self-end">
              {resumo.total} avaliaç{resumo.total === 1 ? 'ão' : 'ões'}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {avaliacoes.map((avaliacao) => (
            <div key={avaliacao.id} className="rounded-xl border border-zinc-100 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-700">{avaliacao.avaliadorNome}</p>
                <p className="text-xs text-zinc-400">
                  {formatDate(avaliacao.periodoInicio)}
                  {avaliacao.periodoFim ? ` até ${formatDate(avaliacao.periodoFim)}` : ' até hoje'}
                </p>
              </div>
              <div className="mt-1 flex gap-4">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Pontualidade</span>
                  <StarRating value={avaliacao.notaPontualidade} size={14} />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs text-zinc-500">Convívio</span>
                  <StarRating value={avaliacao.notaConvivencia} size={14} />
                </div>
              </div>
              {avaliacao.comentario && <p className="mt-2 text-sm text-zinc-600">{avaliacao.comentario}</p>}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
