import { useEffect, useState } from 'react'
import { getListingChatContacts } from '../api/listings'
import { apiErrorMessage } from '../api/client'
import type { UserProfile } from '../types'
import { Alert, Button, Modal, cx, focusRing } from './ui'

interface Props {
  listingId: number
  listingTitle: string
  onClose: () => void
  onConfirm: (closedWithUserId: number | null) => Promise<void>
}

export default function MarkUnavailableModal({ listingId, listingTitle, onClose, onConfirm }: Props) {
  const [contacts, setContacts] = useState<UserProfile[]>([])
  const [loadingContacts, setLoadingContacts] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getListingChatContacts(listingId)
      .then(setContacts)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar as conversas')))
      .finally(() => setLoadingContacts(false))
  }, [listingId])

  async function handleConfirm() {
    setError(null)
    setLoading(true)
    try {
      await onConfirm(selected)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível marcar como indisponível'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal title="Marcar como indisponível" description={listingTitle}>
      <p className="mb-2 text-small font-semibold text-ink">Com quem você fechou negócio?</p>

      {loadingContacts ? (
        <p className="mb-4 text-small text-ink-3">Carregando conversas…</p>
      ) : contacts.length === 0 ? (
        <p className="mb-4 text-small text-ink-3">Você ainda não conversou com ninguém sobre esse anúncio pelo chat.</p>
      ) : (
        <div className="mb-4 flex max-h-48 flex-col gap-1.5 overflow-y-auto">
          {contacts.map((contact) => (
            <button
              key={contact.id}
              type="button"
              aria-pressed={selected === contact.id}
              onClick={() => setSelected(selected === contact.id ? null : contact.id)}
              className={cx(
                'min-h-11 rounded-md border px-3 py-2 text-left text-small font-semibold transition-colors',
                focusRing,
                selected === contact.id
                  ? 'border-brand bg-brand-tint text-brand-strong'
                  : 'border-field text-ink-2 hover:border-ink hover:text-ink',
              )}
            >
              {contact.name}
            </button>
          ))}
        </div>
      )}

      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

      <div className="flex gap-2">
        <Button className="flex-1" onClick={handleConfirm} disabled={loading}>
          {loading ? 'Salvando…' : selected ? 'Marcar como indisponível' : 'Marcar sem selecionar ninguém'}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
    </Modal>
  )
}
