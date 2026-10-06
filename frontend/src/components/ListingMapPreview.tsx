import { MapContainer, Marker } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import MapTiles from './MapTiles'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

/** Mapa estático do anúncio. `heightClass` muda a altura (padrão h-40). */
export default function ListingMapPreview({ latitude, longitude, heightClass = 'h-40' }: { latitude: number; longitude: number; heightClass?: string }) {
  return (
    <div className="overflow-hidden rounded-lg border border-line">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        className={`${heightClass} w-full`}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
      >
        {/* O crédito do mapa (MapTiler/OpenStreetMap) é obrigatório, então o controle fica ligado. */}
        <MapTiles />
        <Marker position={[latitude, longitude]} icon={defaultIcon} />
      </MapContainer>
    </div>
  )
}
