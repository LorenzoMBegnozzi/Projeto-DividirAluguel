import { Star } from 'lucide-react'

interface Props {
  value: number
  onChange?: (value: number) => void
  size?: number
}

export default function StarRating({ value, onChange, size = 18 }: Props) {
  const interactive = Boolean(onChange)
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={interactive ? 'cursor-pointer' : 'cursor-default'}
          aria-label={`${star} estrela${star > 1 ? 's' : ''}`}
        >
          <Star
            width={size}
            height={size}
            className={star <= Math.round(value) ? 'fill-amber-400 text-amber-400' : 'fill-none text-zinc-300'}
          />
        </button>
      ))}
    </div>
  )
}
