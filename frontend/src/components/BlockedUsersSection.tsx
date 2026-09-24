import { useEffect, useState } from 'react'
import { getBlockedUsers, unblockUser } from '../api/moderation'
import { apiErrorMessage } from '../api/client'
import type { BlockedUser } from '../types'

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
    <div className="mx-auto mt-6 max-w-2xl rounded-lg border border-line bg-surface p-6">
      <h2 className="mb-1 text-[16px] font-bold text-ink">Usuários bloqueados</h2>
      <p className="mb-4 text-[13px] text-ink-3">Vocês não aparecem um para o outro enquanto o bloqueio existir.</p>

      {error && <p className="mb-3 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

      <div className="flex flex-col gap-2">
        {blocked.map((user) => (
          <div key={user.id} className="flex items-center justify-between rounded-md border border-line px-3 py-2">
            <span className="text-sm text-ink">{user.name}</span>
            <button onClick={() => handleUnblock(user.id)} className="text-xs font-semibold text-brand hover:underline">
              Desbloquear
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
