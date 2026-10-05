import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { browseEstablishments, browseRoommates, startConversation, startConversationWithInterested } from '../api/discovery'
import { getInterestStatus, getInterestedPeople, markInterest, unmarkInterest, type InterestStatus } from '../api/interest'
import { getListingPhotos } from '../api/listings'
import { apiErrorMessage } from '../api/client'
import {
  Banknote,
  ChevronLeft,
  ChevronRight,
  Cigarette,
  CigaretteOff,
  GraduationCap,
  Heart,
  Home,
  LayoutGrid,
  List,
  MapPin,
  MapPinned,
  PawPrint,
  Salad,
  Star,
  Users,
  X,
} from 'lucide-react'
import Fact from '../components/Fact'
import PropertyFacts from '../components/PropertyFacts'
import ListingMapPreview from '../components/ListingMapPreview'
import CompatScore from '../components/CompatScore'
import LocationAutocomplete from '../components/LocationAutocomplete'
import PickLocationModal from '../components/PickLocationModal'
import PhotoLightbox from '../components/PhotoLightbox'
import { useAuth } from '../context/AuthContext'
import { dietLabels, genderLabels, genderPreferenceLabels, petPreferenceLabels, smokingHabitLabels } from '../constants/profileOptions'
import Avatar from '../components/Avatar'
import { formatResidents } from '../utils/format'
import type { BrowseItem, UserProfile } from '../types'
import { Alert, Badge, Button, Card, EmptyState, cx, fieldClass, focusRing, pageTitleClass } from '../components/ui'

type Tab = 'ROOMMATES' | 'ESTABLISHMENTS'
type ViewMode = 'list' | 'grid'

/** Quantos anúncios mostrar por página: carregar tudo de uma vez pesa a tela com muitas fotos e mapas. */
const PAGE_SIZE = 10

