import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { browseEstablishments, browseRoommates, startConversation, startConversationWithInterested } from '../api/discovery'
import { getInterestStatus, getInterestedPeople, markInterest, unmarkInterest, type InterestStatus } from '../api/interest'
import { apiErrorMessage } from '../api/client'
import { Banknote, Cigarette, CigaretteOff, GraduationCap, Heart, MapPin, Music, PawPrint, Salad, Star, Users } from 'lucide-react'
import Fact from '../components/Fact'
import ListingMapPreview from '../components/ListingMapPreview'
import { dietLabels, petPreferenceLabels, smokingHabitLabels } from '../constants/profileOptions'
import Avatar from '../components/Avatar'
import type { BrowseItem, UserProfile } from '../types'

type Tab = 'ROOMMATES' | 'ESTABLISHMENTS'

function scoreColor(score: number) {
  if (score >= 75) return 'bg-emerald-100 text-emerald-700'
  if (score >= 50) return 'bg-amber-100 text-amber-700'
  return 'bg-zinc-100 text-zinc-600'
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('ROOMMATES')
  const [items, setItems] = useState<BrowseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [interestStatus, setInterestStatus] = useState<Record<number, InterestStatus>>({})
  const [togglingInterestId, setTogglingInterestId] = useState<number | null>(null)
  const [expandedListingId, setExpandedListingId] = useState<number | null>(null)
  const [interestedPeople, setInterestedPeople] = useState<Record<number, UserProfile[]>>({})
  const [loadingPeopleId, setLoadingPeopleId] = useState<number | null>(null)
  const [startingPeerId, setStartingPeerId] = useState<number | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function load() {
    setLoading(true)
    setError(null)
    setExpandedListingId(null)
    setInterestedPeople({})
    const request = tab === 'ROOMMATES' ? browseRoommates() : browseEstablishments()
    request
      .then((data) => {
        setItems(data)
        if (tab === 'ESTABLISHMENTS') {
          Promise.all(
            data.map((item) =>
              getInterestStatus(item.listing.id)
                .then((status) => [item.listing.id, status] as const)
                .catch(() => [item.listing.id, { interested: false, total: 0 }] as const)
            )
          ).then((entries) => {
            setInterestStatus(Object.fromEntries(entries))
          })
        }
      })
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os anúncios')))
      .finally(() => setLoading(false))
  }

  async function handleToggleInterest(listingId: number) {
    setTogglingInterestId(listingId)
    try {
      const current = interestStatus[listingId]
      const updated = current?.interested ? await unmarkInterest(listingId) : await markInterest(listingId)
      setInterestStatus((prev) => ({ ...prev, [listingId]: updated }))
      if (expandedListingId === listingId) {
        const people = await getInterestedPeople(listingId)
        setInterestedPeople((prev) => ({ ...prev, [listingId]: people }))
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível registrar seu interesse'))
    } finally {
      setTogglingInterestId(null)
    }
  }

  async function handleToggleExpanded(listingId: number) {
    if (expandedListingId === listingId) {
      setExpandedListingId(null)
      return
    }
    setExpandedListingId(listingId)
    if (!interestedPeople[listingId]) {
      setLoadingPeopleId(listingId)
      try {
        const people = await getInterestedPeople(listingId)
        setInterestedPeople((prev) => ({ ...prev, [listingId]: people }))
      } catch (err) {
        setError(apiErrorMessage(err, 'Não foi possível carregar quem se interessou'))
      } finally {
        setLoadingPeopleId(null)
      }
    }
  }

  async function handleConversarComInteressado(listingId: number, otherUserId: number) {
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

  async function handleConversar(listingId: number) {
    setStartingId(listingId)
    try {
      const conversation = await startConversation(listingId)
      navigate(`/conversas/${conversation.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível iniciar a conversa'))
    } finally {
      setStartingId(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Buscar</h1>
      <p className="mb-4 text-sm text-zinc-500">Ordenado pela sua compatibilidade.</p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('ROOMMATES')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            tab === 'ROOMMATES' ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          Tem vaga
        </button>
        <button
          onClick={() => setTab('ESTABLISHMENTS')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            tab === 'ESTABLISHMENTS' ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          Estabelecimentos
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-zinc-400">Carregando...</div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Ainda não há anúncios ativos nessa categoria. Volte mais tarde!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.listing.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar photoUrl={item.user.photoUrl} name={item.user.name} size={44} />
                  <div>
                    <h2 className="text-lg font-semibold text-zinc-800">
                      {tab === 'ROOMMATES' ? item.user.name : item.listing.title}
                    </h2>
                    <p className="text-sm text-zinc-500">
                      {tab === 'ROOMMATES' ? item.user.occupation : item.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${scoreColor(item.compatibilityScore)}`}>
                    {item.compatibilityScore}% compatível
                  </span>
                  {item.listing.highlighted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Destaque
                    </span>
                  )}
                </div>
              </div>

              {tab === 'ROOMMATES' && item.user.bio && <p className="mb-3 text-sm text-zinc-600">{item.user.bio}</p>}

              {tab === 'ROOMMATES' && (
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {item.user.smokingHabit && <Fact icon={Cigarette}>{smokingHabitLabels[item.user.smokingHabit]}</Fact>}
                  {item.user.diet && <Fact icon={Salad}>{dietLabels[item.user.diet]}</Fact>}
                  {item.user.petPreferences.length > 0 && (
                    <Fact icon={PawPrint}>
                      {item.user.petPreferences.map((p) => petPreferenceLabels[p]).join(', ')}
                    </Fact>
                  )}
                  {item.user.musicTaste && <Fact icon={Music}>{item.user.musicTaste}</Fact>}
                </div>
              )}

              {tab === 'ESTABLISHMENTS' && (
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {item.listing.acceptsPets != null && (
                    <Fact icon={PawPrint}>{item.listing.acceptsPets ? 'Aceita animais' : 'Não aceita animais'}</Fact>
                  )}
                  {item.listing.acceptsSmoker != null && (
                    <Fact icon={item.listing.acceptsSmoker ? Cigarette : CigaretteOff}>
                      {item.listing.acceptsSmoker ? 'Aceita fumantes' : 'Não aceita fumantes'}
                    </Fact>
                  )}
                </div>
              )}

              <p className="mb-3 text-sm text-zinc-700">
                <strong>{item.listing.title}</strong>
                {item.listing.description && <span className="block text-zinc-500">{item.listing.description}</span>}
              </p>

              <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                {item.listing.preferredNeighborhood && <Fact icon={MapPin}>{item.listing.preferredNeighborhood}</Fact>}
                {item.listing.nearCollege && <Fact icon={GraduationCap}>Perto de {item.listing.nearCollege}</Fact>}
                {item.listing.price != null && <Fact icon={Banknote}>R$ {item.listing.price}</Fact>}
              </div>

              {item.listing.latitude != null && item.listing.longitude != null && (
                <div className="mb-3">
                  <ListingMapPreview latitude={item.listing.latitude} longitude={item.listing.longitude} />
                  {item.listing.address && <p className="mt-1 text-xs text-zinc-500">{item.listing.address}</p>}
                </div>
              )}

              {tab === 'ESTABLISHMENTS' ? (
                <>
                  <div className="mb-2 flex gap-2">
                    <button
                      onClick={() => handleConversar(item.listing.id)}
                      disabled={startingId === item.listing.id}
                      className="flex-1 rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                    >
                      {startingId === item.listing.id ? 'Abrindo...' : 'Conversar com o dono'}
                    </button>
                    <button
                      onClick={() => handleToggleInterest(item.listing.id)}
                      disabled={togglingInterestId === item.listing.id}
                      className={`flex shrink-0 items-center gap-1 rounded-lg border px-3 py-2 text-sm font-semibold transition disabled:opacity-60 ${
                        interestStatus[item.listing.id]?.interested
                          ? 'border-rose-500 bg-rose-50 text-rose-600'
                          : 'border-zinc-200 text-zinc-500 hover:border-rose-300 hover:text-rose-500'
                      }`}
                    >
                      <Heart
                        className="h-4 w-4"
                        aria-hidden="true"
                        fill={interestStatus[item.listing.id]?.interested ? 'currentColor' : 'none'}
                      />
                      {interestStatus[item.listing.id]?.interested ? 'Interessado' : 'Tenho interesse'}
                    </button>
                  </div>

                  {(interestStatus[item.listing.id]?.total ?? 0) > 0 && (
                    <div className="mt-1">
                      <button
                        onClick={() => handleToggleExpanded(item.listing.id)}
                        className="flex items-center gap-1 text-xs font-semibold text-zinc-500 hover:text-brand-600"
                      >
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {interestStatus[item.listing.id]?.total} pessoa(s) também se interessaram
                      </button>

                      {expandedListingId === item.listing.id && (
                        <div className="mt-2 flex flex-col gap-2 rounded-lg bg-zinc-50 p-3">
                          {loadingPeopleId === item.listing.id ? (
                            <p className="text-xs text-zinc-400">Carregando...</p>
                          ) : (interestedPeople[item.listing.id] ?? []).length === 0 ? (
                            <p className="text-xs text-zinc-400">Ninguém mais se interessou ainda.</p>
                          ) : (
                            interestedPeople[item.listing.id]?.map((person) => (
                              <div key={person.id} className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() => navigate(`/usuarios/${person.id}`)}
                                  className="text-sm font-medium text-zinc-700 hover:text-brand-600 hover:underline"
                                >
                                  {person.name}
                                </button>
                                <button
                                  onClick={() => handleConversarComInteressado(item.listing.id, person.id)}
                                  disabled={startingPeerId === person.id}
                                  className="rounded-lg border border-brand-600 px-2.5 py-1 text-xs font-semibold text-brand-600 transition hover:bg-brand-50 disabled:opacity-60"
                                >
                                  {startingPeerId === person.id ? 'Abrindo...' : 'Conversar'}
                                </button>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <button
                  onClick={() => handleConversar(item.listing.id)}
                  disabled={startingId === item.listing.id}
                  className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
                >
                  {startingId === item.listing.id ? 'Abrindo...' : 'Conversar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
