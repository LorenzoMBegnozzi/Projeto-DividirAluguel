export function LogoMark({ className = 'h-7 w-7' }: { className?: string }) {
  return (
    <svg viewBox="0 0 26 26" className={className} aria-hidden="true">
      <path d="M12.2 3 3 10.4V23h9.2z" fill="var(--color-brand)" />
      <path d="M13.8 3 23 10.4V23h-9.2z" fill="var(--color-coral-bright)" />
    </svg>
  )
}

export default function Logo({ className = 'text-xl' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-extrabold tracking-tight text-ink ${className}`}>
      <LogoMark />
      <span>
        Racha<span className="text-brand">Ai</span>
      </span>
    </span>
  )
}
