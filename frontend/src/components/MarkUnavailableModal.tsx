import { useEffect, useState } from 'react'
import { getListingChatContacts } from '../api/listings'
import { apiErrorMessage } from '../api/client'
import type { UserProfile } from '../types'

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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-scrim px-4">
      <div className="w-full max-w-sm rounded-lg bg-surface p-6 shadow-pop">
        <h2 className="mb-1 text-xl font-bold tracking-tight text-ink">Marcar como indisponível</h2>
        <p className="mb-4 text-[13px] text-ink-3">{listingTitle}</p>

        <p className="mb-2 text-[13px] font-semibold text-ink">Com quem você fechou negócio?</p>

        {loadingContacts ? (
          <p className="mb-4 text-sm text-ink-3">Carregando conversas…</p>
        ) : contacts.length === 0 ? (
          <p className="mb-4 text-sm text-ink-3">Você ainda não conversou com ninguém sobre esse anúncio pelo chat.</p>
        ) : (
          <div className="mb-4 flex max-h-48 flex-col gap-1 overflow-y-auto">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelected(selected === contact.id ? null : contact.id)}
                className={`rounded-md border px-3 py-2 text-left text-sm font-semibold transition ${
                  selected === contact.id
                    ? 'border-inverse bg-inverse text-on-inverse'
                    : 'border-line-strong text-ink-2 hover:border-ink hover:text-ink'
                }`}
              >
                {contact.name}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="h-[42px] flex-1 rounded-md bg-brand px-4 text-sm font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? 'Salvando…' : selected ? 'Marcar como indisponível' : 'Marcar sem selecionar ninguém'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="h-[42px] rounded-md px-4 text-sm font-semibold text-ink-2 transition hover:bg-surface-sunk hover:text-ink"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
