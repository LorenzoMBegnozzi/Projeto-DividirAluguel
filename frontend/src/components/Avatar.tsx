import { useState } from 'react'

interface Props {
  photoUrl?: string | null
  name: string
  size?: number
  className?: string
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
        style={{ width: size, height: size, fontSize: size * 0.4 }}
        className={`flex shrink-0 items-center justify-center rounded-full bg-brand-100 font-semibold text-brand-700 ${className}`}
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
