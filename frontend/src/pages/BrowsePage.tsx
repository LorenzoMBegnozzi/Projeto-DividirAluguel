import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { browseEstablishments, browseRoommates, startConversation, startConversationWithInterested } from '../api/discovery'
import { getInterestStatus, getInterestedPeople, markInterest, unmarkInterest, type InterestStatus } from '../api/interest'
import { getListingPhotos } from '../api/listings'
import { apiErrorMessage } from '../api/client'
import {
  Banknote,
  Cigarette,
  CigaretteOff,
  GraduationCap,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  MapPinned,
  Music,
  PawPrint,
  Salad,
  Star,
  Users,
  X,
} from 'lucide-react'
import Fact from '../components/Fact'
import ListingMapPreview from '../components/ListingMapPreview'
import CompatScore from '../components/CompatScore'
import LocationAutocomplete from '../components/LocationAutocomplete'
import PickLocationModal from '../components/PickLocationModal'
import { dietLabels, petPreferenceLabels, smokingHabitLabels } from '../constants/profileOptions'
import Avatar from '../components/Avatar'
import type { BrowseItem, UserProfile } from '../types'

type Tab = 'ROOMMATES' | 'ESTABLISHMENTS'
type ViewMode = 'list' | 'grid'

export default function BrowsePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('ROOMMATES')
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [bairro, setBairro] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [mapPoint, setMapPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
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
  const [coverPhotos, setCoverPhotos] = useState<Record<number, string | null>>({})

  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, bairro, mapPoint, precoMax])

  function handleBairroChange(value: string) {
    setBairro(value)
    setMapPoint(null)
  }

  function load() {
    setLoading(true)
    setError(null)
    setExpandedListingId(null)
    setInterestedPeople({})
    const filters = {
      bairro: mapPoint ? undefined : bairro.trim() || undefined,
      lat: mapPoint?.lat,
      lng: mapPoint?.lng,
      precoMax: precoMax ? Number(precoMax) : undefined,
    }
    const request = tab === 'ROOMMATES' ? browseRoommates(filters) : browseEstablishments(filters)
    request
      .then((data) => {
        setItems(data)
        setCoverPhotos({})
        Promise.all(
          data.map((item) =>
            getListingPhotos(item.listing.id)
              .then((photos) => [item.listing.id, photos[0] ?? null] as const)
              .catch(() => [item.listing.id, null] as const)
          )
        ).then((entries) => {
          setCoverPhotos(Object.fromEntries(entries))
        })
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
    <div className={`mx-auto px-4 py-8 transition-[max-width] ${viewMode === 'grid' ? 'max-w-5xl' : 'max-w-2xl'}`}>
      <h1 className="mb-1 text-[28px] font-extrabold tracking-tight text-ink">Buscar</h1>
      <p className="mb-4 text-sm text-ink-3">Ordenado pela sua compatibilidade.</p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('ROOMMATES')}
          className={`h-[42px] flex-1 rounded-md border text-sm font-semibold transition ${
            tab === 'ROOMMATES' ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong text-ink-2 hover:border-ink'
          }`}
        >
          Preciso de uma vaga
        </button>
        <button
          onClick={() => setTab('ESTABLISHMENTS')}
          className={`h-[42px] flex-1 rounded-md border text-sm font-semibold transition ${
            tab === 'ESTABLISHMENTS' ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong text-ink-2 hover:border-ink'
          }`}
        >
          Estabelecimentos
        </button>
        <button
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          title={viewMode === 'list' ? 'Ver em grade' : 'Ver em lista'}
          aria-label={viewMode === 'list' ? 'Ver em grade' : 'Ver em lista'}
          className="inline-flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-md border border-line-strong text-ink-2 transition hover:border-ink hover:text-ink"
        >
          {viewMode === 'list' ? <LayoutGrid className="h-[18px] w-[18px]" aria-hidden="true" /> : <List className="h-[18px] w-[18px]" aria-hidden="true" />}
        </button>
      </div>

      <div className={`flex flex-col gap-3 sm:flex-row ${mapPoint ? 'mb-2' : 'mb-6'}`}>
        <div className="flex flex-1 gap-2">
          <div className="flex-1">
            <LocationAutocomplete
              value={bairro}
              onChange={handleBairroChange}
              onSelectPlace={(place) => setMapPoint({ lat: place.lat, lng: place.lon })}
              placeholder="Bairro ou faculdade"
              className="h-11 w-full rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
            />
          </div>
          <button
            type="button"
            onClick={() => setShowMapPicker(true)}
            title="Marcar local no mapa"
            aria-label="Marcar local no mapa"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md border border-line-strong text-ink-2 transition hover:border-ink hover:text-ink"
          >
            <MapPinned className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
        </div>
        <input
          value={precoMax}
          onChange={(e) => setPrecoMax(e.target.value)}
          type="number"
          min="0"
          placeholder="Orçamento máximo (R$)"
          className="h-11 flex-1 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
        />
      </div>

      {mapPoint && (
        <div className="mb-6 flex items-center gap-1.5 text-[13px] text-ink-3">
          <MapPinned className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          Mostrando lugares perto do ponto marcado no mapa
          <button
            type="button"
            onClick={() => setMapPoint(null)}
            className="ml-1 inline-flex items-center gap-1 font-semibold text-ink-2 hover:text-danger"
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            limpar
          </button>
        </div>
      )}

      {showMapPicker && (
        <PickLocationModal
          onClose={() => setShowMapPicker(false)}
          onConfirm={(lat, lng) => {
            setMapPoint({ lat, lng })
            setBairro('')
            setShowMapPicker(false)
          }}
        />
      )}

      {error && <div className="mb-4 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-ink-3">Carregando…</div>
      ) : items.length === 0 ? (
        <p className="rounded-lg border border-line bg-surface p-8 text-center text-sm text-ink-3">
          Ainda não há anúncios ativos nessa categoria. Volte mais tarde!
        </p>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'flex flex-col gap-4'}>
          {items.map((item) => (
            <div key={item.listing.id} className="flex flex-col rounded-lg border border-line bg-surface p-5">
              {coverPhotos[item.listing.id] && (
                <img
                  src={coverPhotos[item.listing.id] ?? undefined}
                  alt=""
                  className="mb-3 h-40 w-full rounded-md object-cover"
                />
              )}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar photoUrl={item.user.photoUrl} name={item.user.name} size={44} />
                  <div className="min-w-0">
                    <h2 className="truncate text-xl font-bold tracking-tight text-ink">
                      {tab === 'ROOMMATES' ? item.user.name : item.listing.title}
                    </h2>
                    <p className="truncate text-[13px] text-ink-3">
                      {tab === 'ROOMMATES' ? item.user.occupation : item.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <CompatScore score={item.compatibilityScore} />
                  {item.listing.highlighted && (
                    <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-mel-tint px-2 text-xs font-bold text-mel">
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      Destaque
                    </span>
                  )}
                </div>
              </div>

              {tab === 'ROOMMATES' && item.user.bio && <p className="mb-3 text-ink-2">{item.user.bio}</p>}

              {tab === 'ROOMMATES' && (
                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-3">
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
                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-3">
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

              <p className="mb-3 text-ink-2">
                <strong className="text-ink">{item.listing.title}</strong>
                {item.listing.description && <span className="block">{item.listing.description}</span>}
              </p>

              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-3">
                {item.listing.preferredNeighborhood && <Fact icon={MapPin}>{item.listing.preferredNeighborhood}</Fact>}
                {item.listing.nearCollege && <Fact icon={GraduationCap}>Perto de {item.listing.nearCollege}</Fact>}
                {item.listing.price != null && (
                  <Fact icon={Banknote}>
                    <span className="tabular-nums">R$ {item.listing.price}</span>
                  </Fact>
                )}
                {item.listing.availableSlots != null && (
                  <Fact icon={Users}>
                    {item.listing.availableSlots} {item.listing.availableSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </Fact>
                )}
              </div>

              {item.listing.latitude != null && item.listing.longitude != null && (
                <div className="mb-3">
                  <ListingMapPreview latitude={item.listing.latitude} longitude={item.listing.longitude} />
                  {item.listing.address && <p className="mt-1 text-[13px] text-ink-3">{item.listing.address}</p>}
                </div>
              )}

              {tab === 'ESTABLISHMENTS' ? (
                <>
                  <div className="mb-2 flex gap-2">
                    <button
                      onClick={() => handleConversar(item.listing.id)}
                      disabled={startingId === item.listing.id}
                      className="h-[42px] flex-1 rounded-md bg-brand text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
                    >
                      {startingId === item.listing.id ? 'Abrindo…' : 'Conversar com o dono'}
                    </button>
                    <button
                      onClick={() => handleToggleInterest(item.listing.id)}
                      disabled={togglingInterestId === item.listing.id}
                      className={`flex h-[42px] shrink-0 items-center gap-1.5 rounded-md border px-3 text-sm font-semibold transition disabled:opacity-60 ${
                        interestStatus[item.listing.id]?.interested
                          ? 'border-brand bg-brand-tint text-brand-strong'
                          : 'border-line-strong text-ink-2 hover:border-ink'
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
                        className="flex items-center gap-1 text-[13px] font-semibold text-ink-3 hover:text-brand"
                      >
                        <Users className="h-3.5 w-3.5" aria-hidden="true" />
                        {interestStatus[item.listing.id]?.total} pessoa(s) também se interessaram
                      </button>

                      {expandedListingId === item.listing.id && (
                        <div className="mt-2 flex flex-col gap-2 rounded-md bg-surface-sunk p-3">
                          {loadingPeopleId === item.listing.id ? (
                            <p className="text-[13px] text-ink-3">Carregando…</p>
                          ) : (interestedPeople[item.listing.id] ?? []).length === 0 ? (
                            <p className="text-[13px] text-ink-3">Ninguém mais se interessou ainda.</p>
                          ) : (
                            interestedPeople[item.listing.id]?.map((person) => (
                              <div key={person.id} className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() => navigate(`/usuarios/${person.id}`)}
                                  className="text-sm font-semibold text-ink hover:text-brand hover:underline"
                                >
                                  {person.name}
                                </button>
                                <button
                                  onClick={() => handleConversarComInteressado(item.listing.id, person.id)}
                                  disabled={startingPeerId === person.id}
                                  className="h-[32px] rounded-md border border-line-strong px-2.5 text-xs font-semibold text-ink-2 transition hover:border-ink hover:text-ink disabled:opacity-60"
                                >
                                  {startingPeerId === person.id ? 'Abrindo…' : 'Conversar'}
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
                  className="h-[42px] w-full rounded-md bg-brand text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
                >
                  {startingId === item.listing.id ? 'Abrindo…' : 'Conversar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
