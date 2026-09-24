import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { getConversation, getMessages, sendMessage } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import Avatar from '../components/Avatar'
import type { ConversationSummary, Message } from '../types'

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
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) return
    getConversation(Number(conversationId))
      .then(setConversation)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar a conversa')))
    load()
    const interval = setInterval(load, 4000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function load() {
    if (!conversationId) return
    getMessages(Number(conversationId))
      .then(setMessages)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar a conversa')))
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
      <div className="mb-3 flex items-center gap-3 rounded-lg border border-line bg-surface p-3">
        <Link to="/conversas" className="shrink-0 rounded-md p-1.5 text-ink-3 hover:bg-surface-sunk hover:text-ink">
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </Link>
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
              <Link to={`/anuncios/${conversation.listing.id}`} className="block truncate text-xs text-ink-3 hover:text-brand">
                <span className="mr-1.5 inline-block rounded-sm bg-surface-sunk px-2 py-0.5 font-semibold text-ink-2">
                  {listingTypeLabel[conversation.listing.type]}
                </span>
                {conversation.listing.title}
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-9 w-40 animate-pulse rounded-md bg-surface-sunk" />
        )}
      </div>

      {error && <div className="mb-2 rounded-md bg-danger-tint px-4 py-2 text-sm text-danger">{error}</div>}

      <div className="flex-1 space-y-1.5 overflow-y-auto rounded-lg border border-line bg-surface p-4">
        {messages.map((message) => {
          const mine = message.senderId === user?.id
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] px-3 py-2.5 text-[15px] leading-[21px] ${
                  mine
                    ? 'rounded-lg rounded-br-[4px] bg-inverse text-on-inverse'
                    : 'rounded-lg rounded-bl-[4px] bg-surface-sunk text-ink'
                }`}
              >
                {message.content}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
        <input
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Escreva uma mensagem..."
          className="h-11 flex-1 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1"
        />
        <button type="submit" className="h-11 rounded-md bg-brand px-5 font-semibold text-on-brand transition hover:bg-brand-strong">
          Enviar
        </button>
      </form>
    </div>
  )
}
