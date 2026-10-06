import { useEffect, useState } from 'react'
import { Button, Modal } from './ui'

interface ConfirmOptions {
  title: string
  description?: string
  confirmLabel?: string
  cancelLabel?: string
  /** ação destrutiva ou que não dá para desfazer: botão vermelho */
  danger?: boolean
}

interface Pending extends ConfirmOptions {
  resolve: (ok: boolean) => void
}

let show: ((p: Pending) => void) | null = null

/** Substitui window.confirm: abre o diálogo do app e devolve true (confirmou) ou false. */
export function confirmDialog(options: ConfirmOptions): Promise<boolean> {
  return new Promise((resolve) => {
    if (!show) {
      resolve(window.confirm(options.description ? `${options.title}\n\n${options.description}` : options.title))
      return
    }
    show({ ...options, resolve })
  })
}

/** Montar uma vez na raiz do app (App.tsx). */
export function ConfirmHost() {
  const [pending, setPending] = useState<Pending | null>(null)

  useEffect(() => {
    show = (p) => setPending(p)
    return () => { show = null }
  }, [])

  function close(ok: boolean) {
    pending?.resolve(ok)
    setPending(null)
  }

  if (!pending) return null
  return (
    <Modal title={pending.title} description={pending.description} onEscape={() => close(false)}>
      <div className="flex gap-2">
        <Button variant={pending.danger ? 'danger' : 'primary'} className="flex-1" onClick={() => close(true)}>
          {pending.confirmLabel ?? 'Confirmar'}
        </Button>
        <Button variant="ghost" onClick={() => close(false)}>
          {pending.cancelLabel ?? 'Cancelar'}
        </Button>
      </div>
    </Modal>
  )
}
