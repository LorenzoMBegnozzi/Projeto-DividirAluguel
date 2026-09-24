import { MapContainer, Marker, TileLayer } from 'react-leaflet'
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

export default function ListingMapPreview({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <div className="overflow-hidden rounded-md border border-line">
      <MapContainer
        center={[latitude, longitude]}
        zoom={15}
        style={{ height: 160, width: '100%' }}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Marker position={[latitude, longitude]} icon={defaultIcon} />
      </MapContainer>
    </div>
  )
}
