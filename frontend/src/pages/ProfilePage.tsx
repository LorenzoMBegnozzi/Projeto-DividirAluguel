import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { removePhoto, updateProfile, uploadPhoto } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { ChipMultiPicker, ChipPicker } from '../components/ChipPicker'
import BlockedUsersSection from '../components/BlockedUsersSection'
import Avatar from '../components/Avatar'
import {
  allergyTagOptions,
  dietOptions,
  drinkingHabitOptions,
  petPreferenceOptions,
  smokingHabitOptions,
} from '../constants/profileOptions'
import type { AllergyTag, Diet, DrinkingHabit, PetPreference, Routine, SmokingHabit } from '../types'

export default function ProfilePage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()
  const isEstabelecimento = user?.role === 'ADVERTISER' && user.advertiserKind === 'ESTABELECIMENTO'

  const [bio, setBio] = useState(user?.bio ?? '')
  const [occupation, setOccupation] = useState(user?.occupation ?? '')
  const [smokingHabit, setSmokingHabit] = useState<SmokingHabit | null>(user?.smokingHabit ?? null)
  const [drinkingHabit, setDrinkingHabit] = useState<DrinkingHabit | null>(user?.drinkingHabit ?? null)
  const [diet, setDiet] = useState<Diet | null>(user?.diet ?? null)
  const [petPreferences, setPetPreferences] = useState<PetPreference[]>(user?.petPreferences ?? [])
  const [allergyTags, setAllergyTags] = useState<AllergyTag[]>(user?.allergyTags ?? [])
  const [allergyOther, setAllergyOther] = useState(user?.allergyOther ?? '')
  const [musicTaste, setMusicTaste] = useState(user?.musicTaste ?? '')
  const [routine, setRoutine] = useState<Routine | null>(user?.routine ?? null)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [photoLoading, setPhotoLoading] = useState(false)

  async function handlePhotoChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setPhotoError(null)
    setPhotoLoading(true)
    try {
      await uploadPhoto(file)
      setPhotoPreview(URL.createObjectURL(file))
      await refreshUser()
    } catch (err) {
      setPhotoError(apiErrorMessage(err, 'Não foi possível enviar a foto'))
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handleRemovePhoto() {
    setPhotoError(null)
    setPhotoLoading(true)
    try {
      await removePhoto()
      setPhotoPreview(null)
      await refreshUser()
    } catch (err) {
      setPhotoError(apiErrorMessage(err, 'Não foi possível remover a foto'))
    } finally {
      setPhotoLoading(false)
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSaved(false)
    setLoading(true)
    try {
      await updateProfile({
        smokingHabit,
        drinkingHabit,
        diet,
        petPreferences,
        allergyTags,
        allergyOther,
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
      <h1 className="mb-1 text-2xl font-bold text-zinc-800">{isEstabelecimento ? 'Meus dados' : 'Meu perfil'}</h1>
      <p className="mb-6 text-sm text-zinc-500">
        {isEstabelecimento
          ? 'Essas informações aparecem para quem entrar em contato sobre seus imóveis.'
          : 'Essas informações ajudam a encontrar pessoas com quem você vai combinar bem na convivência.'}
      </p>

      <div className="mb-6 flex items-center gap-4 rounded-2xl bg-white p-6 shadow-sm">
        <Avatar photoUrl={photoPreview ?? user?.photoUrl} name={user?.name ?? ''} size={72} />
        <div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-600 transition hover:border-brand-300 disabled:opacity-60"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {photoLoading ? 'Enviando...' : 'Trocar foto'}
            </button>
            {(photoPreview ?? user?.photoUrl) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoLoading}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-400 transition hover:border-red-300 hover:text-red-600 disabled:opacity-60"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Remover
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <p className="mt-1 text-xs text-zinc-400">JPEG, PNG ou WEBP, até 3 MB.</p>
          {photoError && <p className="mt-1 text-xs text-red-600">{photoError}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-2xl bg-white p-6 shadow-sm">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {isEstabelecimento ? 'Empresa / imobiliária' : 'Curso / faculdade'}
          </label>
          <input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder={isEstabelecimento ? 'Ex.: Imobiliária Maringá' : 'Ex.: Engenharia Civil - UEM'}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {isEstabelecimento ? 'Sobre' : 'Sobre mim'}
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            placeholder={
              isEstabelecimento
                ? 'Conte um pouco sobre você ou sua imobiliária...'
                : 'Conte um pouco sobre você, sua rotina, o que procura em quem vai dividir moradia...'
            }
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
          />
        </div>

        {!isEstabelecimento && (
          <>
            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Você fuma?</p>
              <ChipPicker options={smokingHabitOptions} value={smokingHabit} onChange={setSmokingHabit} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Bebida</p>
              <ChipPicker options={drinkingHabitOptions} value={drinkingHabit} onChange={setDrinkingHabit} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Alimentação</p>
              <ChipPicker options={dietOptions} value={diet} onChange={setDiet} />
            </div>

            <div>
              <p className="mb-2 text-sm font-medium text-zinc-700">Pets</p>
              <ChipMultiPicker options={petPreferenceOptions} values={petPreferences} onChange={setPetPreferences} />
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
              <p className="mb-2 text-sm font-medium text-zinc-700">Alergias</p>
              <ChipMultiPicker options={allergyTagOptions} values={allergyTags} onChange={setAllergyTags} />
              {allergyTags.includes('OUTRO') && (
                <input
                  value={allergyOther}
                  onChange={(e) => setAllergyOther(e.target.value)}
                  placeholder="Qual?"
                  className="mt-2 w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
                />
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-zinc-700">Tipos de música que curte</label>
              <input
                value={musicTaste}
                onChange={(e) => setMusicTaste(e.target.value)}
                placeholder="Ex.: sertanejo, rock, funk, mpb"
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 outline-none focus:border-brand-500"
              />
              <p className="mt-1 text-xs text-zinc-400">
                Separe por vírgula — usamos isso para calcular compatibilidade.
              </p>
            </div>
          </>
        )}

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

      <BlockedUsersSection />
    </div>
  )
}
