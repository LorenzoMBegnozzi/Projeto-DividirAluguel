import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { ArrowRight } from 'lucide-react'
import { getConversations } from '../api/discovery'
import { blockUser } from '../api/moderation'
import { apiErrorMessage } from '../api/client'
import Avatar from '../components/Avatar'
import { Alert, Button, ButtonLink, Card, EmptyState, pageTitleClass } from '../components/ui'
import type { ConversationSummary } from '../types'
import { confirmDialog } from '../components/ConfirmDialog'

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [blockedIds, setBlockedIds] = useState<number[]>([])
  const [listRef] = useAutoAnimate<HTMLDivElement>()

  useEffect(() => {
    getConversations()
      .then(setConversations)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar suas conversas')))
      .finally(() => setLoading(false))
  }, [])

  async function handleBlock(userId: number) {
    if (!(await confirmDialog({
      title: 'Bloquear essa pessoa?',
      description: 'Vocês não vão mais aparecer um para o outro e não poderão trocar novas mensagens.',
      confirmLabel: 'Bloquear',
      danger: true,
    }))) {
      return
    }
    try {
      await blockUser(userId)
      setBlockedIds((prev) => [...prev, userId])
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível bloquear'))
    }
  }

  if (loading) {
    return <div className="p-8 text-center text-body text-ink-3">Carregando…</div>
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className={`mb-1 ${pageTitleClass}`}>Conversas</h1>
      <p className="mb-6 text-small text-ink-3">Suas conversas sobre anúncios.</p>

      {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

      {conversations.length === 0 && (
        <EmptyState title="Nenhuma conversa ainda." />
      )}

      <div ref={listRef} className="flex flex-col gap-2">
        {conversations.map((conversation) => (
          <Card
            key={conversation.id}
            padding="sm"
            className="flex items-center justify-between gap-3 transition-colors duration-(--dur-fast) hover:border-line-strong"
          >
            <Link to={`/conversas/${conversation.id}`} className="flex flex-1 items-center gap-3">
              <Avatar photoUrl={conversation.otherUser.photoUrl} name={conversation.otherUser.name} size={40} />
              <div>
                <p className="font-semibold text-ink">{conversation.otherUser.name}</p>
                <p className="text-caption text-ink-3">{conversation.listing.title}</p>
              </div>
            </Link>
            <div className="flex items-center gap-1">
              <ButtonLink to={`/usuarios/${conversation.otherUser.id}`} variant="ghost" size="sm" className="hover:!text-brand">
                Ver perfil
              </ButtonLink>
              {blockedIds.includes(conversation.otherUser.id) ? (
                <span className="px-3.5 text-caption font-semibold text-ink-3">Bloqueado</span>
              ) : (
                <Button variant="ghost" size="sm" onClick={() => handleBlock(conversation.otherUser.id)} className="hover:!text-danger">
                  Bloquear
                </Button>
              )}
              <ButtonLink to={`/conversas/${conversation.id}`} variant="ghost" size="sm" icon={ArrowRight} className="!text-brand" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
