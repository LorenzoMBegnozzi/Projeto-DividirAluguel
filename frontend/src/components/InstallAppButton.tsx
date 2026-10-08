import { Download } from 'lucide-react'
import { useInstallPrompt } from '../hooks/useInstallPrompt'
import { Button } from './ui'

/** Só aparece quando o navegador oferece instalação nativa (Chrome/Edge/Android). */
export default function InstallAppButton({ className = '' }: { className?: string }) {
  const { canInstall, promptInstall } = useInstallPrompt()

  if (!canInstall) return null

  return (
    <Button variant="ghost" size="sm" icon={Download} onClick={promptInstall} title="Instalar o Toc Toc Who?" aria-label="Instalar o Toc Toc Who?" className={className} />
  )
}
