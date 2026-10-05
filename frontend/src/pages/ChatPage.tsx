import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { getConversation, getMessages, isOtherTyping, markTyping, sendMessage } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import TypingIndicator from '../components/TypingIndicator'
import { Alert, Badge, Button, ButtonLink, Card, Skeleton, cardClass, cx, fieldClass } from '../components/ui'
import type { ConversationSummary, Message } from '../types'

/** Não manda "estou digitando" a cada tecla: no máximo uma vez a cada 2s. */
const TYPING_THROTTLE_MS = 2000

const listingTypeLabel: Record<ConversationSummary['listing']['type'], string> = {
  TEM_VAGA: 'Tem vaga',
  ESTABELECIMENTO: 'Estabelecimento',
}

export default function ChatPage() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const [conversation, setConversation] = useState<ConversationSummary | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [otherTyping, setOtherTyping] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastTypingSentAt = useRef(0)
  const [messageListRef] = useAutoAnimate()

  useEffect(() => {
    if (!conversationId) return
    getConversation(Number(conversationId))
      .then(setConversation)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar a conversa')))
    load()
    const messagesInterval = setInterval(load, 4000)
    // Mais rápido que as mensagens: o indicador de "digitando" precisa parecer instantâneo.
    const typingInterval = setInterval(pollTyping, 1500)
    return () => {
      clearInterval(messagesInterval)
      clearInterval(typingInterval)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  function load() {
    if (!conversationId) return
    getMessages(Number(conversationId))
      .then(setMessages)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar a conversa')))
  }

  function pollTyping() {
    if (!conversationId) return
    isOtherTyping(Number(conversationId))
      .then(setOtherTyping)
      .catch(() => {})
  }

  function handleContentChange(value: string) {
    setContent(value)
    if (!conversationId) return
    const now = Date.now()
    if (now - lastTypingSentAt.current >= TYPING_THROTTLE_MS) {
      lastTypingSentAt.current = now
      markTyping(Number(conversationId)).catch(() => {})
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!conversationId || !content.trim()) return
    const text = content
    setContent('')
    try {
      await sendMessage(Number(conversationId), text)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível enviar a mensagem'))
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-124px)] max-w-2xl flex-col px-4 py-4 lg:h-[calc(100vh-60px)]">
      <Card padding="sm" className="mb-3 flex items-center gap-3">
        <ButtonLink to="/conversas" variant="ghost" icon={ArrowLeft} className="shrink-0" />
        {conversation ? (
          <div className="flex min-w-0 items-center gap-2.5">
            <Avatar photoUrl={conversation.otherUser.photoUrl} name={conversation.otherUser.name} size={36} />
            <div className="min-w-0">
              <Link
                to={`/usuarios/${conversation.otherUser.id}`}
                className="truncate font-semibold text-ink hover:text-brand"
              >
                {conversation.otherUser.name}
              </Link>
              <Link to={`/anuncios/${conversation.listing.id}`} className="block truncate text-caption text-ink-3 hover:text-brand">
                <Badge className="mr-1.5">{listingTypeLabel[conversation.listing.type]}</Badge>
                {conversation.listing.title}
              </Link>
            </div>
          </div>
        ) : (
          <Skeleton className="h-9 w-40 rounded-md" />
        )}
      </Card>

      {error && <Alert tone="danger" className="mb-2">{error}</Alert>}

      <div ref={messageListRef} className={cx(cardClass({ padding: 'sm' }), 'flex-1 space-y-1.5 overflow-y-auto')}>
        {messages.map((message) => {
          const mine = message.senderId === user?.id
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={cx(
                  'max-w-[75%] px-3.5 py-2.5 text-body',
                  mine
                    ? 'rounded-lg rounded-br-xs bg-brand text-on-brand'
                    : 'rounded-lg rounded-bl-xs bg-surface-sunk text-ink',
                )}
              >
                {message.content}
              </div>
            </div>
          )
        })}
        {otherTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className={cx(fieldClass(), 'flex-1')}
        />
        <Button type="submit">Enviar</Button>
      </form>
    </div>
  )
}
