import { useState } from 'react'

interface Props {
  photoUrl?: string | null
  name: string
  size?: number
  className?: string
}

/** tamanho do texto das iniciais (≈ 40% do avatar) na escala de tipografia */
function initialsText(size: number) {
  if (size <= 30) return 'text-micro'
  if (size <= 38) return 'text-small'
  if (size <= 46) return 'text-body'
  if (size <= 60) return 'text-h2'
  return 'text-h1'
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/)
  const first = parts[0]?.[0] ?? ''
  const last = parts.length > 1 ? parts[parts.length - 1][0] : ''
  return (first + last).toUpperCase()
}

export default function Avatar({ photoUrl, name, size = 40, className = '' }: Props) {
  const [failed, setFailed] = useState(false)

  if (!photoUrl || failed) {
    return (
      <div
        style={{ width: size, height: size }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand-tint font-bold tracking-tight text-brand-strong ${initialsText(size)} ${className}`}
      >
        {initials(name) || '?'}
      </div>
    )
  }

  return (
    <img
      src={photoUrl}
      alt={name}
      style={{ width: size, height: size }}
      className={`shrink-0 rounded-full object-cover ${className}`}
      onError={() => setFailed(true)}
    />
  )
}
