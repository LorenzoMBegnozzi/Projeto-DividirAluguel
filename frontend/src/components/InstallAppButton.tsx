import { Download } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Button } from './ui'

/** Só aparece quando o navegador oferece instalação nativa (Chrome/Edge/Android). */
export default function InstallAppButton({ className = '' }: { className?: string }) {
  const { canInstall, promptInstall } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <Button variant="ghost" size="sm" icon={Download} onClick={promptInstall} title="Instalar o RachaAi" aria-label="Instalar o RachaAi" className={className} />
  )
}
