import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { getConversations } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import type { ConversationSummary } from '../types'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar suas conversas')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-zinc-400">Carregando...</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Conversas</h1>
      <p className="mb-6 text-sm text-zinc-500">Suas conversas sobre anúncios.</p>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {conversations.length === 0 && (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Nenhuma conversa ainda.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            to={`/conversas/${conversation.id}`}
            className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm transition hover:shadow-md"
          >
            <div>
              <p className="font-semibold text-zinc-800">{conversation.otherUser.name}</p>
              <p className="text-sm text-zinc-500">{conversation.listing.title}</p>
            </div>
            <ArrowRight className="h-4 w-4 text-brand-600" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  )
}
