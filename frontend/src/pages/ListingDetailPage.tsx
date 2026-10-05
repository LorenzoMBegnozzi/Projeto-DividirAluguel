import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Banknote, Cigarette, CigaretteOff, GraduationCap, Home, MapPin, PawPrint, Users } from 'lucide-react'
import { getListing, getListingPhotos } from '../api/listings'
import { getUser } from '../api/profile'
import { startConversation } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import { formatResidents } from '../utils/format'
import { genderPreferenceLabels } from '../constants/profileOptions'
import PhotoLightbox from '../components/PhotoLightbox'
import Fact from '../components/Fact'
import PropertyFacts from '../components/PropertyFacts'
import InterestSection from '../components/InterestSection'
import Avatar from '../components/Avatar'
import ListingMapPreview from '../components/ListingMapPreview'
import type { Listing, UserProfile } from '../types'
import { Alert, Badge, Button, Card, cx, focusRing, pageTitleClass } from '../components/ui'

export default function ListingDetailPage() {
  const { listingId } = useParams()
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [listing, setListing] = useState<Listing | null>(null)
  const [owner, setOwner] = useState<UserProfile | null>(null)
  const [photos, setPhotos] = useState<string[]>([])
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
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
        <Alert tone="danger">{error ?? 'Anúncio não encontrado'}</Alert>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link to="/conversas" className={cx('mb-4 inline-flex items-center gap-1 rounded-sm text-small text-ink-3 hover:text-ink', focusRing)}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        voltar
      </Link>

      <Card>
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <h1 className={pageTitleClass}>{listing.title}</h1>
            {!listing.available && <p className="mt-1"><Badge tone="danger">Não disponível mais</Badge></p>}
          </div>
        </div>

        {owner && (
          <Link
            to={`/usuarios/${owner.id}`}
            className={cx('mb-4 flex items-center gap-3 rounded-md border border-line p-3 transition hover:border-ink', focusRing)}
          >
            <Avatar photoUrl={owner.photoUrl} name={owner.name} size={44} />
            <div className="min-w-0">
              <p className="truncate font-semibold text-ink">{owner.name}</p>
              {owner.occupation && <p className="truncate text-caption text-ink-3">{owner.occupation}</p>}
            </div>
          </Link>
        )}

        {photos.length > 0 && (
          <div className="mb-4 flex gap-2 overflow-x-auto">
            {photos.map((photoUrl, i) => (
              <button key={photoUrl} type="button" onClick={() => setLightboxIndex(i)} aria-label="Ampliar foto" className={cx('shrink-0 rounded-md', focusRing)}>
                <img src={photoUrl} alt="" className="h-40 w-56 rounded-md object-cover" />
              </button>
            ))}
          </div>
        )}

        {lightboxIndex !== null && (
          <PhotoLightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
        )}

        {listing.description && <p className="mb-4 text-body text-ink-2">{listing.description}</p>}

        <div className="mb-4 flex flex-wrap gap-x-3 gap-y-1 text-caption text-ink-3">
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
          <div className="mb-4">
            <ListingMapPreview latitude={listing.latitude} longitude={listing.longitude} />
            {listing.address && <p className="mt-1 text-caption text-ink-3">{listing.address}</p>}
          </div>
        )}

        {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

        {listing.type === 'ESTABELECIMENTO' && currentUser && (currentUser.id === listing.userId || currentUser.renter) && (
          <div className="mb-3">
            <InterestSection listingId={listing.id} isOwner={currentUser.id === listing.userId} />
          </div>
        )}

        {owner && currentUser && owner.id !== currentUser.id && (
          <Button onClick={handleConversar} disabled={starting} full>
            {starting ? 'Abrindo…' : 'Conversar'}
          </Button>
        )}
      </Card>
    </div>
  )
}
