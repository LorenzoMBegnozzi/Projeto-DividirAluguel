import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Star } from 'lucide-react'
import { createListing, deleteListing, getMyListings } from '../api/listings'
import { createPayment, getPlan } from '../api/billing'
import { apiErrorMessage } from '../api/client'
import { formatDate, formatMoney } from '../utils/format'
import { useAuth } from '../context/AuthContext'
import LocationPicker from '../components/LocationPicker'
import BoolToggle from '../components/BoolToggle'
import type { Listing, ListingType, Plan } from '../types'

export default function ListingPage() {
  const { user } = useAuth()
  return user?.role === 'RENTER' ? <RenterSearchSection /> : <AdvertiserListingsSection />
}

function RenterSearchSection() {
  const [current, setCurrent] = useState<Listing | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preferredNeighborhood, setPreferredNeighborhood] = useState('')
  const [nearCollege, setNearCollege] = useState('')
  const [price, setPrice] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingCurrent, setLoadingCurrent] = useState(true)

  useEffect(() => {
    getMyListings()
      .then((listings) => {
        const procurando = listings.find((l) => l.type === 'PROCURANDO') ?? null
        setCurrent(procurando)
        if (procurando) {
          setTitle(procurando.title)
          setDescription(procurando.description ?? '')
          setPreferredNeighborhood(procurando.preferredNeighborhood ?? '')
          setNearCollege(procurando.nearCollege ?? '')
          setPrice(procurando.price != null ? String(procurando.price) : '')
        }
      })
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar sua busca')))
      .finally(() => setLoadingCurrent(false))
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      const listing = await createListing({
        type: 'PROCURANDO',
        title,
        description,
        preferredNeighborhood,
        nearCollege,
        price: price ? Number(price) : null,
        address: null,
        latitude: null,
        longitude: null,
        acceptsPets: null,
        acceptsSmoker: null,
      })
      setCurrent(listing)
      setSaved(true)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível salvar sua busca'))
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete() {
    if (!current) return
    setLoading(true)
    try {
      await deleteListing(current.id)
      setCurrent(null)
      setTitle('')
      setDescription('')
      setPreferredNeighborhood('')
      setNearCollege('')
      setPrice('')
    } finally {
      setLoading(false)
    }
  }

  if (loadingCurrent) {
    return <div className="p-8 text-center text-zinc-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Minha busca</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Conte o que você procura — isso ajuda a calcular sua compatibilidade com quem tem vaga ou imóvel disponível.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Título</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ex.: Procuro apê perto da UEM"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Descrição</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Bairro de preferência</label>
            <input
              value={preferredNeighborhood}
              onChange={(e) => setPreferredNeighborhood(e.target.value)}
              placeholder="Ex.: Zona 7"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Perto de qual faculdade</label>
            <input
              value={nearCollege}
              onChange={(e) => setNearCollege(e.target.value)}
              placeholder="Ex.: UEM"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Orçamento (sua parte, R$)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Busca publicada!</p>}

        <div className="flex items-center justify-between gap-3">
          {current && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="text-sm font-medium text-zinc-500 hover:text-red-600"
            >
              Remover busca
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="ml-auto rounded-lg bg-brand-600 px-6 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : current ? 'Atualizar busca' : 'Publicar busca'}
          </button>
        </div>
      </form>
    </div>
  )
}

function AdvertiserListingsSection() {
  const navigate = useNavigate()
  const [listings, setListings] = useState<Listing[]>([])
  const [plan, setPlan] = useState<Plan | null>(null)
  const [buying, setBuying] = useState(false)
  const [loadingList, setLoadingList] = useState(true)
  const [listError, setListError] = useState<string | null>(null)

  const [type, setType] = useState<ListingType>('TEM_VAGA')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [preferredNeighborhood, setPreferredNeighborhood] = useState('')
  const [nearCollege, setNearCollege] = useState('')
  const [price, setPrice] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [acceptsPets, setAcceptsPets] = useState<boolean | null>(null)
  const [acceptsSmoker, setAcceptsSmoker] = useState<boolean | null>(null)
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
        setListings(res.filter((l) => l.type !== 'PROCURANDO'))
        setPlan(planInfo)
      })
      .catch((err) => setListError(apiErrorMessage(err, 'Não foi possível carregar seus anúncios')))
      .finally(() => setLoadingList(false))
  }

  function resetForm() {
    setTitle('')
    setDescription('')
    setPreferredNeighborhood('')
    setNearCollege('')
    setPrice('')
    setAddress('')
    setLatitude(null)
    setLongitude(null)
    setAcceptsPets(null)
    setAcceptsSmoker(null)
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
      await createListing({
        type,
        title,
        description,
        preferredNeighborhood,
        nearCollege,
        price: price ? Number(price) : null,
        address,
        latitude,
        longitude,
        acceptsPets: type === 'ESTABELECIMENTO' ? acceptsPets : null,
        acceptsSmoker: type === 'ESTABELECIMENTO' ? acceptsSmoker : null,
      })
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
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Meus anúncios</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {plan
          ? `${plan.freeListingsUsed} de ${plan.freeListings} anúncios grátis em uso. A partir do ${plan.freeListings + 1}º, cada anúncio extra custa ${formatMoney(plan.extraListingPrice)} por ${plan.extraListingDays} dias.`
          : 'Carregando...'}
      </p>

      {listError && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{listError}</div>}

      {!loadingList && listings.length > 0 && (
        <div className="mb-8 flex flex-col gap-3">
          {listings.map((listing) => (
            <div key={listing.id} className="rounded-2xl bg-white p-4 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="mb-1 flex flex-wrap items-center gap-1.5">
                    <span className="inline-block rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-600">
                      {listing.type === 'TEM_VAGA' ? 'Tenho vaga' : 'Estabelecimento'}
                    </span>
                    {listing.expiresAt && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-sky-700">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        Extra até {formatDate(listing.expiresAt)}
                      </span>
                    )}
                    {listing.highlighted && listing.highlightedUntil && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        <Star className="h-3 w-3" aria-hidden="true" />
                        Destaque até {formatDate(listing.highlightedUntil)}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-zinc-800">{listing.title}</p>
                  <p className="text-sm text-zinc-500">{listing.address}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <button
                    onClick={() => handleDelete(listing.id)}
                    className="text-sm font-medium text-zinc-400 hover:text-red-600"
                  >
                    Remover
                  </button>
                  {plan && (
                    <button
                      onClick={() => handleHighlight(listing.id)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-300 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-50"
                    >
                      <Star className="h-3.5 w-3.5" aria-hidden="true" />
                      Destacar · {formatMoney(plan.highlightPrice)} / {plan.highlightDays} dias
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {mustBuyExtra && plan ? (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="mb-1 text-base font-semibold text-zinc-800">Você usou seus {plan.freeListings} anúncios grátis</h2>
          <p className="mb-4 text-sm text-zinc-500">
            Para publicar mais um, compre um anúncio extra: {formatMoney(plan.extraListingPrice)} por {plan.extraListingDays} dias.
            Também dá para remover um anúncio grátis e liberar a vaga.
          </p>
          <button
            onClick={handleBuyExtra}
            disabled={buying}
            className="w-full rounded-lg bg-brand-600 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {buying ? 'Abrindo...' : `Comprar anúncio extra · ${formatMoney(plan.extraListingPrice)}`}
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-5 rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-zinc-700">Publicar novo anúncio</h2>

          {needsExtraCredit && plan && (
            <p className="rounded-lg bg-sky-50 px-3 py-2 text-sm text-sky-800">
              Este anúncio usa 1 dos seus {plan.extraCredits} crédito(s) de anúncio extra e fica ativo por {plan.extraListingDays} dias.
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setType('TEM_VAGA')}
              className={`flex-1 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                type === 'TEM_VAGA' ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500'
              }`}
            >
              Tenho vaga para dividir
            </button>
            <button
              type="button"
              onClick={() => setType('ESTABELECIMENTO')}
              className={`flex-1 rounded-lg border px-3 py-3 text-sm font-semibold transition ${
                type === 'ESTABELECIMENTO' ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500'
              }`}
            >
              Tenho um imóvel pra alugar
            </button>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Título</label>
            <input
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={type === 'TEM_VAGA' ? 'Ex.: Vaga em apê 2 quartos, Zona 7' : 'Ex.: Kitnet mobiliada perto da UEM'}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">Descrição</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Bairro do imóvel</label>
              <input
                value={preferredNeighborhood}
                onChange={(e) => setPreferredNeighborhood(e.target.value)}
                placeholder="Ex.: Zona 7"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Perto de qual faculdade</label>
              <input
                value={nearCollege}
                onChange={(e) => setNearCollege(e.target.value)}
                placeholder="Ex.: UEM"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-zinc-700">
              {type === 'TEM_VAGA' ? 'Valor da vaga (R$)' : 'Valor do aluguel (R$)'}
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
            />
          </div>

          {type === 'ESTABELECIMENTO' && (
            <div className="grid grid-cols-1 gap-4 rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 sm:grid-cols-2">
              <BoolToggle label="Aceita animais de estimação?" value={acceptsPets} onChange={setAcceptsPets} />
              <BoolToggle label="Aceita fumantes?" value={acceptsSmoker} onChange={setAcceptsSmoker} />
            </div>
          )}

          <div className="flex flex-col gap-3 rounded-xl border border-brand-100 bg-brand-50/40 p-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Endereço</label>
              <input
                required
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Rua, número, bairro"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
              />
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

          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && <p className="text-sm text-emerald-600">Anúncio publicado!</p>}

          <button
            type="submit"
            disabled={loading}
            className="ml-auto rounded-lg bg-brand-600 px-6 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Publicar anúncio'}
          </button>
        </form>
      )}
    </div>
  )
}
