import { useState } from 'react'
import LocationPicker from './LocationPicker'
import { Button, Modal } from './ui'

interface Props {
  onClose: () => void
  onConfirm: (lat: number, lng: number) => void
}

export default function PickLocationModal({ onClose, onConfirm }: Props) {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  return (
    <Modal size="md" title="Marcar local no mapa" description="Mostramos anúncios perto do ponto marcado, não só no mesmo bairro.">
      <LocationPicker
        latitude={lat}
        longitude={lng}
        onChange={(newLat, newLng) => {
          setLat(newLat)
          setLng(newLng)
        }}
      />

      <div className="mt-4 flex gap-2">
        <Button className="flex-1" onClick={() => lat != null && lng != null && onConfirm(lat, lng)} disabled={lat == null || lng == null}>
          Usar este local
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}
