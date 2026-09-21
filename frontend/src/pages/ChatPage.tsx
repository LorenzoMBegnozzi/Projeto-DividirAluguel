import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useParams } from 'react-router-dom'
import { getMessages, sendMessage } from '../api/discovery'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import type { Message } from '../types'

export default function ChatPage() {
  const { conversationId } = useParams()
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!conversationId) return
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
    <div className="mx-auto flex h-[calc(100vh-64px)] max-w-2xl flex-col px-4 py-4">
      {error && <div className="mb-2 rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

      <div className="flex-1 space-y-2 overflow-y-auto rounded-2xl bg-white p-4 shadow-sm">
        {messages.map((message) => {
          const mine = message.senderId === user?.id
          return (
            <div key={message.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                  mine ? 'bg-brand-600 text-white' : 'bg-zinc-100 text-zinc-800'
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
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
        />
        <button
          type="submit"
          className="rounded-lg bg-brand-600 px-5 py-2 font-semibold text-white transition hover:bg-brand-700"
        >
          Enviar
        </button>
      </form>
    </div>
  )
}
