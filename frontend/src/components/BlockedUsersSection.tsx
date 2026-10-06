import { useEffect, useState } from 'react'
import { getBlockedUsers, unblockUser } from '../api/moderation'
import { apiErrorMessage } from '../api/client'
import type { BlockedUser } from '../types'
import { Alert, Button, Card } from './ui'

export default function BlockedUsersSection() {
  const [blocked, setBlocked] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    load()
  }, [])

  function load() {
    getBlockedUsers()
      .then(setBlocked)
      .catch((err) => setError(apiErrorMessage(err, 'Não foi possível carregar os usuários bloqueados')))
      .finally(() => setLoading(false))
  }

  async function handleUnblock(id: number) {
    try {
      await unblockUser(id)
      setBlocked((prev) => prev.filter((u) => u.id !== id))
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível desbloquear'))
    }
  }

  if (loading || blocked.length === 0) {
    return null
  }

  return (
    <Card>
      <h2 className="mb-1 text-h3 text-ink">Usuários bloqueados</h2>
      <p className="mb-4 text-caption text-ink-3">Vocês não aparecem um para o outro enquanto o bloqueio existir.</p>

      {error && <Alert tone="danger" className="mb-3">{error}</Alert>}

      <div className="flex flex-col gap-2">
        {blocked.map((user) => (
          <div key={user.id} className="flex items-center justify-between gap-3 rounded-md border border-line py-1 pl-3 pr-1">
            <span className="min-w-0 truncate text-small text-ink">{user.name}</span>
            <Button variant="ghost" size="sm" onClick={() => handleUnblock(user.id)} className="text-brand hover:text-brand-strong">
              Desbloquear
            </Button>
          </div>
        ))}
      </div>
    </Card>
  )
}
