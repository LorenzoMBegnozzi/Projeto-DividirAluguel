import { Download } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'

/** Só aparece quando o navegador oferece instalação nativa (Chrome/Edge/Android). */
export default function InstallAppButton({ className = '' }: { className?: string }) {
  const { canInstall, promptInstall } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <button
      onClick={promptInstall}
      title="Instalar o RachaAi"
      aria-label="Instalar o RachaAi"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-ink-2 transition hover:bg-surface-sunk hover:text-ink ${className}`}
    >
      <Download className="h-5 w-5" aria-hidden="true" />
    </button>
  )
}
