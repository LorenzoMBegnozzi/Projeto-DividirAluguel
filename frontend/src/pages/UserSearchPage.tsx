import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search } from 'lucide-react'
import { searchUsers } from '../api/profile'
import { getUserRatingsSummary } from '../api/rating'
import { apiErrorMessage } from '../api/client'
import { useAuth } from '../context/AuthContext'
import StarRating from '../components/StarRating'
import Avatar from '../components/Avatar'
import type { AvaliacaoResumo, UserProfile } from '../types'

export default function UserSearchPage() {
  const navigate = useNavigate()
  const { user: currentUser } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<UserProfile[]>([])
  const [summaries, setSummaries] = useState<Record<number, AvaliacaoResumo>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()
    if (trimmed.length < 2) {
      setResults([])
      setSearched(false)
      return
    }
    setLoading(true)
    setError(null)
    const timeout = setTimeout(() => {
      searchUsers(trimmed)
        .then((data) => {
          setResults(data)
          setSearched(true)
          Promise.all(
            data.map((person) =>
              getUserRatingsSummary(person.id)
                .then((summary) => [person.id, summary] as const)
                .catch(() => [person.id, { total: 0, mediaPontualidade: 0, mediaConvivencia: 0 }] as const)
            )
          ).then((entries) => setSummaries(Object.fromEntries(entries)))
        })
        .catch((err) => setError(apiErrorMessage(err, 'Não foi possível buscar usuários')))
        .finally(() => setLoading(false))
    }, 300)
    return () => clearTimeout(timeout)
  }, [query])

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Pesquisar pessoas</h1>
      <p className="mb-4 text-sm text-zinc-500">
        Encontre alguém pelo nome para ver o perfil, registrar um convívio ou avaliar.
      </p>

      <div className="mb-6 flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2 shadow-sm">
        <Search className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Digite um nome..."
          className="w-full text-sm outline-none"
          autoFocus
        />
      </div>

      {error && <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      {loading ? (
        <div className="p-8 text-center text-zinc-400">Buscando...</div>
      ) : query.trim().length < 2 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Digite pelo menos 2 letras para buscar.
        </p>
      ) : searched && results.length === 0 ? (
        <p className="rounded-2xl bg-white p-8 text-center text-sm text-zinc-400 shadow-sm">
          Nenhuma pessoa encontrada com esse nome.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {results
            .filter((person) => person.id !== currentUser?.id)
            .map((person) => {
              const summary = summaries[person.id]
              return (
                <button
                  key={person.id}
                  onClick={() => navigate(`/usuarios/${person.id}`)}
                  className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 text-left shadow-sm transition hover:shadow-md"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar photoUrl={person.photoUrl} name={person.name} size={40} />
                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-800">{person.name}</p>
                      {person.occupation && <p className="truncate text-sm text-zinc-500">{person.occupation}</p>}
                    </div>
                  </div>
                  {summary && summary.total > 0 ? (
                    <div className="flex shrink-0 flex-col items-end gap-0.5">
                      <StarRating value={(summary.mediaPontualidade + summary.mediaConvivencia) / 2} size={14} />
                      <span className="text-xs text-zinc-400">{summary.total} avaliação(ões)</span>
                    </div>
                  ) : (
                    <span className="shrink-0 text-xs text-zinc-400">Sem avaliações</span>
                  )}
                </button>
              )
            })}
        </div>
      )}
    </div>
  )
}
