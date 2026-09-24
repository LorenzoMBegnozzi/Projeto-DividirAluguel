import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Cigarette, CigaretteOff, GraduationCap, MapPin, PawPrint, Users } from 'lucide-react'
import { getListing, getListingPhotos } from '../api/listings'
import { getUser } from '../api/profile'
import { startConversation } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Fact from '../components/Fact'
import Avatar from '../components/Avatar'
import ListingMapPreview from '../components/ListingMapPreview'
import type { Listing, UserProfile } from '../types'

export default function ListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [owner, setOwner] = useState<UserProfile | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    if (!listingId) return
    setLoading(true)
    getListing(Number(listingId))
      .then((data) => {
        setListing(data)
        return getUser(data.userId)
      })
      .then(setOwner)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar o anúncio')))
      .finally(() => setLoading(false))
    getListingPhotos(Number(listingId))
      .then(setPhotos)
      .catch(() => setPhotos([]))
  }, [listingId])

  async function handleConversar() {
    if (!listing) return
    setStarting(true)
    try {
      const conversation = await startConversation(listing.id)
      navigate(`/conversas/${conversation.id}`)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível iniciar a conversa'))
    } finally {
      setStarting(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-ink-3">Carregando…</div>
  }

  if (error || !listing) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="rounded-md bg-danger-tint px-4 py-3 text-sm text-danger">{error ?? 'Anúncio não encontrado'}</p>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/conversas" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        voltar
      </Link>

      <div className="rounded-lg border border-line bg-surface p-6">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">{listing.title}</h1>
            {!listing.available && <p className="mt-1 text-[13px] font-semibold text-danger">Não disponível mais</p>}
          </div>
        </div>

        {owner && (
          <Link
            to={`/usuarios/${owner.id}`}
            className="mb-4 flex items-center gap-3 rounded-md border border-line p-3 transition hover:border-ink"
          >
            <Avatar photoUrl={owner.photoUrl} name={owner.name} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{owner.name}</p>
              {owner.occupation && <p className="truncate text-[13px] text-ink-3">{owner.occupation}</p>}
            </div>
          </Link>
        )}

        {photos.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {photos.map((photoUrl) => (
              <img key={photoUrl} src={photoUrl} alt="" className="h-40 w-56 shrink-0 rounded-md object-cover" />
            ))}
          </div>
        )}

        {listing.description && <p className="mb-4 text-ink-2">{listing.description}</p>}

        <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-[13px] text-ink-3">
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
          <div className="mb-4">
            <ListingMapPreview latitude={listing.latitude} longitude={listing.longitude} />
            {listing.address && <p className="mt-1 text-[13px] text-ink-3">{listing.address}</p>}
          </div>
        )}

        {error && <p className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

        {owner && currentUser && owner.id !== currentUser.id && (
          <button
            onClick={handleConversar}
            disabled={starting}
            className="h-[42px] w-full rounded-md bg-brand text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {starting ? 'Abrindo…' : 'Conversar'}
          </button>
        )}
      </div>
    </div>
  )
}
