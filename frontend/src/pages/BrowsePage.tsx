import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { browseEstablishments, browseRoommates, startConversation, startConversationWithInterested } from '../api/discovery'
import { getInterestStatus, getInterestedPeople, markInterest, unmarkInterest, type InterestStatus } from '../api/interest'
import { getListingPhotos } from '../api/listings'
import { apiErrorMessage } from '../api/client'
import { ChevronLeft, ChevronRight, Heart, MapPinned, SlidersHorizontal, Users, X } from 'lucide-react'
import BrowseMapModal from '../components/browse/BrowseMapModal'
import ListingRow from '../components/browse/ListingRow'
import PhotoLightbox from '../components/PhotoLightbox'
import { useAuth } from '../context/AuthContext'
import type { ReactNode } from 'react'
import type { BrowseItem, UserProfile } from '../types'
import { Alert, Button, Card, EmptyState, SegmentedControl, Select, Sheet, Skeleton, cx, focusRing, pageTitleClass } from '../components/ui'
import FilterPanel from '../components/browse/FilterPanel'
import { effectiveRange, priceStats, rangeLabel } from '../components/browse/price'
import { activeFilterCount, amenityLabels, applyFilters, availableFacets, hiddenByProfile, profileRules, sortItems, sortLabels, type FilterState, type SortKey } from '../components/browse/filters'
import { useBrowseFilters } from '../components/browse/useBrowseFilters'


/** Quantos anúncios mostrar por página: carregar tudo de uma vez pesa a tela com muitas fotos e mapas. */
const PAGE_SIZE = 12

