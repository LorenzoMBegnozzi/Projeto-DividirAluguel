import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, HeartHandshake, MessageCircle, ShieldCheck, ShieldX, Star, Users } from 'lucide-react'
import {
  getNotifications,
  getUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
} from '../api/notifications'
import type { AppNotification, NotificationType } from '../types'

const notificationStyle: Record<NotificationType, { icon: typeof Bell; iconClass: string }> = {
  NOVA_MENSAGEM: { icon: MessageCircle, iconClass: 'bg-blue-100 text-blue-600' },
  NOVA_CONVERSA: { icon: Users, iconClass: 'bg-violet-100 text-violet-600' },
  CONVIVIO_PROPOSTO: { icon: HeartHandshake, iconClass: 'bg-amber-100 text-amber-600' },
  CONVIVIO_CONFIRMADO: { icon: ShieldCheck, iconClass: 'bg-emerald-100 text-emerald-600' },
  CONVIVIO_RECUSADO: { icon: ShieldX, iconClass: 'bg-rose-100 text-rose-600' },
  AVALIACAO_RECEBIDA: { icon: Star, iconClass: 'bg-yellow-100 text-yellow-600' },
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
    <div className="relative" ref={containerRef}>
      <button
        onClick={toggleOpen}
        className="relative rounded-lg p-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
        aria-label="Notificações"
      >
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-30 mt-2 w-80 rounded-2xl bg-white p-2 shadow-xl ring-1 ring-black/5">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-sm font-semibold text-zinc-700">Notificações</p>
            {notifications.some((n) => !n.read) && (
              <button onClick={handleMarkAllRead} className="text-xs font-medium text-brand-600 hover:underline">
                Marcar todas como lidas
              </button>
            )}
          </div>

          <div className="max-h-96 divide-y divide-zinc-100 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-2 py-6 text-center text-sm text-zinc-400">Sem notificações por aqui.</p>
            ) : (
              notifications.map((notification) => {
                const style = notificationStyle[notification.type]
                const Icon = style.icon
                return (
                  <button
                    key={notification.id}
                    onClick={() => handleClickNotification(notification)}
                    className={`relative flex w-full items-start gap-2.5 px-3 py-3 text-left transition hover:bg-zinc-50 ${
                      notification.read ? '' : 'bg-brand-50/60'
                    }`}
                  >
                    {!notification.read && (
                      <span className="absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-brand-600" />
                    )}
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${style.iconClass}`}>
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`truncate text-sm ${
                            notification.read ? 'font-medium text-zinc-600' : 'font-semibold text-zinc-800'
                          }`}
                        >
                          {notification.title}
                        </p>
                        <span className="shrink-0 text-[11px] text-zinc-400">{timeAgo(notification.createdAt)}</span>
                      </div>
                      {notification.message && (
                        <p className="mt-0.5 line-clamp-2 text-xs text-zinc-500">{notification.message}</p>
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
