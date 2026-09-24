import { useState } from 'react'
import LocationPicker from './LocationPicker'

interface Props {
  onClose: () => void
  onConfirm: (lat: number, lng: number) => void
}

export default function PickLocationModal({ onClose, onConfirm }: Props) {
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-scrim px-4">
      <div className="w-full max-w-md rounded-lg bg-surface p-6 shadow-pop">
        <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Marcar local no mapa</h2>
        <p className="mb-4 text-[13px] text-ink-3">Mostramos anúncios perto do ponto marcado, não só no mesmo bairro.</p>

        <LocationPicker
          latitude={lat}
          longitude={lng}
          onChange={(newLat, newLng) => {
            setLat(newLat)
            setLng(newLng)
          }}
        />

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => lat != null && lng != null && onConfirm(lat, lng)}
            disabled={lat == null || lng == null}
            className="h-[42px] flex-1 rounded-md bg-brand text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            Usar este local
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] rounded-md px-4 text-sm font-semibold text-ink-2 transition hover:bg-surface-sunk hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
