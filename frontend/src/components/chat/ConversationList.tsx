import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { getConversations } from '../../api/discovery'
import { apiErrorMessage } from '../../api/client'
import Avatar from '../Avatar'
import { Alert, EmptyState, Skeleton, cx, focusRing } from '../ui'
import type { ConversationSummary } from '../../types'

/**
 * Lista de conversas (busca uma vez ao montar): a pessoa e o anúncio de cada uma; a aberta
 * fica destacada. "Ver perfil" e "Bloquear" ficam no cabeçalho da conversa aberta (ChatPage).
 */
export default function ConversationList({ activeId }: { activeId?: number }) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [listRef] = useAutoAnimate<HTMLDivElement>()

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar suas conversas')))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col gap-1" aria-busy="true">
        <span className="sr-only">Carregando…</span>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex min-h-16 items-center gap-3 px-3 py-2.5">
            <Skeleton className="size-10 rounded-full" />
            <div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/5" /><Skeleton className="h-3 w-3/5" /></div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div>
      {error && <Alert tone="danger" className="mb-2">{error}</Alert>}
      {conversations.length === 0 && !error && <EmptyState title="Nenhuma conversa ainda." />}

      <div ref={listRef} className="flex flex-col gap-1">
        {conversations.map((conversation) => {
          const active = conversation.id === activeId
          return (
            <Link
              key={conversation.id}
              to={`/conversas/${conversation.id}`}
              aria-current={active ? 'page' : undefined}
              className={cx(
                'flex min-h-16 items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors duration-(--dur-fast)',
                active ? 'border-brand bg-brand-tint' : 'border-transparent hover:bg-surface-sunk',
                focusRing,
              )}
            >
              <Avatar photoUrl={conversation.otherUser.photoUrl} name={conversation.otherUser.name} size={40} />
              <div className="min-w-0">
                <p className="truncate font-semibold text-ink">{conversation.otherUser.name}</p>
                <p className="truncate text-caption text-ink-3">{conversation.listing.title}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
