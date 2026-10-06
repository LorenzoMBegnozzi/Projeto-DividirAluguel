import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, MapPin } from 'lucide-react'
import { getListing, getListingPhotos } from '../api/listings'
import { getUser } from '../api/profile'
import { startConversation } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import PhotoLightbox from '../components/PhotoLightbox'
import ListingFeatures from '../components/detail/ListingFeatures'
import InterestSection from '../components/InterestSection'
import Avatar from '../components/Avatar'
import ListingMapPreview from '../components/ListingMapPreview'
import type { Listing, UserProfile } from '../types'
import { Alert, Badge, Button, Card, Columns, Page, cx, focusRing, pageTitleClass } from '../components/ui'

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
      <Page width="narrow">
        <Alert tone="danger">{error ?? 'Anúncio não encontrado'}</Alert>
      </Page>
    )
  }

  const hasMap = listing.latitude != null && listing.longitude != null
  const place = [listing.preferredNeighborhood, listing.nearCollege && `perto de ${listing.nearCollege}`].filter(Boolean).join(' · ')

  // cartão de contato: à direita e preso ao rolar no computador; depois do conteúdo no celular
  const contact = (
    <Card className="flex flex-col gap-4">
      <p className="text-ink">
        {listing.price != null ? (
          <><span className="text-h1">R$ {Number(listing.price).toLocaleString('pt-BR')}</span><span className="text-small text-ink-3"> /mês</span></>
        ) : (
          <span className="text-small text-ink-3">Valor não informado</span>
        )}
      </p>
      {owner && (
        <Link
          to={`/usuarios/${owner.id}`}
          className={cx('flex items-center gap-3 rounded-md border border-line p-3 transition hover:border-ink', focusRing)}
        >
          <Avatar photoUrl={owner.photoUrl} name={owner.name} size={44} />
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{owner.name}</p>
            {owner.occupation && <p className="truncate text-caption text-ink-3">{owner.occupation}</p>}
          </div>
        </Link>
      )}
      {error && <Alert tone="danger">{error}</Alert>}
      {owner && currentUser && owner.id !== currentUser.id && (
        <Button onClick={handleConversar} disabled={starting} full>
          {starting ? 'Abrindo…' : 'Conversar'}
        </Button>
      )}
      {/* "Tenho interesse" e quem mais se interessou: ações de contato, ficam junto do Conversar */}
      {listing.type === 'ESTABELECIMENTO' && currentUser && (currentUser.id === listing.userId || currentUser.renter) && (
        <InterestSection listingId={listing.id} isOwner={currentUser.id === listing.userId} />
      )}
    </Card>
  )

  return (
    // estilo portal: largura contida, destaque no topo (fotos ou, sem fotos, o mapa),
    // conteúdo à esquerda e o cartão de preço/contato fixo à direita
    <Page width="medium">
      {/* um cartão grande em volta de tudo: o anúncio vira uma "ficha" única sobre o fundo */}
      <Card padding="none" className="p-4 sm:p-6 lg:p-8">
      <Link to="/conversas" className={cx('mb-3 inline-flex min-h-11 items-center gap-1 rounded-sm text-small text-ink-3 hover:text-ink', focusRing)}>
        <ArrowLeft className="size-4" aria-hidden="true" />
        voltar
      </Link>

      {/* destaque do topo */}
      {photos.length > 0 ? (
        <div className="relative mb-6 grid h-64 grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-xl sm:h-80 lg:h-96">
          {photos.slice(0, 3).map((photoUrl, i) => (
            <button
              key={photoUrl}
              type="button"
              onClick={() => setLightboxIndex(i)}
              aria-label="Ampliar foto"
              className={cx(
                'overflow-hidden',
                i === 0 ? (photos.length === 1 ? 'col-span-4 row-span-2' : 'col-span-3 row-span-2') : photos.length === 2 ? 'row-span-2' : '',
                focusRing,
              )}
            >
              <img src={photoUrl} alt="" className="size-full object-cover transition-transform duration-(--dur-slow) hover:scale-103 motion-reduce:transition-none" />
            </button>
          ))}
          {photos.length > 1 && (
            <Button size="sm" variant="secondary" onClick={() => setLightboxIndex(0)} className="absolute right-3 bottom-3 shadow-md">
              Ver as {photos.length} fotos
            </Button>
          )}
        </div>
      ) : hasMap ? (
        <div className="mb-6">
          <ListingMapPreview latitude={listing.latitude!} longitude={listing.longitude!} heightClass="h-56 sm:h-72 lg:h-80" />
        </div>
      ) : null}

      {lightboxIndex !== null && (
        <PhotoLightbox photos={photos} startIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}

      <Columns side="right" asideWidth="md" asideFirst={false} aside={contact}>
        <div className="flex flex-col gap-4">
          <header className="mb-2">
            <h1 className={pageTitleClass}>{listing.title}</h1>
            {place && (
              <p className="mt-2 flex items-center gap-1.5 text-body text-ink-3">
                <MapPin className="size-4 shrink-0" aria-hidden="true" />{place}
              </p>
            )}
            {!listing.available && <p className="mt-2"><Badge tone="danger">Não disponível mais</Badge></p>}
          </header>

          <ListingFeatures listing={listing} />

          {listing.description && (
            <Card as="section">
              <h2 className="mb-2 text-h3 text-ink">Sobre</h2>
              <p className="text-body text-ink-2">{listing.description}</p>
            </Card>
          )}

          {(hasMap || listing.address) && (
            <Card as="section">
              <h2 className="mb-2 text-h3 text-ink">Onde fica</h2>
              {listing.address && (
                <p className="mb-3 flex items-center gap-1.5 text-small text-ink-2"><MapPin className="size-4 shrink-0 text-ink-3" aria-hidden="true" />{listing.address}</p>
              )}
              {/* o mapa já está no topo quando não há fotos */}
              {hasMap && photos.length > 0 && <ListingMapPreview latitude={listing.latitude!} longitude={listing.longitude!} heightClass="h-64" />}
            </Card>
          )}
        </div>
      </Columns>
      </Card>
    </Page>
  )
}
