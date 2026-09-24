import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'

const MAX_PHOTOS = 6

interface Props {
  files: File[]
  onChange: (files: File[]) => void
}

export default function PhotoPicker({ files, onChange }: Props) {
  const [previews, setPreviews] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const urls = files.map((file) => URL.createObjectURL(file))
    setPreviews(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [files])

  function handleSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    onChange([...files, file].slice(0, MAX_PHOTOS))
  }

  function handleRemove(index: number) {
    onChange(files.filter((_, i) => i !== index))
  }

  return (
    <div>
      <p className="mb-2 text-[13px] font-semibold text-ink">Fotos ({files.length}/{MAX_PHOTOS})</p>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="group relative h-20 w-20 overflow-hidden rounded-md border border-line">
            {previews[index] && <img src={previews[index]} alt="" className="h-full w-full object-cover" />}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Remover foto"
              className="absolute right-1 top-1 rounded-full bg-scrim p-1 text-on-inverse opacity-0 transition group-hover:opacity-100"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}

        {files.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex h-20 w-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-line-strong text-ink-3 transition hover:border-ink hover:text-ink"
          >
            <Camera className="h-5 w-5" aria-hidden="true" />
            <span className="text-[11px] font-semibold">Adicionar</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleSelect}
        className="hidden"
      />
    </div>
  )
}
