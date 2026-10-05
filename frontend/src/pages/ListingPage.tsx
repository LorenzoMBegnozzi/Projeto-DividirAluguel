import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Baby,
  Banknote,
  Car,
  ChevronDown,
  ChevronUp,
  Heart,
  Cigarette,
  CigaretteOff,
  Clock,
  Dumbbell,
  GraduationCap,
  Home,
  MapPin,
  Motorbike,
  PartyPopper,
  PawPrint,
  ShieldCheck,
  Star,
  Users,
  WavesLadder,
} from 'lucide-react'
import {
  createListing,
  deleteListing,
  getMyListings,
  markListingAvailable,
  markListingUnavailable,
  uploadListingPhoto,
} from '../api/listings'
import { createPayment, getPlan, goToCheckout } from '../api/billing'
import { getInterestStatus } from '../api/interest'
import { apiErrorMessage } from '../api/client'
import { formatDate, formatMoney, formatResidents } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import LocationAutocomplete from '../components/LocationAutocomplete'
import ListingPhotoManager from '../components/ListingPhotoManager'
import PhotoPicker from '../components/PhotoPicker'
import ListingMapPreview from '../components/ListingMapPreview'
import Fact from '../components/Fact'
import BoolToggle from '../components/BoolToggle'
import QuantityPicker from '../components/QuantityPicker'
import PropertyFacts from '../components/PropertyFacts'
import InterestSection from '../components/InterestSection'
import MarkUnavailableModal from '../components/MarkUnavailableModal'
import {
  Alert,
  Badge,
  Button,
  Card,
  Chip,
  Input,
  Textarea,
  cx,
  fieldClass,
  focusRing,
  hintClass,
  labelClass,
  pageTitleClass,
} from '../components/ui'
import { genderPreferenceLabels, genderPreferenceOptions, parkingLayoutOptions } from '../constants/profileOptions'
import type { GenderPreference, Listing, ListingType, ParkingLayout, Plan } from '../types'

