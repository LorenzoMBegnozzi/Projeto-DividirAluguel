import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { browseEstablishments, browseRoommates, startConversation } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { Banknote, Cigarette, CigaretteOff, Drumstick, GraduationCap, MapPin, Music, PawPrint, Salad, Star } from 'lucide-react'
import Fact from '../components/Fact'
import ListingMapPreview from '../components/ListingMapPreview'
import type { BrowseItem } from '../types'

type Tab = 'ROOMMATES' | 'ESTABLISHMENTS'

function scoreColor(score: number) {
  if (score >= 75) return 'bg-emerald-100 text-emerald-700'
  if (score >= 50) return 'bg-amber-100 text-amber-700'
  return 'bg-zinc-100 text-zinc-600'
}

export default function BrowsePage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<Tab>('ROOMMATES')
  const [items, setItems] = useState<BrowseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startingId, setStartingId] = useState<number | null>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab])

  function load() {
    setLoading(true)
    setError(null)
    const request = tab === 'ROOMMATES' ? browseRoommates() : browseEstablishments()
    request
      .then(setItems)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os anúncios')))
      .finally(() => setLoading(false))
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Buscar</h1>
      <p className="mb-4 text-sm text-zinc-500">Ordenado pela sua compatibilidade.</p>

      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setTab('ROOMMATES')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            tab === 'ROOMMATES' ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          Tem vaga
        </button>
        <button
          onClick={() => setTab('ESTABLISHMENTS')}
          className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
            tab === 'ESTABLISHMENTS' ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-200 text-zinc-500'
          }`}
        >
          Estabelecimentos
        </button>
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-zinc-400">Carregando...</div>
      ) : items.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Ainda não há anúncios ativos nessa categoria. Volte mais tarde!
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((item) => (
            <div key={item.listing.id} className="rounded-2xl bg-white p-5 shadow-sm">
              <div className="mb-2 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-800">
                    {tab === 'ROOMMATES' ? item.user.name : item.listing.title}
                  </h2>
                  <p className="text-sm text-zinc-500">{tab === 'ROOMMATES' ? item.user.occupation : item.user.name}</p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${scoreColor(item.compatibilityScore)}`}>
                    {item.compatibilityScore}% compatível
                  </span>
                  {item.listing.highlighted && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700">
                      <Star className="h-3 w-3" aria-hidden="true" />
                      Destaque
                    </span>
                  )}
                </div>
              </div>

              {tab === 'ROOMMATES' && item.user.bio && <p className="mb-3 text-sm text-zinc-600">{item.user.bio}</p>}

              {tab === 'ROOMMATES' && (
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
                  {item.user.smoker != null && (
                    <Fact icon={item.user.smoker ? Cigarette : CigaretteOff}>{item.user.smoker ? 'Fumante' : 'Não fumante'}</Fact>
                  )}
                  {item.user.vegetarian != null && (
                    <Fact icon={item.user.vegetarian ? Salad : Drumstick}>
                      {item.user.vegetarian ? 'Vegetariano(a)' : 'Não vegetariano(a)'}
                    </Fact>
                  )}
                  {item.user.hasPets != null && <Fact icon={PawPrint}>{item.user.hasPets ? 'Tem pet' : 'Sem pet'}</Fact>}
                  {item.user.musicTaste && <Fact icon={Music}>{item.user.musicTaste}</Fact>}
                </div>
              )}

              {tab === 'ESTABLISHMENTS' && (
                <div className="mb-3 flex flex-wrap gap-2 text-xs text-zinc-500">
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

              <p className="mb-3 text-sm text-zinc-700">
                <strong>{item.listing.title}</strong>
                {item.listing.description && <span className="block text-zinc-500">{item.listing.description}</span>}
              </p>

              <div className="mb-3 flex flex-wrap gap-3 text-xs text-zinc-500">
                {item.listing.preferredNeighborhood && <Fact icon={MapPin}>{item.listing.preferredNeighborhood}</Fact>}
                {item.listing.nearCollege && <Fact icon={GraduationCap}>Perto de {item.listing.nearCollege}</Fact>}
                {item.listing.price != null && <Fact icon={Banknote}>R$ {item.listing.price}</Fact>}
              </div>

              {item.listing.latitude != null && item.listing.longitude != null && (
                <div className="mb-3">
                  <ListingMapPreview latitude={item.listing.latitude} longitude={item.listing.longitude} />
                  {item.listing.address && <p className="mt-1 text-xs text-zinc-500">{item.listing.address}</p>}
                </div>
              )}

              <button
                onClick={() => handleConversar(item.listing.id)}
                disabled={startingId === item.listing.id}
                className="w-full rounded-lg bg-brand-600 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
              >
                {startingId === item.listing.id ? 'Abrindo...' : 'Conversar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
