import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Users } from 'lucide-react'
import { getInterestStatus, getInterestedPeople, markInterest, unmarkInterest, type InterestStatus } from '../api/interest'
import { startConversationWithInterested } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import Avatar from './Avatar'
import type { UserProfile } from '../types'

interface Props {
  listingId: number
  /** Dono vê a lista de interessados; quem procura vê o botão "Tenho interesse" e, depois, os outros interessados. */
  isOwner: boolean
}

/** "Tenho interesse" de um imóvel (anúncio ESTABELECIMENTO). */
export default function InterestSection({ listingId, isOwner }: Props) {
  const navigate = useNavigate()
  const [status, setStatus] = useState<InterestStatus | null>(null)
  const [people, setPeople] = useState<UserProfile[] | null>(null)
  const [toggling, setToggling] = useState(false)
  const [startingPeerId, setStartingPeerId] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const canSeePeople = isOwner || status?.interested === true

  useEffect(() => {
    getInterestStatus(listingId)
      .then(setStatus)
      .catch(() => setStatus({ interested: false, total: 0 }))
  }, [listingId])

  useEffect(() => {
    if (!canSeePeople) {
      setPeople(null)
      return
    }
    getInterestedPeople(listingId)
      .then(setPeople)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar quem se interessou')))
  }, [listingId, canSeePeople, status?.total])

  async function handleToggle() {
    setToggling(true)
    setError(null)
    try {
      setStatus(status?.interested ? await unmarkInterest(listingId) : await markInterest(listingId))
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível registrar seu interesse'))
    } finally {
      setToggling(false)
    }
  }

  async function handleConversar(otherUserId: number) {
    setStartingPeerId(otherUserId)
    try {
      const conversation = await startConversationWithInterested(listingId, otherUserId)
      navigate(`/conversas/${conversation.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível iniciar a conversa'))
    } finally {
      setStartingPeerId(null)
    }
  }

  if (!status) return null

  return (
    <div className="flex flex-col gap-2">
      {!isOwner && (
        <button
          onClick={handleToggle}
          disabled={toggling}
          className={`flex h-[42px] items-center justify-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition disabled:opacity-60 ${
            status.interested ? 'border-brand bg-brand-tint text-brand-strong' : 'border-line-strong text-ink-2 hover:border-ink'
          }`}
        >
          <Heart className="h-4 w-4" aria-hidden="true" fill={status.interested ? 'currentColor' : 'none'} />
          {status.interested ? 'Interessado' : 'Tenho interesse'}
        </button>
      )}

      {canSeePeople && (
        <div className="rounded-md bg-surface-sunk p-3">
          <p className="mb-2 flex items-center gap-1 text-[13px] font-semibold text-ink-2">
            <Users className="h-3.5 w-3.5" aria-hidden="true" />
            {isOwner
              ? status.total === 0
                ? 'Ninguém demonstrou interesse ainda'
                : `${status.total} ${status.total === 1 ? 'pessoa interessada' : 'pessoas interessadas'}`
              : status.total <= 1
                ? 'Você é o único interessado até o momento'
                : `${status.total - 1} ${status.total - 1 === 1 ? 'pessoa também se interessou' : 'pessoas também se interessaram'}`}
          </p>
          {people && people.length > 0 && (
            <ul className="flex flex-col gap-2">
              {people.map((person) => (
                <li key={person.id} className="flex items-center justify-between gap-2">
                  <button
                    onClick={() => navigate(`/usuarios/${person.id}`)}
                    className="flex min-w-0 items-center gap-2 text-left text-sm font-semibold text-ink hover:text-brand"
                  >
                    <Avatar photoUrl={person.photoUrl} name={person.name} size={28} />
                    <span className="truncate">{person.name}</span>
                  </button>
                  {!isOwner && (
                    <button
                      onClick={() => handleConversar(person.id)}
                      disabled={startingPeerId === person.id}
                      className="h-[32px] shrink-0 rounded-md border border-line-strong px-2.5 text-xs font-semibold text-ink-2 transition hover:border-ink hover:text-ink disabled:opacity-60"
                    >
                      {startingPeerId === person.id ? 'Abrindo…' : 'Conversar'}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
    </div>
  )
}
