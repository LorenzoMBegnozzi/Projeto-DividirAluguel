import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'

const defaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
})

const MARINGA_CENTER: [number, number] = [-23.4205, -51.9333]

interface Props {
  latitude: number | null
  longitude: number | null
  onChange: (lat: number, lng: number) => void
}

function ClickCatcher({ onChange }: { onChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onChange(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

export default function LocationPicker({ latitude, longitude, onChange }: Props) {
  const center: [number, number] = latitude != null && longitude != null ? [latitude, longitude] : MARINGA_CENTER

  return (
    <div className="overflow-hidden rounded-lg border border-zinc-200">
      <MapContainer center={center} zoom={13} style={{ height: 280, width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCatcher onChange={onChange} />
        {latitude != null && longitude != null && <Marker position={[latitude, longitude]} icon={defaultIcon} />}
      </MapContainer>
      <p className="bg-zinc-50 px-3 py-1.5 text-xs text-zinc-500">Clique no mapa para marcar o local exato do imóvel</p>
    </div>
  )
}
