import { useEffect, useState } from 'react'
import { Share, X } from 'lucide-react'
import { Button } from './ui'

const DISMISS_KEY = 'rachaai_ios_install_hint_dismissed'

function isIos() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

function isStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  )
}

/** iOS/Safari não dispara "beforeinstallprompt": não dá pra instalar por um botão, só avisar. */
export default function IosInstallHint() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let dismissed = false
    try {
      dismissed = localStorage.getItem(DISMISS_KEY) === '1'
    } catch {
      // Storage bloqueado (modo privado etc.): trata como não dispensado ainda.
    }
    if (isIos() && !isStandalone() && !dismissed) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    try {
      localStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Sem storage, só fecha nesta sessão.
    }
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-18 z-(--z-dropdown) mx-auto flex max-w-md items-center gap-3 rounded-lg border border-line bg-surface py-2 pl-4 pr-2 text-small text-ink shadow-lg lg:bottom-4">
      <p className="flex-1">
        Para instalar o Toc Toc Who?, toque em <Share className="mx-0.5 inline h-4 w-4 align-text-bottom" aria-hidden="true" />{' '}
        <strong>Compartilhar</strong> e depois em <strong>"Adicionar à Tela de Início"</strong>.
      </p>
      <Button variant="ghost" size="sm" icon={X} onClick={dismiss} aria-label="Fechar aviso" className="shrink-0" />
    </div>
  )
}