export default function ListingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const defaultType: ListingType = user?.advertiserKind === 'ESTABELECIMENTO' ? 'ESTABELECIMENTO' : 'TEM_VAGA'
  const [listings, setListings] = useState<Listing[]>([])
  const [interestCounts, setInterestCounts] = useState<Record<number, number>>({})
  const [plan, setPlan] = useState<Plan | null>(null)
  const [buying, setBuying] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [unavailableModalListing, setUnavailableModalListing] = useState<Listing | null>(null)

  const [type, setType] = useState<ListingType>(defaultType)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preferredNeighborhood, setPreferredNeighborhood] = useState('')
  const [price, setPrice] = useState('')
  const [availableSlots, setAvailableSlots] = useState('')
  const [currentResidentsMale, setCurrentResidentsMale] = useState('')
  const [currentResidentsFemale, setCurrentResidentsFemale] = useState('')
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('QUALQUER')
  const [acceptsPets, setAcceptsPets] = useState<boolean | null>(null)
  const [acceptsSmoker, setAcceptsSmoker] = useState<boolean | null>(null)
  const [bedrooms, setBedrooms] = useState('')
  const [suites, setSuites] = useState('')
  const [bathrooms, setBathrooms] = useState('')
  const [parkingSpots, setParkingSpots] = useState('')
  const [parkingForCar, setParkingForCar] = useState(false)
  const [parkingForMotorcycle, setParkingForMotorcycle] = useState(false)
  const [parkingLayout, setParkingLayout] = useState<ParkingLayout | null>(null)
  const [parkingCovered, setParkingCovered] = useState<boolean | null>(null)
  const [hasPool, setHasPool] = useState<boolean | null>(null)
  const [hasPartyRoom, setHasPartyRoom] = useState<boolean | null>(null)
  const [hasGym, setHasGym] = useState<boolean | null>(null)
  const [hasPlayground, setHasPlayground] = useState<boolean | null>(null)
  const [hasConcierge24h, setHasConcierge24h] = useState<boolean | null>(null)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadListings()
  }, [])

  function loadListings() {
    setLoadingList(true)
    Promise.all([getMyListings(), getPlan()])
      .then(([res, planInfo]) => {
        setListings(res)
        setPlan(planInfo)
        const establishments = res.filter((l) => l.type === 'ESTABELECIMENTO')
        Promise.all(
          establishments.map((l) =>
            getInterestStatus(l.id)
              .then((st) => [l.id, st.total] as const)
              .catch(() => [l.id, 0] as const),
          ),
        ).then((entries) => setInterestCounts(Object.fromEntries(entries)))
      })
      .catch((err) => setListError(apiErrorMessage(err, 'Não foi possível carregar seus anúncios')))
      .finally(() => setLoadingList(false))
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setPreferredNeighborhood('')
    setPrice('')
    setAvailableSlots('')
    setCurrentResidentsMale('')
    setCurrentResidentsFemale('')
    setGenderPreference('QUALQUER')
    setAcceptsPets(null)
    setAcceptsSmoker(null)
    setBedrooms('')
    setSuites('')
    setBathrooms('')
    setParkingSpots('')
    setParkingForCar(false)
    setParkingForMotorcycle(false)
    setParkingLayout(null)
    setParkingCovered(null)
    setHasPool(null)
    setHasPartyRoom(null)
    setHasGym(null)
    setHasPlayground(null)
    setHasConcierge24h(null)
    setPhotoFiles([])
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)

    if (!preferredNeighborhood.trim()) {
      setError('Informe o bairro do imóvel')
      return
    }

    if (bedrooms && suites && Number(suites) > Number(bedrooms)) {
      setError('O número de suítes não pode ser maior que o de dormitórios')
      return
    }

    const spots = parkingSpots ? Number(parkingSpots) : null
    if (spots != null && spots > 0 && !parkingForCar && !parkingForMotorcycle) {
      setError('Escolha se a vaga de garagem é para carro, moto ou os dois')
      return
    }

    setLoading(true)
    try {
      const created = await createListing({
        type,
        title,
        description,
        preferredNeighborhood,
        nearCollege: '',
        price: price ? Number(price) : null,
        availableSlots: type === 'TEM_VAGA' && availableSlots ? Number(availableSlots) : null,
        currentResidentsMale: type === 'TEM_VAGA' && currentResidentsMale ? Number(currentResidentsMale) : null,
        currentResidentsFemale: type === 'TEM_VAGA' && currentResidentsFemale ? Number(currentResidentsFemale) : null,
        genderPreference: type === 'TEM_VAGA' ? genderPreference : 'QUALQUER',
        // Por segurança, não coletamos endereço completo nem ponto no mapa — só o bairro.
        address: null,
        latitude: null,
        longitude: null,
        acceptsPets: type === 'ESTABELECIMENTO' ? acceptsPets : null,
        acceptsSmoker: type === 'ESTABELECIMENTO' ? acceptsSmoker : null,
        bedrooms: bedrooms ? Number(bedrooms) : null,
        suites: suites ? Number(suites) : null,
        bathrooms: bathrooms ? Number(bathrooms) : null,
        parkingSpots: spots,
        parkingForCar: spots ? parkingForCar : null,
        parkingForMotorcycle: spots ? parkingForMotorcycle : null,
        parkingLayout: spots ? parkingLayout : null,
        parkingCovered: spots ? parkingCovered : null,
        hasPool,
        hasPartyRoom,
        hasGym,
        hasPlayground,
        hasConcierge24h,
      })
      if (photoFiles.length > 0) {
        await Promise.all(photoFiles.map((file) => uploadListingPhoto(created.id, file)))
      }
      resetForm()
      setSaved(true)
      loadListings()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível publicar o anúncio'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteListing(id)
      loadListings()
    } catch (err) {
      setListError(apiErrorMessage(err, 'Não foi possível remover o anúncio'))
    }
  }

  async function handleConfirmUnavailable(closedWithUserId: number | null) {
    if (!unavailableModalListing) return
    await markListingUnavailable(unavailableModalListing.id, closedWithUserId)
    setUnavailableModalListing(null)
    loadListings()
  }

  async function handleMarkAvailable(id: number) {
    try {
      await markListingAvailable(id)
      loadListings()
    } catch (err) {
      setListError(apiErrorMessage(err, 'Não foi possível marcar como disponível'))
    }
  }

  async function handleBuyExtra() {
    setBuying(true)
    setListError(null)
    try {
      goToCheckout(await createPayment('ANUNCIO_EXTRA'), navigate)
    } catch (err) {
      setListError(apiErrorMessage(err, 'Não foi possível iniciar a compra'))
    } finally {
      setBuying(false)
    }
  }

  async function handleHighlight(listingId: number) {
    setListError(null)
    try {
      goToCheckout(await createPayment('DESTAQUE', listingId), navigate)
    } catch (err) {
      setListError(apiErrorMessage(err, 'Não foi possível iniciar o destaque'))
    }
  }

  const freeSlotsFull = plan != null && plan.freeListingsUsed >= plan.freeListings
  const needsExtraCredit = freeSlotsFull && plan.extraCredits > 0
  const mustBuyExtra = freeSlotsFull && plan.extraCredits === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className={cx(pageTitleClass, 'mb-1')}>Meus anúncios</h1>
      <p className="mb-6 text-small text-ink-3">
        {plan
          ? `${plan.freeListingsUsed} de ${plan.freeListings} anúncios grátis em uso. A partir do ${plan.freeListings + 1}º, cada anúncio extra custa ${formatMoney(plan.extraListingPrice)} por ${plan.extraListingDays} dias.`
          : 'Carregando...'}
      </p>

      {listError && <Alert tone="danger" className="mb-4">{listError}</Alert>}

      {!loadingList && listings.length > 0 && (
        <div className="mb-8 flex flex-col gap-3">
          {listings.map((listing) => {
            const expanded = expandedId === listing.id
            return (
              <Card key={listing.id} padding="sm">
                <div className="flex items-start justify-between gap-3">
                  <button
                    onClick={() => setExpandedId(expanded ? null : listing.id)}
                    className={cx('flex-1 rounded-md text-left', focusRing)}
                  >
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <Badge>{listing.type === 'TEM_VAGA' ? 'Tenho vaga' : 'Estabelecimento'}</Badge>
                      {!listing.available && (
                        <Badge tone="inverse">
                          Indisponível{listing.dealClosedWithUserName ? ` · alugado para ${listing.dealClosedWithUserName}` : ''}
                        </Badge>
                      )}
                      {(interestCounts[listing.id] ?? 0) > 0 && (
                        <Badge tone="brand">
                          <Heart className="size-3.5 shrink-0" aria-hidden="true" fill="currentColor" />
                          {interestCounts[listing.id]} {interestCounts[listing.id] === 1 ? 'interessado' : 'interessados'}
                        </Badge>
                      )}
                      {listing.expiresAt && (
                        <Badge tone="brand" icon={Clock}>
                          Extra até {formatDate(listing.expiresAt)}
                        </Badge>
                      )}
                      {listing.highlighted && listing.highlightedUntil && (
                        <Badge tone="warning" icon={Star}>
                          Destaque até {formatDate(listing.highlightedUntil)}
                        </Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-1 text-body font-semibold text-ink">
                      {listing.title}
                      {expanded ? (
                        <ChevronUp className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
                      )}
                    </p>
                    {listing.preferredNeighborhood && <p className="text-caption text-ink-3">{listing.preferredNeighborhood}</p>}
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                      {listing.available ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUnavailableModalListing(listing)}
                          className="hover:text-brand!"
                        >
                          Marcar indisponível
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleMarkAvailable(listing.id)}
                          className="hover:text-leaf!"
                        >
                          Marcar disponível
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(listing.id)} className="hover:text-danger!">
                        Remover
                      </Button>
                    </div>
                    {plan && (
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Star}
                        onClick={() => handleHighlight(listing.id)}
                        className="text-mel! hover:bg-mel-tint"
                      >
                        Destacar · {formatMoney(plan.highlightPrice)} / {plan.highlightDays} dias
                      </Button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 border-t border-line pt-3">
                    {listing.description && <p className="mb-2 text-body text-ink-2">{listing.description}</p>}
                    <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-3">
                      {listing.preferredNeighborhood && <Fact icon={MapPin}>{listing.preferredNeighborhood}</Fact>}
                      {listing.nearCollege && <Fact icon={GraduationCap}>Perto de {listing.nearCollege}</Fact>}
                      {listing.price != null && (
                        <Fact icon={Banknote}>
                          <span className="tabular-nums">R$ {listing.price}</span>
                        </Fact>
                      )}
                      {listing.availableSlots != null && (
                        <Fact icon={Users}>
                          {listing.availableSlots} {listing.availableSlots === 1 ? 'vaga disponível' : 'vagas disponíveis'}
                        </Fact>
                      )}
                      {formatResidents(listing.currentResidentsMale, listing.currentResidentsFemale) && (
                        <Fact icon={Home}>{formatResidents(listing.currentResidentsMale, listing.currentResidentsFemale)}</Fact>
                      )}
                      {listing.type === 'TEM_VAGA' && listing.genderPreference !== 'QUALQUER' && (
                        <Fact icon={Users}>{genderPreferenceLabels[listing.genderPreference]}</Fact>
                      )}
                      {listing.acceptsPets != null && (
                        <Fact icon={PawPrint}>{listing.acceptsPets ? 'Aceita animais' : 'Não aceita animais'}</Fact>
                      )}
                      {listing.acceptsSmoker != null && (
                        <Fact icon={listing.acceptsSmoker ? Cigarette : CigaretteOff}>
                          {listing.acceptsSmoker ? 'Aceita fumantes' : 'Não aceita fumantes'}
                        </Fact>
                      )}
                      <PropertyFacts listing={listing} />
                    </div>
                    {listing.latitude != null && listing.longitude != null && (
                      <ListingMapPreview latitude={listing.latitude} longitude={listing.longitude} />
                    )}
                    {listing.type === 'ESTABELECIMENTO' && (
                      <div className="mt-3">
                        <InterestSection listingId={listing.id} isOwner />
                      </div>
                    )}
                    <ListingPhotoManager listingId={listing.id} />
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {mustBuyExtra && plan ? (
        <Card>
          <h2 className="mb-1 text-h3 text-ink">Você usou seus {plan.freeListings} anúncios grátis</h2>
          <p className="mb-4 text-small text-ink-3">
            Para publicar mais um, compre um anúncio extra: {formatMoney(plan.extraListingPrice)} por {plan.extraListingDays} dias.
            Também dá para remover um anúncio grátis e liberar a vaga.
          </p>
          <Button full onClick={handleBuyExtra} disabled={buying}>
            {buying ? 'Abrindo…' : `Comprar anúncio extra · ${formatMoney(plan.extraListingPrice)}`}
          </Button>
        </Card>
      ) : (
        <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-5">
          <h2 className="text-h3 text-ink">Publicar novo anúncio</h2>

          {needsExtraCredit && plan && (
            <Alert tone="info">
              Este anúncio usa 1 dos seus {plan.extraCredits} crédito(s) de anúncio extra e fica ativo por {plan.extraListingDays} dias.
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              variant={type === 'TEM_VAGA' ? 'inverse' : 'secondary'}
              onClick={() => setType('TEM_VAGA')}
              className="h-auto! min-h-11 flex-1 whitespace-normal! px-3! py-3"
            >
              Tenho vaga para dividir
            </Button>
            <Button
              variant={type === 'ESTABELECIMENTO' ? 'inverse' : 'secondary'}
              onClick={() => setType('ESTABELECIMENTO')}
              className="h-auto! min-h-11 flex-1 whitespace-normal! px-3! py-3"
            >
              Tenho um imóvel pra alugar
            </Button>
          </div>

          <Input
            label="Título"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'TEM_VAGA' ? 'Ex.: Vaga em apê 2 quartos, Zona 7' : 'Ex.: Kitnet mobiliada perto da UEM'}
          />

          <Textarea label="Descrição" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} />

          <div>
            <p className="mb-2 text-caption text-ink-3">Anúncios com foto recebem muito mais interesse.</p>
            <PhotoPicker files={photoFiles} onChange={setPhotoFiles} />
          </div>

          <div>
            <label className={labelClass}>Bairro do imóvel</label>
            <LocationAutocomplete
              value={preferredNeighborhood}
              onChange={setPreferredNeighborhood}
              placeholder="Ex.: Zona 7"
              className={fieldClass()}
            />
            <p className={cx(hintClass, 'flex items-start gap-1.5')}>
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Por segurança, usamos só o bairro no anúncio — o endereço completo não é coletado nem mostrado
              publicamente.
            </p>
          </div>

          <div className={type === 'TEM_VAGA' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : undefined}>
            <Input
              label={type === 'TEM_VAGA' ? 'Valor médio por pessoa (R$)' : 'Valor do aluguel (R$)'}
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
            {type === 'TEM_VAGA' && (
              <Input
                label="Vagas disponíveis"
                type="number"
                min="1"
                value={availableSlots}
                onChange={(e) => setAvailableSlots(e.target.value)}
                placeholder="Ex.: 1"
              />
            )}
          </div>

          {type === 'TEM_VAGA' && (
            <div>
              <p className={labelClass}>Quantas pessoas já moram no lugar</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <QuantityPicker label="Homens" value={currentResidentsMale} onChange={setCurrentResidentsMale} max={10} />
                <QuantityPicker label="Mulheres" value={currentResidentsFemale} onChange={setCurrentResidentsFemale} max={10} />
              </div>
            </div>
          )}

          {type === 'TEM_VAGA' && (
            <div>
              <p className={labelClass}>Quem pode ocupar a vaga?</p>
              <div className="flex gap-2">
                {genderPreferenceOptions.map((option) => (
                  <Button
                    key={option.value}
                    variant={genderPreference === option.value ? 'inverse' : 'secondary'}
                    onClick={() => setGenderPreference(option.value)}
                    className="h-auto! min-h-11 flex-1 whitespace-normal! px-3! py-2.5"
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {type === 'ESTABELECIMENTO' && (
            <Card tone="sunk" padding="sm" className="flex flex-col gap-3">
              <BoolToggle label="Aceita animais de estimação?" icon={PawPrint} value={acceptsPets} onChange={setAcceptsPets} />
              <BoolToggle label="Aceita fumantes?" icon={Cigarette} value={acceptsSmoker} onChange={setAcceptsSmoker} />
            </Card>
          )}

          <Card as="fieldset" tone="sunk" padding="sm" className="flex flex-col gap-4">
            <legend className="px-1 text-caption font-bold text-ink">Sobre o apartamento</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <QuantityPicker label="Dormitórios" value={bedrooms} onChange={setBedrooms} />
              <QuantityPicker label="Suítes" value={suites} onChange={setSuites} />
              <QuantityPicker label="Banheiros sociais" value={bathrooms} onChange={setBathrooms} />
              <QuantityPicker label="Vagas de garagem" value={parkingSpots} onChange={setParkingSpots} />
            </div>
            {Number(parkingSpots) > 0 && (
              <div>
                <p className={labelClass}>A garagem é para</p>
                <div className="flex gap-2">
                  {[
                    { label: 'Carro', icon: Car, value: parkingForCar, set: setParkingForCar },
                    { label: 'Moto', icon: Motorbike, value: parkingForMotorcycle, set: setParkingForMotorcycle },
                  ].map(({ label, icon, value, set }) => (
                    <Chip key={label} pressed={value} icon={icon} onClick={() => set(!value)}>
                      {label}
                    </Chip>
                  ))}
                </div>
              </div>
            )}
            {Number(parkingSpots) > 0 && (
              <div>
                <p className={labelClass}>Tipo de vaga</p>
                <div className="flex gap-2">
                  {parkingLayoutOptions.map((option) => (
                    <Chip
                      key={option.value}
                      pressed={parkingLayout === option.value}
                      onClick={() => setParkingLayout(parkingLayout === option.value ? null : option.value)}
                      className="flex-1 justify-center sm:flex-none sm:px-6"
                    >
                      {option.label}
                    </Chip>
                  ))}
                </div>
                <p className={hintClass}>Gaveta: um carro atrás do outro. Lateral: lado a lado, sem bloquear.</p>
              </div>
            )}
            {Number(parkingSpots) > 0 && (
              <BoolToggle label="A vaga é coberta?" icon={Car} value={parkingCovered} onChange={setParkingCovered} />
            )}
          </Card>

          <Card as="fieldset" tone="sunk" padding="sm" className="flex flex-col gap-3">
            <legend className="px-1 text-caption font-bold text-ink">Sobre o condomínio</legend>
            <BoolToggle label="Piscina" icon={WavesLadder} value={hasPool} onChange={setHasPool} />
            <BoolToggle label="Salão de festas" icon={PartyPopper} value={hasPartyRoom} onChange={setHasPartyRoom} />
            <BoolToggle label="Academia" icon={Dumbbell} value={hasGym} onChange={setHasGym} />
            <BoolToggle label="Playground e brinquedoteca" icon={Baby} value={hasPlayground} onChange={setHasPlayground} />
            <BoolToggle label="Portaria 24 horas" icon={ShieldCheck} value={hasConcierge24h} onChange={setHasConcierge24h} />
          </Card>

          {error && <Alert tone="danger">{error}</Alert>}
          {saved && <Alert tone="success">Anúncio publicado!</Alert>}

          <Button type="submit" disabled={loading} className="ml-auto">
            {loading ? 'Salvando…' : 'Publicar anúncio'}
          </Button>
        </Card>
      )}

      {unavailableModalListing && (
        <MarkUnavailableModal
          listingId={unavailableModalListing.id}
          listingTitle={unavailableModalListing.title}
          onClose={() => setUnavailableModalListing(null)}
          onConfirm={handleConfirmUnavailable}
        />
      )}
    </div>
  )
}
