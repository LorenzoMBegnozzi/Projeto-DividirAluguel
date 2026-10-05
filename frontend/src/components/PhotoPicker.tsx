import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import { Camera, Trash2 } from 'lucide-react'
import { cx, focusRing } from './ui'

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
      <p className="mb-2 text-small font-semibold text-ink">Fotos ({files.length}/{MAX_PHOTOS})</p>
      <div className="flex flex-wrap gap-2">
        {files.map((file, index) => (
          <div key={`${file.name}-${index}`} className="group relative size-20 overflow-hidden rounded-md border border-line">
            {previews[index] && <img src={previews[index]} alt="" className="size-full object-cover" />}
            <button
              type="button"
              onClick={() => handleRemove(index)}
              aria-label="Remover foto"
              className={cx('absolute right-1 top-1 rounded-full bg-scrim p-1 text-on-inverse opacity-0 transition-opacity duration-(--dur-fast) group-hover:opacity-100 focus-visible:opacity-100 motion-reduce:transition-none', focusRing)}
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}

        {files.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className={cx('flex size-20 flex-col items-center justify-center gap-1 rounded-md border border-dashed border-field text-ink-3 transition-colors duration-(--dur-fast) hover:border-ink hover:text-ink motion-reduce:transition-none', focusRing)}
          >
            <Camera className="size-5" aria-hidden="true" />
            <span className="text-caption font-semibold">Adicionar</span>
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
