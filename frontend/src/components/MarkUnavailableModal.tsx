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
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-zinc-900/50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-bold text-zinc-800">Marcar como indisponível</h2>
        <p className="mb-4 text-sm text-zinc-500">{listingTitle}</p>

        <p className="mb-2 text-sm font-medium text-zinc-700">Com quem você fechou negócio?</p>

        {loadingContacts ? (
          <p className="mb-4 text-sm text-zinc-400">Carregando conversas...</p>
        ) : contacts.length === 0 ? (
          <p className="mb-4 text-sm text-zinc-400">
            Você ainda não conversou com ninguém sobre esse anúncio pelo chat.
          </p>
        ) : (
          <div className="mb-4 flex max-h-48 flex-col gap-1 overflow-y-auto">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => setSelected(selected === contact.id ? null : contact.id)}
                className={`rounded-lg border px-3 py-2 text-left text-sm font-medium transition ${
                  selected === contact.id
                    ? 'border-brand-600 bg-brand-50 text-brand-700'
                    : 'border-zinc-200 text-zinc-600 hover:border-brand-300'
                }`}
              >
                {contact.name}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : selected ? 'Marcar como indisponível' : 'Marcar sem selecionar ninguém'}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-500"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
