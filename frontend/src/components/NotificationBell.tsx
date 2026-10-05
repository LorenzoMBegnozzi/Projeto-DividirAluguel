import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAutoAnimate } from '@formkit/auto-animate/react'
import { Bell, Heart, HeartHandshake, MessageCircle, ShieldCheck, ShieldX, Star, Users } from 'lucide-react'
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import type { AppNotification, NotificationType } from '../types'
import { Button, EmptyState } from './ui'

const notificationStyle: Record<NotificationType, { icon: typeof Bell; iconClass: string }> = {
  NOVA_MENSAGEM: { icon: MessageCircle, iconClass: 'bg-brand-tint text-brand-strong' },
  NOVA_CONVERSA: { icon: Users, iconClass: 'bg-surface-sunk text-ink-2' },
  CONVIVIO_PROPOSTO: { icon: HeartHandshake, iconClass: 'bg-mel-tint text-mel' },
  CONVIVIO_CONFIRMADO: { icon: ShieldCheck, iconClass: 'bg-leaf-tint text-leaf' },
  CONVIVIO_RECUSADO: { icon: ShieldX, iconClass: 'bg-danger-tint text-danger' },
  AVALIACAO_RECEBIDA: { icon: Star, iconClass: 'bg-mel-tint text-star' },
  NOVO_INTERESSE: { icon: Heart, iconClass: 'bg-brand-tint text-brand-strong' },
  INTERESSE_EM_COMUM: { icon: Users, iconClass: 'bg-brand-tint text-brand-strong' },
}

function timeAgo(value: string) {
  const diffMs = Date.now() - new Date(value).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'agora'
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} h`
  return `${Math.floor(hours / 24)} d`
}

export default function NotificationBell() {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement>(null)
  const [animateContainerRef] = useAutoAnimate<HTMLDivElement>()
  const [listRef] = useAutoAnimate<HTMLDivElement>()
  // animateContainerRef já é estável entre renders (useCallback interno do hook); sem o
  // useCallback aqui, essa função seria recriada a cada render e o React reinvocaria o ref
  // (null, depois o node) em todo render — o que reinicia o auto-animate em loop infinito.
  const setContainerRef = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node
      animateContainerRef(node)
    },
    [animateContainerRef],
  )
  const [open, setOpen] = useState(false)
  const [unread, setUnread] = useState(0)
  const [notifications, setNotifications] = useState<AppNotification[]>([])

  useEffect(() => {
    refreshUnread()
    const interval = setInterval(refreshUnread, 15000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function refreshUnread() {
    getUnreadCount()
      .then(setUnread)
      .catch(() => {})
  }

  function toggleOpen() {
    if (!open) {
      getNotifications()
        .then(setNotifications)
        .catch(() => {})
    }
    setOpen((prev) => !prev)
  }

  async function handleClickNotification(notification: AppNotification) {
    if (!notification.read) {
      try {
        await markNotificationRead(notification.id)
        setUnread((prev) => Math.max(0, prev - 1))
        setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n)))
      } catch {
        // segue mesmo se falhar marcar como lida
      }
    }
    setOpen(false)
    if (notification.link) {
      navigate(notification.link)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllNotificationsRead()
      setUnread(0)
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    } catch {
      // ignora falha silenciosamente, próxima abertura tenta de novo
    }
  }

  return (
    <div className="relative" ref={setContainerRef}>
      <Button variant="ghost" size="sm" square icon={Bell} onClick={toggleOpen} aria-label="Notificações">
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-micro font-bold text-on-brand ring-2 ring-surface">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 z-(--z-dropdown) mt-2 w-80 max-w-[calc(100vw-2rem)] rounded-lg border border-line bg-surface p-2 shadow-lg">
          <div className="flex items-center justify-between px-2 py-1">
            <p className="text-small font-bold text-ink">Notificações</p>
            {notifications.some((n) => !n.read) && (
              <button onClick={handleMarkAllRead} className="inline-flex min-h-9 items-center rounded-sm px-1 text-caption font-bold text-brand hover:underline focus-visible:outline-2 focus-visible:outline-focus">
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div ref={listRef} className="max-h-96 divide-y divide-line overflow-y-auto">
            {notifications.length === 0 ? (
              <EmptyState icon={Bell} title="Sem notificações por aqui." className="border-0 py-6" />
            ) : (
              notifications.map((notification) => {
                const style = notificationStyle[notification.type]
                const Icon = style.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={`relative flex w-full items-start gap-2.5 rounded-md px-3 py-3 text-left transition-colors hover:bg-surface-sunk focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus ${
                      notification.read ? '' : 'bg-brand-tint'
                    }`}
                  >
                    {!notification.read && (
                      <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand" />
                    )}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-small ${
                            notification.read ? 'font-medium text-ink-2' : 'font-semibold text-ink'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-micro text-ink-3">{timeAgo(notification.createdAt)}</span>
                      </div>
                      {notification.message && (
                        <p className="mt-0.5 line-clamp-2 text-caption text-ink-3">{notification.message}</p>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
