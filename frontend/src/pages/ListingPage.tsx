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
import { createPayment, getPlan } from '../api/billing'
import { getInterestStatus } from '../api/interest'
import { apiErrorMessage } from '../api/client'
import { formatDate, formatMoney } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import LocationPicker from '../components/LocationPicker'
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
import { genderPreferenceLabels, genderPreferenceOptions, parkingLayoutOptions } from '../constants/profileOptions'
import type { GenderPreference, Listing, ListingType, ParkingLayout, Plan } from '../types'

const inputClass =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

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
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('QUALQUER')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
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
    setGenderPreference('QUALQUER')
    setAddress('')
    setLatitude(null)
    setLongitude(null)
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

    if (latitude == null || longitude == null || !address.trim()) {
      setError('Marque o local no mapa e informe o endereço')
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
        genderPreference: type === 'TEM_VAGA' ? genderPreference : 'QUALQUER',
        address,
        latitude,
        longitude,
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
      await createPayment('ANUNCIO_EXTRA')
      navigate('/pagamentos')
    } catch (err) {
      setListError(apiErrorMessage(err, 'Não foi possível iniciar a compra'))
    } finally {
      setBuying(false)
    }
  }

  async function handleHighlight(listingId: number) {
    setListError(null)
    try {
      await createPayment('DESTAQUE', listingId)
      navigate('/pagamentos')
    } catch (err) {
      setListError(apiErrorMessage(err, 'Não foi possível iniciar o destaque'))
    }
  }

  const freeSlotsFull = plan != null && plan.freeListingsUsed >= plan.freeListings
  const needsExtraCredit = freeSlotsFull && plan.extraCredits > 0
  const mustBuyExtra = freeSlotsFull && plan.extraCredits === 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-[28px] font-extrabold tracking-tight text-ink">Meus anúncios</h1>
      <p className="mb-6 text-sm text-ink-3">
        {plan
          ? `${plan.freeListingsUsed} de ${plan.freeListings} anúncios grátis em uso. A partir do ${plan.freeListings + 1}º, cada anúncio extra custa ${formatMoney(plan.extraListingPrice)} por ${plan.extraListingDays} dias.`
          : 'Carregando...'}
      </p>

      {listError && <div className="mb-4 rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">{listError}</div>}

      {!loadingList && listings.length > 0 && (
        <div className="mb-8 flex flex-col gap-3">
          {listings.map((listing) => {
            const expanded = expandedId === listing.id
            return (
              <div key={listing.id} className="rounded-lg border border-line bg-surface p-4">
                <div className="flex items-start justify-between gap-3">
                  <button onClick={() => setExpandedId(expanded ? null : listing.id)} className="flex-1 text-left">
                    <div className="mb-1 flex flex-wrap items-center gap-1.5">
                      <span className="inline-flex h-6 items-center rounded-sm bg-surface-sunk px-2 text-xs font-bold text-ink-2">
                        {listing.type === 'TEM_VAGA' ? 'Tenho vaga' : 'Estabelecimento'}
                      </span>
                      {!listing.available && (
                        <span className="inline-flex h-6 items-center rounded-sm bg-inverse px-2 text-xs font-bold text-on-inverse">
                          Indisponível{listing.dealClosedWithUserName ? ` · alugado para ${listing.dealClosedWithUserName}` : ''}
                        </span>
                      )}
                      {(interestCounts[listing.id] ?? 0) > 0 && (
                        <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-brand-tint px-2 text-xs font-bold text-brand-strong">
                          <Heart className="h-3 w-3" aria-hidden="true" fill="currentColor" />
                          {interestCounts[listing.id]} {interestCounts[listing.id] === 1 ? 'interessado' : 'interessados'}
                        </span>
                      )}
                      {listing.expiresAt && (
                        <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-brand-tint px-2 text-xs font-bold text-brand-strong">
                          <Clock className="h-3 w-3" aria-hidden="true" />
                          Extra até {formatDate(listing.expiresAt)}
                        </span>
                      )}
                      {listing.highlighted && listing.highlightedUntil && (
                        <span className="inline-flex h-6 items-center gap-1 rounded-sm bg-mel-tint px-2 text-xs font-bold text-mel">
                          <Star className="h-3 w-3" aria-hidden="true" />
                          Destaque até {formatDate(listing.highlightedUntil)}
                        </span>
                      )}
                    </div>
                    <p className="flex items-center gap-1 font-semibold text-ink">
                      {listing.title}
                      {expanded ? (
                        <ChevronUp className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0 text-ink-3" aria-hidden="true" />
                      )}
                    </p>
                    <p className="text-[13px] text-ink-3">{listing.address}</p>
                  </button>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      {listing.available ? (
                        <button
                          onClick={() => setUnavailableModalListing(listing)}
                          className="text-sm font-semibold text-ink-3 hover:text-brand"
                        >
                          Marcar indisponível
                        </button>
                      ) : (
                        <button
                          onClick={() => handleMarkAvailable(listing.id)}
                          className="text-sm font-semibold text-ink-3 hover:text-leaf"
                        >
                          Marcar disponível
                        </button>
                      )}
                      <button onClick={() => handleDelete(listing.id)} className="text-sm font-semibold text-ink-3 hover:text-danger">
                        Remover
                      </button>
                    </div>
                    {plan && (
                      <button
                        onClick={() => handleHighlight(listing.id)}
                        className="inline-flex h-[32px] items-center gap-1 rounded-md border border-line-strong px-2.5 text-xs font-semibold text-mel transition hover:bg-mel-tint"
                      >
                        <Star className="h-3.5 w-3.5" aria-hidden="true" />
                        Destacar · {formatMoney(plan.highlightPrice)} / {plan.highlightDays} dias
                      </button>
                    )}
                  </div>
                </div>

                {expanded && (
                  <div className="mt-3 border-t border-line pt-3">
                    {listing.description && <p className="mb-2 text-ink-2">{listing.description}</p>}
                    <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-3">
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
              </div>
            )
          })}
        </div>
      )}

      {mustBuyExtra && plan ? (
        <div className="rounded-lg border border-line bg-surface p-6">
          <h2 className="mb-1 text-[16px] font-bold text-ink">Você usou seus {plan.freeListings} anúncios grátis</h2>
          <p className="mb-4 text-sm text-ink-3">
            Para publicar mais um, compre um anúncio extra: {formatMoney(plan.extraListingPrice)} por {plan.extraListingDays} dias.
            Também dá para remover um anúncio grátis e liberar a vaga.
          </p>
          <button
            onClick={handleBuyExtra}
            disabled={buying}
            className="h-[42px] w-full rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {buying ? 'Abrindo…' : `Comprar anúncio extra · ${formatMoney(plan.extraListingPrice)}`}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-lg border border-line bg-surface p-6">
          <h2 className="text-[16px] font-bold text-ink">Publicar novo anúncio</h2>

          {needsExtraCredit && plan && (
            <p className="rounded-md bg-brand-tint px-3 py-2 text-sm text-brand-strong">
              Este anúncio usa 1 dos seus {plan.extraCredits} crédito(s) de anúncio extra e fica ativo por {plan.extraListingDays} dias.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('TEM_VAGA')}
              className={`flex-1 rounded-md border px-3 py-3 text-sm font-semibold transition ${
                type === 'TEM_VAGA' ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong text-ink-2 hover:border-ink'
              }`}
            >
              Tenho vaga para dividir
            </button>
            <button
              type="button"
              onClick={() => setType('ESTABELECIMENTO')}
              className={`flex-1 rounded-md border px-3 py-3 text-sm font-semibold transition ${
                type === 'ESTABELECIMENTO'
                  ? 'border-inverse bg-inverse text-on-inverse'
                  : 'border-line-strong text-ink-2 hover:border-ink'
              }`}
            >
              Tenho um imóvel pra alugar
            </button>
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Título</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'TEM_VAGA' ? 'Ex.: Vaga em apê 2 quartos, Zona 7' : 'Ex.: Kitnet mobiliada perto da UEM'}
              className={inputClass}
            />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className={inputClass} />
          </div>

          <div>
            <label className="mb-1 block text-[13px] font-semibold text-ink">Bairro do imóvel</label>
            <LocationAutocomplete
              value={preferredNeighborhood}
              onChange={setPreferredNeighborhood}
              placeholder="Ex.: Zona 7"
              className={inputClass}
            />
          </div>

          <div className={type === 'TEM_VAGA' ? 'grid grid-cols-1 gap-4 sm:grid-cols-2' : undefined}>
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-ink">
                {type === 'TEM_VAGA' ? 'Valor médio por pessoa (R$)' : 'Valor do aluguel (R$)'}
              </label>
              <input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className={inputClass} />
            </div>
            {type === 'TEM_VAGA' && (
              <div>
                <label className="mb-1 block text-[13px] font-semibold text-ink">Vagas disponíveis</label>
                <input
                  type="number"
                  min="1"
                  value={availableSlots}
                  onChange={(e) => setAvailableSlots(e.target.value)}
                  placeholder="Ex.: 1"
                  className={inputClass}
                />
              </div>
            )}
          </div>

          {type === 'TEM_VAGA' && (
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Quem pode ocupar a vaga?</p>
              <div className="flex gap-2">
                {genderPreferenceOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGenderPreference(option.value)}
                    className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-semibold transition ${
                      genderPreference === option.value
                        ? 'border-inverse bg-inverse text-on-inverse'
                        : 'border-line-strong text-ink-2 hover:border-ink'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {type === 'ESTABELECIMENTO' && (
            <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-sunk p-4">
              <BoolToggle label="Aceita animais de estimação?" icon={PawPrint} value={acceptsPets} onChange={setAcceptsPets} />
              <BoolToggle label="Aceita fumantes?" icon={Cigarette} value={acceptsSmoker} onChange={setAcceptsSmoker} />
            </div>
          )}

          <fieldset className="flex flex-col gap-4 rounded-md border border-line bg-surface-sunk p-4">
            <legend className="px-1 text-[13px] font-bold text-ink">Sobre o apartamento</legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <QuantityPicker label="Dormitórios" value={bedrooms} onChange={setBedrooms} />
              <QuantityPicker label="Suítes" value={suites} onChange={setSuites} />
              <QuantityPicker label="Banheiros sociais" value={bathrooms} onChange={setBathrooms} />
              <QuantityPicker label="Vagas de garagem" value={parkingSpots} onChange={setParkingSpots} />
            </div>
            {Number(parkingSpots) > 0 && (
              <div>
                <p className="mb-2 text-[13px] font-semibold text-ink">A garagem é para</p>
                <div className="flex gap-2">
                  {[
                    { label: 'Carro', icon: Car, value: parkingForCar, set: setParkingForCar },
                    { label: 'Moto', icon: Motorbike, value: parkingForMotorcycle, set: setParkingForMotorcycle },
                  ].map(({ label, icon: Icon, value, set }) => (
                    <button
                      key={label}
                      type="button"
                      aria-pressed={value}
                      onClick={() => set(!value)}
                      className={`inline-flex h-[64px] w-[88px] flex-col items-center justify-center gap-1 rounded-md border text-xs font-semibold transition ${
                        value ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong bg-surface text-ink-2 hover:border-ink'
                      }`}
                    >
                      <Icon className="h-6 w-6" aria-hidden="true" />
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {Number(parkingSpots) > 0 && (
              <div>
                <p className="mb-2 text-[13px] font-semibold text-ink">Tipo de vaga</p>
                <div className="flex gap-2">
                  {parkingLayoutOptions.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      aria-pressed={parkingLayout === option.value}
                      onClick={() => setParkingLayout(parkingLayout === option.value ? null : option.value)}
                      className={`flex-1 rounded-md border px-3 py-2.5 text-sm font-semibold transition sm:flex-none sm:px-6 ${
                        parkingLayout === option.value
                          ? 'border-inverse bg-inverse text-on-inverse'
                          : 'border-line-strong bg-surface text-ink-2 hover:border-ink'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1 text-[13px] text-ink-3">Gaveta: um carro atrás do outro. Lateral: lado a lado, sem bloquear.</p>
              </div>
            )}
            {Number(parkingSpots) > 0 && (
              <BoolToggle label="A vaga é coberta?" icon={Car} value={parkingCovered} onChange={setParkingCovered} />
            )}
          </fieldset>

          <fieldset className="flex flex-col gap-3 rounded-md border border-line bg-surface-sunk p-4">
            <legend className="px-1 text-[13px] font-bold text-ink">Sobre o condomínio</legend>
            <BoolToggle label="Piscina" icon={WavesLadder} value={hasPool} onChange={setHasPool} />
            <BoolToggle label="Salão de festas" icon={PartyPopper} value={hasPartyRoom} onChange={setHasPartyRoom} />
            <BoolToggle label="Academia" icon={Dumbbell} value={hasGym} onChange={setHasGym} />
            <BoolToggle label="Playground e brinquedoteca" icon={Baby} value={hasPlayground} onChange={setHasPlayground} />
            <BoolToggle label="Portaria 24 horas" icon={ShieldCheck} value={hasConcierge24h} onChange={setHasConcierge24h} />
          </fieldset>

          <div className="flex flex-col gap-3 rounded-md border border-line bg-surface-sunk p-4">
            <div>
              <label className="mb-1 block text-[13px] font-semibold text-ink">Endereço</label>
              <LocationAutocomplete
                value={address}
                onChange={setAddress}
                onSelectPlace={(place) => {
                  setLatitude(place.lat)
                  setLongitude(place.lon)
                }}
                placeholder="Rua, número, bairro"
                className={inputClass}
              />
              <p className="mt-1 text-[13px] text-ink-3">
                Escolha uma sugestão para marcar o local no mapa automaticamente, ou ajuste clicando no mapa.
              </p>
            </div>
            <LocationPicker
              latitude={latitude}
              longitude={longitude}
              onChange={(lat, lng) => {
                setLatitude(lat)
                setLongitude(lng)
              }}
            />
          </div>

          <PhotoPicker files={photoFiles} onChange={setPhotoFiles} />

          {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
          {saved && <p className="rounded-md bg-leaf-tint px-3 py-2 text-sm text-leaf">Anúncio publicado!</p>}

          <button
            type="submit"
            disabled={loading}
            className="ml-auto h-[42px] rounded-md bg-brand px-6 font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Publicar anúncio'}
          </button>
        </form>
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