export default function BrowsePage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  // filtros ficam no endereço (voltar de um anúncio mantém a busca)
  const filters = useBrowseFilters()
  const { tab, bairro, mapPoint } = filters
  const [sheetOpen, setSheetOpen] = useState(false)
  const [showMap, setShowMap] = useState(false)
  const [items, setItems] = useState<BrowseItem[]>([])
  // bairros e faculdades já vistos nos anúncios (sugestões do campo "Onde", sem API); acumula,
  // para a lista não encolher depois que um bairro é escolhido
  const [places, setPlaces] = useState<Record<string, Record<string, 'Bairro' | 'Faculdade'>>>({})  // por aba
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
  }, [tab, bairro, mapPoint?.lat, mapPoint?.lng])

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
    }
    const request = tab === 'ROOMMATES' ? browseRoommates(filters) : browseEstablishments(filters)
    request
      .then((list) => {
        setItems(list)
        setPlaces((prev) => {
          const next = { ...prev[tab] }
          for (const { listing } of list) {
            if (listing.preferredNeighborhood?.trim()) next[listing.preferredNeighborhood.trim()] ??= 'Bairro'
            if (listing.nearCollege?.trim()) next[listing.nearCollege.trim()] ??= 'Faculdade'
          }
          return { ...prev, [tab]: next }
        })
      })
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os anúncios')))
      .finally(() => setLoading(false))
  }

  // Filtros de escolha + regras do cadastro, aplicados aqui mesmo sobre a lista do servidor:
  // tudo responde na hora (a barra de valor muda a lista enquanto a alça anda).
  const stats = useMemo(() => priceStats(items.flatMap((i) => (i.listing.price != null ? [Number(i.listing.price)] : []))), [items])
  const price = effectiveRange(filters.price, stats)
  const state: FilterState = {
    price, priceIsOpenEnded: !!price && !!stats && price[1] >= stats.max,
    compatMin: filters.compatMin, slotsMin: filters.slotsMin, onlyMyGender: filters.onlyMyGender,
    bedroomsMin: filters.bedroomsMin, bathroomsMin: filters.bathroomsMin, garage: filters.garage,
    pets: filters.pets, smoker: filters.smoker, amenities: filters.amenities, matchProfile: filters.matchProfile,
  }
  const rules = useMemo(() => profileRules(user), [user])
  const myGender = user?.gender ?? null
  const stateKey = JSON.stringify(state)
  const visible = useMemo(
    () => sortItems(applyFilters(items, state, rules, myGender), filters.sort),
    [items, stateKey, rules, myGender, filters.sort], // eslint-disable-line react-hooks/exhaustive-deps
  )
  const facets = useMemo(() => availableFacets(items), [items])
  const count = (change: Partial<FilterState>) => applyFilters(items, { ...state, ...change }, rules, myGender).length
  const hidden = hiddenByProfile(items, state, rules, myGender)
  const activeCount = activeFilterCount(state, !!bairro || !!mapPoint)
  // mudou qualquer filtro ou a ordem: volta para a 1ª página
  const filterKey = stateKey + filters.sort
  const [lastFilterKey, setLastFilterKey] = useState(filterKey)
  if (filterKey !== lastFilterKey) { setLastFilterKey(filterKey); setPage(1) }

  const totalPages = Math.max(1, Math.ceil(visible.length / PAGE_SIZE))
  const pageItems = useMemo(
    () => visible.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [visible, page],
  )

  // chips do que está valendo (cada um com o seu "x")
  const chips: Array<{ key: string; label: string; remove: () => void; icon?: typeof MapPinned }> = []
  if (mapPoint) chips.push({ key: 'mapa', label: bairro || 'Perto do ponto no mapa', icon: MapPinned, remove: () => filters.setMapPoint(null) })
  else if (bairro) chips.push({ key: 'bairro', label: bairro, remove: () => filters.setBairro('') })
  if (price && stats) chips.push({ key: 'valor', label: rangeLabel(price, stats), remove: () => filters.setPrice(null) })
  if (state.compatMin) chips.push({ key: 'compat', label: `${state.compatMin}%+ compatível`, remove: () => filters.setCompatMin(0) })
  if (state.slotsMin) chips.push({ key: 'vagas', label: `${state.slotsMin}+ vagas livres`, remove: () => filters.setSlotsMin(0) })
  if (state.onlyMyGender) chips.push({ key: 'exclusiva', label: myGender === 'FEMININO' ? 'Só mulheres' : 'Só homens', remove: () => filters.setOnlyMyGender(false) })
  if (state.bedroomsMin) chips.push({ key: 'dorm', label: `${state.bedroomsMin}+ dormitórios`, remove: () => filters.setBedroomsMin(0) })
  if (state.bathroomsMin) chips.push({ key: 'banh', label: `${state.bathroomsMin}+ banheiros`, remove: () => filters.setBathroomsMin(0) })
  if (state.garage) chips.push({ key: 'garagem', label: 'Garagem', remove: () => filters.setGarage(false) })
  if (state.pets) chips.push({ key: 'pet', label: 'Aceita pet', remove: () => filters.setPets(false) })
  if (state.smoker) chips.push({ key: 'fumante', label: 'Aceita fumante', remove: () => filters.setSmoker(false) })
  for (const a of state.amenities) chips.push({ key: a, label: amenityLabels[a], remove: () => filters.toggleAmenity(a) })

  const placeOptions = useMemo(
    () => Object.entries(places[tab] ?? {}).sort(([a], [b]) => a.localeCompare(b, 'pt-BR', { numeric: true })).map(([label, hint]) => ({ label, hint })),
    [places, tab],
  )
  const panel = (
    <FilterPanel
      f={filters}
      state={state}
      stats={stats}
      priceMatching={applyFilters(items, state, rules, myGender).length}
      facets={facets}
      count={count}
      rules={rules}
      hidden={hidden}
      myGender={myGender}
      onOpenMap={() => setShowMap(true)}
      placeOptions={placeOptions}
      onClear={filters.clearAll}
      activeCount={activeCount}
    />
  )
  const results = visible.length === 1 ? '1 anúncio' : `${visible.length} anúncios`

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
    <div className="mx-auto w-full max-w-400 px-4 py-6 lg:px-8">
      <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <h1 className={cx('mb-1', pageTitleClass)}>Buscar</h1>
          <p className="text-small text-ink-3" aria-live="polite">
            {loading ? 'Procurando…' : `${results} em Maringá${filters.sort === 'compat' ? ', os mais compatíveis primeiro' : ''}`}
            {!loading && visible.length !== items.length && <span className="text-ink-3"> · {items.length} no total</span>}
          </p>
        </div>
        <SegmentedControl
          label="O que você procura"
          className="w-full sm:w-96"
          value={tab}
          onChange={filters.setTab}
          tone={tab === 'ESTABLISHMENTS' ? 'coral' : 'brand'}
          options={[
            { value: 'ROOMMATES', label: 'Busco uma vaga' },
            { value: 'ESTABLISHMENTS', label: 'Busco um imóvel' },
          ]}
        />
      </div>
      {tab === 'ROOMMATES' && !user?.gender && (
        <Alert tone="info" className="mb-4">
          Informe seu sexo no perfil para ver também as vagas exclusivas para homens ou mulheres.
        </Alert>
      )}

      <div className="lg:grid lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 xl:grid-cols-[320px_minmax(0,1fr)]">
        {/* computador: filtros numa coluna fixa à esquerda */}
        <aside className="hidden lg:block" aria-label="Filtros">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain rounded-xl border border-line bg-surface p-5 shadow-sm">
            {panel}
          </div>
        </aside>

        <div className="min-w-0">
          {/* barra de ferramentas: filtros (celular), o que está valendo (chips), ordenar e lista/grade.
              No celular os chips descem para a linha de baixo. */}
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="secondary" icon={SlidersHorizontal} onClick={() => setSheetOpen(true)} className="lg:hidden">
              Filtros{activeCount > 0 && <span className="ml-0.5 grid size-5 place-items-center rounded-full bg-brand text-micro font-bold text-on-brand">{activeCount}</span>}
            </Button>
            {/* no celular o "Ver no mapa" do painel fica na gaveta: atalho aqui também */}
            <Button variant="secondary" icon={MapPinned} onClick={() => setShowMap(true)} className="lg:hidden">Mapa</Button>
            <div className="order-last flex basis-full flex-wrap items-center gap-2 empty:hidden lg:order-none lg:flex-1 lg:basis-auto">
              {chips.map((c) => <FilterChip key={c.key} icon={c.icon} onRemove={c.remove}>{c.label}</FilterChip>)}
              {chips.length >= 2 && (
                <button type="button" onClick={filters.clearAll} className={cx('min-h-8 rounded-sm px-1 text-caption font-semibold text-ink-3 hover:text-danger', focusRing)}>
                  Limpar filtros
                </button>
              )}
            </div>
            <Select
              label="Ordenar por"
              hideLabel
              value={filters.sort}
              onChange={(e) => filters.setSort(e.target.value as SortKey)}
              className="text-small"
              wrapperClassName="min-w-0 flex-1 sm:ml-auto sm:flex-none sm:w-52"
            >
              {(Object.keys(sortLabels) as SortKey[]).map((k) => <option key={k} value={k}>{sortLabels[k]}</option>)}
            </Select>
          </div>
          <div className="mb-5" />

      {lightbox && <PhotoLightbox photos={lightbox} onClose={() => setLightbox(null)} />}

      {showMap && <BrowseMapModal onClose={() => setShowMap(false)} />}

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {loading ? (
        <div className="flex flex-col gap-4" aria-busy="true">
          <span className="sr-only">Carregando…</span>
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} padding="none" tone={tab === 'ESTABLISHMENTS' ? 'coral' : undefined} className="flex flex-col overflow-hidden sm:min-h-66 sm:flex-row">
              <Skeleton className="aspect-16/10 shrink-0 rounded-none sm:aspect-auto sm:w-64 md:w-80 lg:w-64 xl:w-100" />
              <div className="flex flex-1 flex-col gap-3 p-4 sm:p-6">
                <div className="flex justify-between gap-4"><div className="flex-1 space-y-2"><Skeleton className="h-5 w-3/5" /><Skeleton className="h-4 w-2/5" /></div><Skeleton className="h-12 w-20" /></div>
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-1/2" />
                <div className="mt-auto flex items-end justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-11 w-36" /></div>
              </div>
            </Card>
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="Ainda não há anúncios ativos nessa categoria. Volte mais tarde!" />
      ) : visible.length === 0 ? (
        <EmptyState
          title="Nenhum anúncio com esses filtros."
          action={<Button variant="secondary" size="sm" onClick={filters.clearAll}>Limpar filtros</Button>}
        >
          {hidden > 0 ? `${hidden} ${hidden === 1 ? 'foi escondido' : 'foram escondidos'} por não combinar com o seu perfil.` : 'Tente tirar algum filtro ou aumentar a faixa de valor.'}
        </EmptyState>
      ) : (
        <div ref={resultsRef}>
        <div className="flex flex-col gap-4">
          {pageItems.map((item) => {
            const id = item.listing.id
            const status = interestStatus[id]
            const others = (status?.total ?? 0) - (status?.interested ? 1 : 0)
            return (
              <ListingRow
                key={id}
                item={item}
                kind={tab === 'ROOMMATES' ? 'vaga' : 'imovel'}
                photos={listingPhotos[id]}
                onOpenPhotos={() => setLightbox(listingPhotos[id])}
                actions={tab === 'ESTABLISHMENTS' ? (
                  <>
                    <Button
                      onClick={() => handleToggleInterest(id)}
                      disabled={togglingInterestId === id}
                      variant="secondary"
                      className={cx('gap-1.5 px-3', status?.interested && 'border-brand bg-brand-tint text-brand-strong hover:border-brand')}
                    >
                      <Heart className="size-4" aria-hidden="true" fill={status?.interested ? 'currentColor' : 'none'} />
                      {status?.interested ? 'Interessado' : 'Tenho interesse'}
                    </Button>
                    <Button onClick={() => handleConversar(id)} disabled={startingId === id}>
                      {startingId === id ? 'Abrindo…' : 'Conversar com o dono'}
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => handleConversar(id)} disabled={startingId === id}>
                    {startingId === id ? 'Abrindo…' : 'Conversar'}
                  </Button>
                )}
                below={tab === 'ESTABLISHMENTS' && (
                  <>
                    {status?.interested && status.total === 1 && (
                      <p className="flex items-center gap-1 text-caption font-semibold text-ink-3">
                        <Users className="size-3.5" aria-hidden="true" />
                        Você é o único interessado até o momento
                      </p>
                    )}
                    {others > 0 && (
                      <div>
                        <button
                          onClick={() => handleToggleExpanded(id)}
                          className={cx('flex items-center gap-1 rounded-sm text-caption font-semibold text-ink-3 hover:text-brand', focusRing)}
                        >
                          <Users className="size-3.5" aria-hidden="true" />
                          {others} pessoa(s){' '}
                          {status?.interested ? 'também se interessaram' : 'se interessaram'}
                        </button>
                        {expandedListingId === id && (
                          <Card tone="sunk" padding="sm" className="mt-2 flex flex-col gap-2">
                            {loadingPeopleId === id ? (
                              <p className="text-caption text-ink-3">Carregando…</p>
                            ) : (interestedPeople[id] ?? []).length === 0 ? (
                              <p className="text-caption text-ink-3">Ninguém mais se interessou ainda.</p>
                            ) : (
                              interestedPeople[id]?.map((person) => (
                                <div key={person.id} className="flex items-center justify-between gap-2">
                                  <button
                                    onClick={() => navigate(`/usuarios/${person.id}`)}
                                    className={cx('rounded-sm text-small font-semibold text-ink hover:text-brand hover:underline', focusRing)}
                                  >
                                    {person.name}
                                  </button>
                                  <Button
                                    onClick={() => handleConversarComInteressado(id, person.id)}
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
                )}
              />
            )
          })}
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
      </div>

      {/* celular: os mesmos filtros numa gaveta */}
      <Sheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filtros"
        footer={<Button full onClick={() => setSheetOpen(false)}>Ver {results}</Button>}
      >
        {panel}
      </Sheet>
    </div>
  )
}

/** Filtro ativo: rótulo + botão de remover (44 px de toque em tela de toque). */
function FilterChip({ children, onRemove, icon: Icon }: { children: ReactNode; onRemove: () => void; icon?: typeof MapPinned }) {
  return (
    <span className="inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-brand bg-brand-tint pl-3 text-caption font-semibold text-brand-strong motion-safe:animate-[chip-in_var(--dur-base)_var(--ease-spring)]">
      {Icon && <Icon className="size-3.5 shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remover filtro: ${typeof children === 'string' ? children : 'filtro'}`}
        className={cx('grid size-8 shrink-0 place-items-center rounded-full hover:bg-brand hover:text-on-brand pointer-coarse:-my-1.5 pointer-coarse:size-11', focusRing)}
      >
        <X className="size-3.5" aria-hidden="true" />
      </button>
    </span>
  )
}
