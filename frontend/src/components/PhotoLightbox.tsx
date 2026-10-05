import { useEffect, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from './ui'

interface Props {
  photos: string[]
  startIndex?: number
  onClose: () => void
}

export default function PhotoLightbox({ photos, startIndex = 0, onClose }: Props) {
  const [index, setIndex] = useState(startIndex)
  const hasMany = photos.length > 1

  function prev() {
    setIndex((i) => (i - 1 + photos.length) % photos.length)
  }

  function next() {
    setIndex((i) => (i + 1) % photos.length)
  }

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') setIndex((i) => (i - 1 + photos.length) % photos.length)
      if (e.key === 'ArrowRight') setIndex((i) => (i + 1) % photos.length)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [photos.length, onClose])

  return (
    <div
      className="fixed inset-0 z-(--z-modal) flex flex-col items-center justify-center gap-4 bg-scrim p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Fotos do anúncio"
    >
      <Button variant="secondary" icon={X} onClick={onClose} aria-label="Fechar" className="absolute right-4 top-4 rounded-full border-transparent shadow-lg" />

      <div className="relative flex max-h-[70vh] w-full max-w-4xl items-center justify-center" onClick={(e) => e.stopPropagation()}>
        <img src={photos[index]} alt="" className="max-h-[70vh] max-w-full rounded-lg object-contain" />
        {hasMany && (
          <>
            <Button variant="secondary" icon={ChevronLeft} onClick={prev} aria-label="Foto anterior" className="absolute left-2 rounded-full border-transparent shadow-lg" />
            <Button variant="secondary" icon={ChevronRight} onClick={next} aria-label="Próxima foto" className="absolute right-2 rounded-full border-transparent shadow-lg" />
          </>
        )}
      </div>

      {hasMany && (
        <div className="flex max-w-4xl gap-2 overflow-x-auto" onClick={(e) => e.stopPropagation()}>
          {photos.map((photo, i) => (
            <button
              key={photo}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Ver foto ${i + 1}`}
              className={`h-16 w-20 shrink-0 overflow-hidden rounded-md border-2 transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                i === index ? 'border-brand' : 'border-transparent opacity-70 hover:opacity-100'
              }`}
            >
              <img src={photo} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