export default function BrowsePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>('ROOMMATES')
  // No computador (a partir do breakpoint md, onde a grade tem 2 colunas) começa em grade; no celular, em lista.
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    window.matchMedia('(min-width: 768px)').matches ? 'grid' : 'list',
  )
  const [bairro, setBairro] = useState('')
  const [precoMax, setPrecoMax] = useState('')
  const [mapPoint, setMapPoint] = useState<{ lat: number; lng: number } | null>(null)
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [items, setItems] = useState<BrowseItem[]>([])
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const [startingId, setStartingId] = useState<number | null>(null)
  const [interestStatus, setInterestStatus] = useState<Record<number, InterestStatus>>({})
  const [togglingInterestId, setTogglingInterestId] = useState<number | null>(null)
  const [expandedListingId, setExpandedListingId] = useState<number | null>(null)
  const [interestedPeople, setInterestedPeople] = useState<Record<number, UserProfile[]>>({})
  const [loadingPeopleId, setLoadingPeopleId] = useState<number | null>(null)
  const [startingPeerId, setStartingPeerId] = useState<number | null>(null)
  const [listingPhotos, setListingPhotos] = useState<Record<number, string[]>>({})
  const [lightbox, setLightbox] = useState<string[] | null>(null)

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
    setListingPhotos({})
    setInterestStatus({})
    setPage(1)
    const filters = {
      bairro: mapPoint ? undefined : bairro.trim() || undefined,
      lat: mapPoint?.lat,
      lng: mapPoint?.lng,
      precoMax: precoMax ? Number(precoMax) : undefined,
    }
    const request = tab === 'ROOMMATES' ? browseRoommates(filters) : browseEstablishments(filters)
    request
      .then(setItems)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os anúncios')))
      .finally(() => setLoading(false))
  }

  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE))
  const pageItems = useMemo(
    () => items.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [items, page],
  )

  // Só busca fotos/interesse de quem está na página atual — não da lista inteira de uma vez.
  useEffect(() => {
    const pending = pageItems.filter((item) => !(item.listing.id in listingPhotos))
    if (pending.length === 0) return
    Promise.all(
      pending.map((item) =>
        getListingPhotos(item.listing.id)
          .then((photos) => [item.listing.id, photos] as const)
          .catch(() => [item.listing.id, [] as string[]] as const),
      ),
    ).then((entries) => {
      setListingPhotos((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageItems])

  useEffect(() => {
    if (tab !== 'ESTABLISHMENTS') return
    const pending = pageItems.filter((item) => !(item.listing.id in interestStatus))
    if (pending.length === 0) return
    Promise.all(
      pending.map((item) =>
        getInterestStatus(item.listing.id)
          .then((status) => [item.listing.id, status] as const)
          .catch(() => [item.listing.id, { interested: false, total: 0 }] as const),
      ),
    ).then((entries) => {
      setInterestStatus((prev) => ({ ...prev, ...Object.fromEntries(entries) }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageItems, tab])

  function goToPage(next: number) {
    setPage(Math.min(Math.max(1, next), totalPages))
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  async function handleToggleInterest(listingId: number) {
    setTogglingInterestId(listingId)
    try {
      const current = interestStatus[listingId]
      const updated = current?.interested ? await unmarkInterest(listingId) : await markInterest(listingId)
      setInterestStatus((prev) => ({ ...prev, [listingId]: updated }))
      if (updated.interested) {
        // Ao marcar interesse, a lista de quem mais se interessou já abre sozinha.
        setExpandedListingId(listingId)
        setLoadingPeopleId(listingId)
        try {
          const people = await getInterestedPeople(listingId)
          setInterestedPeople((prev) => ({ ...prev, [listingId]: people }))
        } finally {
          setLoadingPeopleId(null)
        }
      } else if (expandedListingId === listingId) {
        // Sem interesse a lista não fica mais disponível (o backend recusa).
        setExpandedListingId(null)
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
      <h1 className={cx('mb-1', pageTitleClass)}>Buscar</h1>
      <p className="mb-4 text-small text-ink-3">Ordenado pela sua compatibilidade.</p>
      {tab === 'ROOMMATES' && !user?.gender && (
        <Alert tone="info" className="mb-4">
          Informe seu sexo no perfil para ver também as vagas exclusivas para homens ou mulheres.
        </Alert>
      )}

      <div className="mb-6 flex gap-2">
        <Button
          onClick={() => setTab('ROOMMATES')}
          variant={tab === 'ROOMMATES' ? 'inverse' : 'secondary'}
          className="flex-1"
        >
          Busco uma vaga
        </Button>
        <Button
          onClick={() => setTab('ESTABLISHMENTS')}
          variant={tab === 'ESTABLISHMENTS' ? 'inverse' : 'secondary'}
          className="flex-1"
        >
          Busco um imóvel
        </Button>
        <Button
          onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}
          title={viewMode === 'list' ? 'Ver em grade' : 'Ver em lista'}
          aria-label={viewMode === 'list' ? 'Ver em grade' : 'Ver em lista'}
          variant="secondary"
          icon={viewMode === 'list' ? LayoutGrid : List}
          className="shrink-0"
        />
      </div>

      <div className={`flex flex-col gap-3 sm:flex-row ${mapPoint ? 'mb-2' : 'mb-6'}`}>
        <div className="flex flex-1 gap-2">
          <div className="flex-1">
            <LocationAutocomplete
              value={bairro}
              onChange={handleBairroChange}
              onSelectPlace={(place) => setMapPoint({ lat: place.lat, lng: place.lon })}
              placeholder="Bairro ou faculdade"
              className={fieldClass()}
            />
          </div>
          <Button
            onClick={() => setShowMapPicker(true)}
            title="Marcar local no mapa"
            aria-label="Marcar local no mapa"
            variant="secondary"
            icon={MapPinned}
            className="shrink-0"
          />
        </div>
        <input
          value={precoMax}
          onChange={(e) => setPrecoMax(e.target.value)}
          type="number"
          min="0"
          placeholder="Orçamento máximo (R$)"
          className={cx(fieldClass(), 'flex-1')}
        />
      </div>

      {mapPoint && (
        <div className="mb-6 flex items-center gap-1.5 text-caption text-ink-3">
          <MapPinned className="size-3.5 shrink-0" aria-hidden="true" />
          Mostrando lugares perto do ponto marcado no mapa
          <button
            type="button"
            onClick={() => setMapPoint(null)}
            className={cx('ml-1 inline-flex items-center gap-1 rounded-sm font-semibold text-ink-2 hover:text-danger', focusRing)}
          >
            <X className="size-3.5" aria-hidden="true" />
            limpar
          </button>
        </div>
      )}

      {lightbox && <PhotoLightbox photos={lightbox} onClose={() => setLightbox(null)} />}

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

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="p-8 text-center text-ink-3">Carregando…</div>
      ) : items.length === 0 ? (
        <EmptyState title="Ainda não há anúncios ativos nessa categoria. Volte mais tarde!" />
      ) : (
        <div ref={resultsRef}>
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 gap-4 md:grid-cols-2' : 'flex flex-col gap-4'}>
          {pageItems.map((item) => (
            <Card key={item.listing.id} padding="sm" className="flex flex-col sm:p-5">
              {(listingPhotos[item.listing.id] ?? []).length > 0 && (
                <button
                  type="button"
                  onClick={() => setLightbox(listingPhotos[item.listing.id])}
                  aria-label="Ver fotos do anúncio"
                  className={cx('relative mb-3 block h-40 w-full overflow-hidden rounded-lg', focusRing)}
                >
                  <img src={listingPhotos[item.listing.id][0]} alt="" className="h-full w-full object-cover" />
                  {listingPhotos[item.listing.id].length > 1 && (
                    <span className="absolute bottom-2 right-2 rounded-sm bg-scrim px-2 py-0.5 text-caption font-bold text-on-inverse">
                      {listingPhotos[item.listing.id].length} fotos
                    </span>
                  )}
                </button>
              )}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar photoUrl={item.user.photoUrl} name={item.user.name} size={44} />
                  <div className="min-w-0">
                    <h2 className="truncate text-h3 text-ink">
                      {tab === 'ROOMMATES' ? item.user.name : item.listing.title}
                    </h2>
                    <p className="truncate text-caption text-ink-3">
                      {tab === 'ROOMMATES' ? item.user.occupation : item.user.name}
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1.5">
                  <CompatScore score={item.compatibilityScore} />
                  {item.listing.highlighted && (
                    <Badge tone="warning" icon={Star}>
                      Destaque
                    </Badge>
                  )}
                </div>
              </div>

              {tab === 'ROOMMATES' && item.user.bio && <p className="mb-3 text-body text-ink-2">{item.user.bio}</p>}

              {tab === 'ROOMMATES' && (
                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-3">
                  {item.user.gender && <Fact icon={Users}>{genderLabels[item.user.gender]}</Fact>}
                  {item.user.smokingHabit && <Fact icon={Cigarette}>{smokingHabitLabels[item.user.smokingHabit]}</Fact>}
                  {item.user.diet && (
                    <Fact icon={Salad}>
                      {item.user.diet === 'OUTRO' && item.user.dietOther ? item.user.dietOther : dietLabels[item.user.diet]}
                    </Fact>
                  )}
                  {item.user.petPreferences.length > 0 && (
                    <Fact icon={PawPrint}>
                      {item.user.petPreferences.map((p) => petPreferenceLabels[p]).join(', ')}
                    </Fact>
                  )}
                </div>
              )}

              {tab === 'ESTABLISHMENTS' && (
                <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-3">
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

              <p className="mb-3 text-body text-ink-2">
                <strong className="text-ink">{item.listing.title}</strong>
                {item.listing.description && <span className="block">{item.listing.description}</span>}
              </p>

              <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-3">
                {item.listing.preferredNeighborhood && <Fact icon={MapPin}>{item.listing.preferredNeighborhood}</Fact>}
                {item.listing.nearCollege && <Fact icon={GraduationCap}>Perto de {item.listing.nearCollege}</Fact>}
                {item.listing.price != null && (
                  <Fact icon={Banknote}>
                    <span className="tabular-nums">R$ {item.listing.price}</span>
                  </Fact>
                )}
                {tab === 'ROOMMATES' && item.listing.genderPreference !== 'QUALQUER' && (
                  <Fact icon={Users}>{genderPreferenceLabels[item.listing.genderPreference]}</Fact>
                )}
                {item.listing.availableSlots != null && (
                  <Fact icon={Users}>
                    {item.listing.availableSlots} {item.listing.availableSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                  </Fact>
                )}
                {formatResidents(item.listing.currentResidentsMale, item.listing.currentResidentsFemale) && (
                  <Fact icon={Home}>{formatResidents(item.listing.currentResidentsMale, item.listing.currentResidentsFemale)}</Fact>
                )}
                <PropertyFacts listing={item.listing} />
              </div>

              {item.listing.latitude != null && item.listing.longitude != null && (
                <div className="mb-3">
                  <ListingMapPreview latitude={item.listing.latitude} longitude={item.listing.longitude} />
                  {item.listing.address && <p className="mt-1 text-caption text-ink-3">{item.listing.address}</p>}
                </div>
              )}

              {tab === 'ESTABLISHMENTS' ? (
                <>
                  <div className="mb-2 flex gap-2">
                    <Button
                      onClick={() => handleConversar(item.listing.id)}
                      disabled={startingId === item.listing.id}
                      className="flex-1"
                    >
                      {startingId === item.listing.id ? 'Abrindo…' : 'Conversar com o dono'}
                    </Button>
                    <Button
                      onClick={() => handleToggleInterest(item.listing.id)}
                      disabled={togglingInterestId === item.listing.id}
                      variant="secondary"
                      className={cx(
                        'shrink-0 gap-1.5 px-3',
                        interestStatus[item.listing.id]?.interested && 'border-brand bg-brand-tint text-brand-strong hover:border-brand',
                      )}
                    >
                      <Heart
                        className="size-4"
                        aria-hidden="true"
                        fill={interestStatus[item.listing.id]?.interested ? 'currentColor' : 'none'}
                      />
                      {interestStatus[item.listing.id]?.interested ? 'Interessado' : 'Tenho interesse'}
                    </Button>
                  </div>

                  {interestStatus[item.listing.id]?.interested && interestStatus[item.listing.id]?.total === 1 && (
                    <p className="mt-1 flex items-center gap-1 text-caption font-semibold text-ink-3">
                      <Users className="size-3.5" aria-hidden="true" />
                      Você é o único interessado até o momento
                    </p>
                  )}

                  {(interestStatus[item.listing.id]?.total ?? 0) > (interestStatus[item.listing.id]?.interested ? 1 : 0) && (
                    <div className="mt-1">
                      <button
                        onClick={() => handleToggleExpanded(item.listing.id)}
                        className={cx('flex items-center gap-1 rounded-sm text-caption font-semibold text-ink-3 hover:text-brand', focusRing)}
                      >
                        <Users className="size-3.5" aria-hidden="true" />
                        {(interestStatus[item.listing.id]?.total ?? 0) - (interestStatus[item.listing.id]?.interested ? 1 : 0)} pessoa(s){' '}
                        {interestStatus[item.listing.id]?.interested ? 'também se interessaram' : 'se interessaram'}
                      </button>

                      {expandedListingId === item.listing.id && (
                        <Card tone="sunk" padding="sm" className="mt-2 flex flex-col gap-2">
                          {loadingPeopleId === item.listing.id ? (
                            <p className="text-caption text-ink-3">Carregando…</p>
                          ) : (interestedPeople[item.listing.id] ?? []).length === 0 ? (
                            <p className="text-caption text-ink-3">Ninguém mais se interessou ainda.</p>
                          ) : (
                            interestedPeople[item.listing.id]?.map((person) => (
                              <div key={person.id} className="flex items-center justify-between gap-2">
                                <button
                                  onClick={() => navigate(`/usuarios/${person.id}`)}
                                  className={cx('rounded-sm text-small font-semibold text-ink hover:text-brand hover:underline', focusRing)}
                                >
                                  {person.name}
                                </button>
                                <Button
                                  onClick={() => handleConversarComInteressado(item.listing.id, person.id)}
                                  disabled={startingPeerId === person.id}
                                  variant="secondary"
                                  size="sm"
                                >
                                  {startingPeerId === person.id ? 'Abrindo…' : 'Conversar'}
                                </Button>
                              </div>
                            ))
                          )}
                        </Card>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <Button
                  onClick={() => handleConversar(item.listing.id)}
                  disabled={startingId === item.listing.id}
                  full
                >
                  {startingId === item.listing.id ? 'Abrindo…' : 'Conversar'}
                </Button>
              )}
            </Card>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-center gap-3">
            <Button
              onClick={() => goToPage(page - 1)}
              disabled={page === 1}
              aria-label="Página anterior"
              variant="secondary"
              icon={ChevronLeft}
            />
            <p className="text-small font-semibold text-ink-2">
              {page} de {totalPages}
            </p>
            <Button
              onClick={() => goToPage(page + 1)}
              disabled={page === totalPages}
              aria-label="Próxima página"
              variant="secondary"
              icon={ChevronRight}
            />
          </div>
        )}
        </div>
      )}
    </div>
  )
}
