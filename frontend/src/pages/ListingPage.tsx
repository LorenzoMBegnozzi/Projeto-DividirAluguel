import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Banknote, ChevronDown, ChevronUp, Clock, GraduationCap, MapPin, PawPrint, Cigarette, CigaretteOff, Star, Users } from 'lucide-react'
import {
  createListing,
  deleteListing,
  getMyListings,
  markListingAvailable,
  markListingUnavailable,
  uploadListingPhoto,
} from '../api/listings'
import { createPayment, getPlan } from '../api/billing'
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
import MarkUnavailableModal from '../components/MarkUnavailableModal'
import type { Listing, ListingType, Plan } from '../types'

const inputClass =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

export default function ListingPage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const defaultType: ListingType = user?.advertiserKind === 'ESTABELECIMENTO' ? 'ESTABELECIMENTO' : 'TEM_VAGA'
  const [listings, setListings] = useState<Listing[]>([])
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
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [acceptsPets, setAcceptsPets] = useState<boolean | null>(null)
  const [acceptsSmoker, setAcceptsSmoker] = useState<boolean | null>(null)
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
    setAddress('')
    setLatitude(null)
    setLongitude(null)
    setAcceptsPets(null)
    setAcceptsSmoker(null)
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
        address,
        latitude,
        longitude,
        acceptsPets: type === 'ESTABELECIMENTO' ? acceptsPets : null,
        acceptsSmoker: type === 'ESTABELECIMENTO' ? acceptsSmoker : null,
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
                      {listing.acceptsPets != null && (
                        <Fact icon={PawPrint}>{listing.acceptsPets ? 'Aceita animais' : 'Não aceita animais'}</Fact>
                      )}
                      {listing.acceptsSmoker != null && (
                        <Fact icon={listing.acceptsSmoker ? Cigarette : CigaretteOff}>
                          {listing.acceptsSmoker ? 'Aceita fumantes' : 'Não aceita fumantes'}
                        </Fact>
                      )}
                    </div>
                    {listing.latitude != null && listing.longitude != null && (
                      <ListingMapPreview latitude={listing.latitude} longitude={listing.longitude} />
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

          {type === 'ESTABELECIMENTO' && (
            <div className="grid grid-cols-1 gap-4 rounded-md border border-line bg-surface-sunk p-4 sm:grid-cols-2">
              <BoolToggle label="Aceita animais de estimação?" value={acceptsPets} onChange={setAcceptsPets} />
              <BoolToggle label="Aceita fumantes?" value={acceptsSmoker} onChange={setAcceptsSmoker} />
            </div>
          )}

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
