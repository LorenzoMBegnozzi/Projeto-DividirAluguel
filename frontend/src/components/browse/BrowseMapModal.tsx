import { useEffect, useMemo, useRef, useState } from 'react'
import { MapContainer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import { MapPin, X } from 'lucide-react'
import { browseEstablishments, browseRoommates } from '../../api/discovery'
import { apiErrorMessage } from '../../api/client'
import MapTiles from '../MapTiles'
import { Alert, ButtonLink, cx, focusRing } from '../ui'
import type { BrowseItem } from '../../types'

type Kind = 'vaga' | 'imovel'
interface Pin { kind: Kind; item: BrowseItem; lat: number; lng: number }

const MARINGA_CENTER: [number, number] = [-23.4205, -51.9333]
const kindLabel: Record<Kind, string> = { vaga: 'Vaga', imovel: 'Imóvel' }

// Pino desenhado em SVG: a cor vem do CSS (.mapa-pino-vaga azul, .mapa-pino-imovel coral, ver index.css),
// então acompanha o tema claro/escuro sem redesenhar.
function pinIcon(kind: Kind, highlighted: boolean) {
  return L.divIcon({
    className: cx('mapa-pino', `mapa-pino-${kind}`, highlighted && 'mapa-pino-destaque'),
    html: `<svg viewBox="0 0 30 40" width="30" height="40" aria-hidden="true">
      <path d="M15 1C7.3 1 1 7.1 1 14.7 1 25 15 39 15 39s14-14 14-24.3C29 7.1 22.7 1 15 1z" fill="currentColor" stroke="var(--color-surface)" stroke-width="2"/>
      <circle cx="15" cy="14.5" r="5.5" fill="var(--color-surface)"/>
    </svg>`,
    iconSize: [30, 40],
    iconAnchor: [15, 39],
    popupAnchor: [0, -34],
  })
}
const icons = {
  vaga: [pinIcon('vaga', false), pinIcon('vaga', true)],
  imovel: [pinIcon('imovel', false), pinIcon('imovel', true)],
} as const

/** Enquadra o mapa nos pinos visíveis (uma vez por mudança do que aparece). */
function FitToPins({ pins }: { pins: Pin[] }) {
  const map = useMap()
  useEffect(() => {
    if (pins.length === 0) return
    if (pins.length === 1) { map.setView([pins[0].lat, pins[0].lng], 15); return }
    map.fitBounds(L.latLngBounds(pins.map((p) => [p.lat, p.lng] as [number, number])), { padding: [40, 40], maxZoom: 15 })
  }, [map, pins])
  return null
}

/** O balão do pino: o essencial do anúncio e o botão para abrir a página dele. */
function PinCard({ pin }: { pin: Pin }) {
  const { listing: l, compatibilityScore } = pin.item
  const facts = [
    pin.kind === 'vaga' && l.availableSlots != null && `${l.availableSlots} ${l.availableSlots === 1 ? 'vaga livre' : 'vagas livres'}`,
    pin.kind === 'imovel' && l.bedrooms != null && `${l.bedrooms} ${l.bedrooms === 1 ? 'dormitório' : 'dormitórios'}`,
    l.acceptsPets && 'Aceita pet',
  ].filter(Boolean) as string[]
  return (
    <div className="flex w-56 flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className={cx('text-label uppercase', pin.kind === 'vaga' ? 'text-brand' : 'text-coral')}>{kindLabel[pin.kind]}</span>
        {compatibilityScore > 0 && <span className="text-caption font-bold text-leaf">{compatibilityScore}% compatível</span>}
      </div>
      <p className="line-clamp-2 text-small font-bold text-ink">{l.title}</p>
      {(l.preferredNeighborhood || l.nearCollege) && (
        <p className="flex items-center gap-1 text-caption text-ink-3">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{l.preferredNeighborhood || l.nearCollege}</span>
        </p>
      )}
      {facts.length > 0 && <p className="text-caption text-ink-2">{facts.join(' · ')}</p>}
      <p className="text-ink">
        {l.price != null ? <><span className="text-h3">R$ {Number(l.price).toLocaleString('pt-BR')}</span><span className="text-caption text-ink-3"> /mês</span></> : <span className="text-caption text-ink-3">Valor não informado</span>}
      </p>
      {/* "!" na cor: o CSS do Leaflet pinta todo link do mapa de azul */}
      <ButtonLink to={`/anuncios/${l.id}`} size="sm" full className="mt-1 text-on-brand! hover:text-on-brand!">Ver anúncio</ButtonLink>
    </div>
  )
}

/**
 * "Ver no mapa" da busca: todas as vagas (pinos azuis) e imóveis (pinos coral) de uma vez.
 * Tocar num pino abre um balão com o essencial e o botão "Ver anúncio".
 */
export default function BrowseMapModal({ onClose }: { onClose: () => void }) {
  const [pins, setPins] = useState<Pin[] | null>(null)
  const [withoutPlace, setWithoutPlace] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [show, setShow] = useState<Record<Kind, boolean>>({ vaga: true, imovel: true })
  const panel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let alive = true
    Promise.all([browseRoommates(), browseEstablishments()])
      .then(([vagas, imoveis]) => {
        if (!alive) return
        const all = [...vagas.map((item) => ({ kind: 'vaga' as const, item })), ...imoveis.map((item) => ({ kind: 'imovel' as const, item }))]
        const placed = all.flatMap(({ kind, item }) =>
          item.listing.latitude != null && item.listing.longitude != null
            ? [{ kind, item, lat: item.listing.latitude, lng: item.listing.longitude }]
            : [])
        setPins(placed)
        setWithoutPlace(all.length - placed.length)
      })
      .catch((err) => alive && setError(apiErrorMessage(err, 'Não foi possível carregar o mapa')))
    return () => { alive = false }
  }, [])

  // foco no painel ao abrir, Esc fecha, devolve o foco ao botão que abriu
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey); prev?.focus?.() }
  }, [onClose])

  const visible = useMemo(() => (pins ?? []).filter((p) => show[p.kind]), [pins, show])
  const count = (k: Kind) => (pins ?? []).filter((p) => p.kind === k).length

  return (
    <div className="fixed inset-0 z-(--z-modal) flex items-center justify-center bg-scrim p-0 sm:p-6" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mapa-titulo"
        tabIndex={-1}
        className="flex size-full flex-col overflow-hidden bg-surface shadow-lg outline-none sm:h-[85dvh] sm:max-w-6xl sm:rounded-xl"
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line px-4 py-3 sm:px-5">
          <h2 id="mapa-titulo" className="text-h3 text-ink">Anúncios no mapa</h2>
          <div className="flex flex-1 flex-wrap items-center gap-2" role="group" aria-label="Mostrar no mapa">
            {(['vaga', 'imovel'] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={show[k]}
                onClick={() => setShow((s) => ({ ...s, [k]: !s[k] }))}
                className={cx(
                  'inline-flex h-9 items-center gap-2 rounded-full border px-3 text-caption font-semibold transition-colors duration-(--dur-fast)',
                  show[k] ? 'border-line-strong bg-surface text-ink' : 'border-line bg-surface-sunk text-ink-3 line-through',
                  focusRing,
                )}
              >
                <span className={cx('size-3 rounded-full', k === 'vaga' ? 'bg-brand' : 'bg-coral-bright', !show[k] && 'opacity-40')} aria-hidden="true" />
                {k === 'vaga' ? 'Vagas' : 'Imóveis'}{pins && ` (${count(k)})`}
              </button>
            ))}
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar o mapa" className={cx('grid size-10 place-items-center rounded-full text-ink-3 hover:bg-surface-sunk hover:text-ink', focusRing)}>
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>

        {error && <Alert tone="danger" className="m-4">{error}</Alert>}
        <div className="relative min-h-0 flex-1">
          <MapContainer center={MARINGA_CENTER} zoom={13} className="size-full" scrollWheelZoom>
            <MapTiles />
            <FitToPins pins={visible} />
            {visible.map((p) => (
              <Marker key={`${p.kind}-${p.item.listing.id}`} position={[p.lat, p.lng]} icon={icons[p.kind][p.item.listing.highlighted ? 1 : 0]}>
                <Popup closeButton={false}>
                  <PinCard pin={p} />
                </Popup>
              </Marker>
            ))}
          </MapContainer>
          {!pins && !error && (
            <p className="absolute inset-x-0 top-4 z-(--z-raised) mx-auto w-fit rounded-full bg-surface px-4 py-2 text-small text-ink-3 shadow-md">Carregando anúncios…</p>
          )}
          {pins && withoutPlace > 0 && (
            <p className="absolute bottom-3 left-3 z-(--z-raised) rounded-md bg-surface/90 px-3 py-1.5 text-caption text-ink-3 shadow-sm">
              {withoutPlace} {withoutPlace === 1 ? 'anúncio não informou' : 'anúncios não informaram'} o endereço e não {withoutPlace === 1 ? 'aparece' : 'aparecem'} no mapa
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
