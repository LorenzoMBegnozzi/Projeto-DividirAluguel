import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { deleteListingPhoto, getListingPhotos, uploadListingPhoto } from '../api/listings'
import { apiErrorMessage } from '../api/client'
import { Alert, cx, focusRing } from './ui'

const MAX_PHOTOS = 6

export default function ListingPhotoManager({ listingId }: { listingId: number }) {
  const [photos, setPhotos] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listingId])

  function load() {
    setLoading(true)
    getListingPhotos(listingId)
      .then(setPhotos)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar as fotos')))
      .finally(() => setLoading(false))
  }

  async function handleUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      await uploadListingPhoto(listingId, file)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível enviar a foto'))
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(photoUrl: string) {
    setError(null)
    try {
      await deleteListingPhoto(listingId, photoUrl)
      setPhotos((prev) => prev.filter((p) => p !== photoUrl))
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível remover a foto'))
    }
  }

  return (
    <div className="mt-3 border-t border-line pt-3">
      <p className="mb-2 text-small font-semibold text-ink">Fotos ({photos.length}/{MAX_PHOTOS})</p>

      {error && <Alert tone="danger" className="mb-2">{error}</Alert>}

      {!loading && (
        <div className="flex flex-wrap gap-2">
          {photos.map((photoUrl) => (
            <div key={photoUrl} className="group relative size-20 overflow-hidden rounded-md border border-line">
              <img src={photoUrl} alt="" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => handleDelete(photoUrl)}
                aria-label="Remover foto"
                className={cx('absolute right-1 top-1 rounded-full bg-scrim p-1 text-on-inverse opacity-0 transition-opacity duration-(--dur-fast) group-hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none', focusRing)}
              >
                <Trash2 className="size-3.5" aria-hidden="true" />
              </button>
            </div>
          ))}

          {photos.length < MAX_PHOTOS && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className={cx('flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-field text-ink-3 transition-colors duration-(--dur-fast) hover:border-ink hover:text-ink disabled:opacity-55 motion-reduce:transition-none', focusRing)}
            >
              <Camera className="size-5" aria-hidden="true" />
              <span className="text-caption font-semibold">{uploading ? 'Enviando…' : 'Adicionar'}</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleUpload}
        className="hidden"
      />
    </div>
  )
}
