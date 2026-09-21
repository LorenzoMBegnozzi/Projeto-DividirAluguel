import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import BoolToggle from '../components/BoolToggle'
import type { Routine } from '../types'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [bio, setBio] = useState(user?.bio ?? '')
  const [occupation, setOccupation] = useState(user?.occupation ?? '')
  const [smoker, setSmoker] = useState<boolean | null>(user?.smoker ?? null)
  const [drinksAlcohol, setDrinksAlcohol] = useState<boolean | null>(user?.drinksAlcohol ?? null)
  const [vegetarian, setVegetarian] = useState<boolean | null>(user?.vegetarian ?? null)
  const [hasPets, setHasPets] = useState<boolean | null>(user?.hasPets ?? null)
  const [likesAnimals, setLikesAnimals] = useState<boolean | null>(user?.likesAnimals ?? null)
  const [allergies, setAllergies] = useState(user?.allergies ?? '')
  const [musicTaste, setMusicTaste] = useState(user?.musicTaste ?? '')
  const [routine, setRoutine] = useState<Routine | null>(user?.routine ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      await updateProfile({
        smoker,
        drinksAlcohol,
        vegetarian,
        hasPets,
        likesAnimals,
        allergies,
        musicTaste,
        routine,
        bio,
        occupation,
      })
      await refreshUser()
      setSaved(true)
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível salvar o perfil'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">Meu perfil</h1>
      <p className="mb-6 text-sm text-zinc-500">
        Essas informações ajudam a encontrar pessoas com quem você vai combinar bem na convivência.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Curso / faculdade</label>
          <input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder="Ex.: Engenharia Civil - UEM"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Sobre mim</label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder="Conte um pouco sobre você, sua rotina, o que procura em quem vai dividir moradia..."
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <BoolToggle label="Fuma?" value={smoker} onChange={setSmoker} />
          <BoolToggle label="Bebe álcool?" value={drinksAlcohol} onChange={setDrinksAlcohol} />
          <BoolToggle label="É vegetariano(a)?" value={vegetarian} onChange={setVegetarian} />
          <BoolToggle label="Tem animal de estimação?" value={hasPets} onChange={setHasPets} />
          <BoolToggle label="Gosta de animais?" value={likesAnimals} onChange={setLikesAnimals} />
        </div>

        <div>
          <p className="mb-1 text-sm font-medium text-zinc-700">Rotina</p>
          <div className="flex gap-2">
            {(['DIURNO', 'NOTURNO', 'MISTO'] as Routine[]).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setRoutine(routine === option ? null : option)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  routine === option
                    ? 'border-brand-600 bg-brand-600 text-white'
                    : 'border-zinc-200 text-zinc-500 hover:border-brand-300'
                }`}
              >
                {option === 'DIURNO' ? 'Diurna' : option === 'NOTURNO' ? 'Noturna' : 'Mista'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Alergias</label>
          <input
            value={allergies}
            onChange={(e) => setAllergies(e.target.value)}
            placeholder="Ex.: poeira, pelo de gato"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Tipos de música que curte</label>
          <input
            value={musicTaste}
            onChange={(e) => setMusicTaste(e.target.value)}
            placeholder="Ex.: sertanejo, rock, funk, mpb"
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
          <p className="mt-1 text-xs text-zinc-400">Separe por vírgula — usamos isso para calcular compatibilidade.</p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600">Perfil salvo!</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/anuncio')}
            className="text-sm font-medium text-zinc-500 hover:text-zinc-700"
          >
            Pular por agora
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-brand-600 px-6 py-2 font-semibold text-white transition hover:bg-brand-700 disabled:opacity-60"
          >
            {loading ? 'Salvando...' : 'Salvar e continuar'}
          </button>
        </div>
      </form>
    </div>
  )
}
