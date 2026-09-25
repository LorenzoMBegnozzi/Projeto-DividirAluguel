import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Ban, Camera, Car, Lock, LogOut, Motorbike, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { removePhoto, updateProfile, uploadPhoto } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { ChipMultiPicker, ChipPicker } from '../components/ChipPicker'
import BlockedUsersSection from '../components/BlockedUsersSection'
import ConviviosSection from '../components/ConviviosSection'
import CapabilitiesSection from '../components/CapabilitiesSection'
import Avatar from '../components/Avatar'
import {
  allergyTagOptions,
  dietOptions,
  genderLabels,
  genderOptions,
  musicGenreOptions,
  parseMusicTaste,
  serializeMusicTaste,
  drinkingHabitOptions,
  petPreferenceOptions,
  smokingHabitOptions,
} from '../constants/profileOptions'
import type { AllergyTag, Diet, DrinkingHabit, Gender, PetPreference, Routine, SmokingHabit } from '../types'

// Valor interno do chip "Outro" do gosto musical (nunca é salvo).
const MUSIC_OTHER = '__OUTRO__'

const inputClass =
  'w-full rounded-md border border-line-strong bg-surface px-3 py-2.5 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const isEstabelecimento = user?.advertiser && user.advertiserKind === 'ESTABELECIMENTO'

  const [bio, setBio] = useState(user?.bio ?? '')
  const [occupation, setOccupation] = useState(user?.occupation ?? '')
  const [smokingHabit, setSmokingHabit] = useState<SmokingHabit | null>(user?.smokingHabit ?? null)
  const [drinkingHabit, setDrinkingHabit] = useState<DrinkingHabit | null>(user?.drinkingHabit ?? null)
  const [gender, setGender] = useState<Gender | null>(user?.gender ?? null)
  // Depois de salvo uma vez o sexo fica travado (o backend também recusa a troca).
  const savedGender = user?.gender ?? null
  const [diet, setDiet] = useState<Diet | null>(user?.diet ?? null)
  const [dietOther, setDietOther] = useState(user?.dietOther ?? '')
  const [petPreferences, setPetPreferences] = useState<PetPreference[]>(user?.petPreferences ?? [])
  const [allergyTags, setAllergyTags] = useState<AllergyTag[]>(user?.allergyTags ?? [])
  const [allergyOther, setAllergyOther] = useState(user?.allergyOther ?? '')
  const [initialMusic] = useState(() => parseMusicTaste(user?.musicTaste))
  const [musicGenres, setMusicGenres] = useState<string[]>(initialMusic.genres)
  const [musicOther, setMusicOther] = useState(initialMusic.other)
  const [showMusicOther, setShowMusicOther] = useState(initialMusic.other !== '')
  const [routine, setRoutine] = useState<Routine | null>(user?.routine ?? null)
  const [needsCarParking, setNeedsCarParking] = useState<boolean | null>(user?.needsCarParking ?? null)
  const [needsMotorcycleParking, setNeedsMotorcycleParking] = useState<boolean | null>(user?.needsMotorcycleParking ?? null)
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
        gender,
        diet,
        dietOther,
        petPreferences,
        allergyTags,
        allergyOther,
        musicTaste: serializeMusicTaste(musicGenres, showMusicOther ? musicOther : ''),
        routine,
        needsCarParking,
        needsMotorcycleParking,
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
      <h1 className="mb-1 text-[28px] font-extrabold tracking-tight text-ink">
        {isEstabelecimento ? 'Meus dados' : 'Meu perfil'}
      </h1>
      <p className="mb-6 text-sm text-ink-3">
        {isEstabelecimento
          ? 'Essas informações aparecem para quem entrar em contato sobre seus imóveis.'
          : 'Essas informações ajudam a encontrar pessoas com quem você vai combinar bem na convivência.'}
      </p>

      <div className="mb-6 flex flex-col items-center gap-4 rounded-lg border border-line bg-surface p-6 text-center sm:flex-row sm:text-left">
        <Avatar photoUrl={photoPreview ?? user?.photoUrl} name={user?.name ?? ''} size={72} />
        <div>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
              className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong px-3 text-sm font-semibold text-ink-2 transition hover:border-ink hover:text-ink disabled:opacity-60"
            >
              <Camera className="h-4 w-4" aria-hidden="true" />
              {photoLoading ? 'Enviando…' : 'Trocar foto'}
            </button>
            {(photoPreview ?? user?.photoUrl) && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={photoLoading}
                className="inline-flex h-[34px] items-center gap-1.5 whitespace-nowrap rounded-md border border-line-strong px-3 text-sm font-semibold text-ink-2 transition hover:border-danger hover:text-danger disabled:opacity-60"
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
          <p className="mt-1 text-[13px] text-ink-3">JPEG, PNG ou WEBP, até 3 MB.</p>
          {photoError && <p className="mt-1 text-[13px] text-danger">{photoError}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6 rounded-lg border border-line bg-surface p-6">
        <div>
          <label className="mb-1 block text-[13px] font-semibold text-ink">
            {isEstabelecimento ? 'Empresa / imobiliária' : 'Curso / faculdade'}
          </label>
          <input
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            placeholder={isEstabelecimento ? 'Ex.: Imobiliária Maringá' : 'Ex.: Engenharia Civil - UEM'}
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1 block text-[13px] font-semibold text-ink">
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
            className={inputClass}
          />
        </div>

        {!isEstabelecimento && (
          <>
            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Sexo</p>
              {savedGender ? (
                <>
                  <span className="inline-flex h-[34px] items-center gap-1.5 rounded-sm border border-line-strong bg-surface-sunk px-3 text-[13px] font-semibold text-ink-2">
                    <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                    {genderLabels[savedGender]}
                  </span>
                  <p className="mt-1 text-[13px] text-ink-3">
                    Usado para mostrar vagas feitas para o seu sexo. Depois de salvo, não pode ser alterado.
                  </p>
                </>
              ) : (
                <>
                  <ChipPicker options={genderOptions} value={gender} onChange={setGender} />
                  <p className="mt-1 text-[13px] text-ink-3">
                    Usado para mostrar vagas feitas para o seu sexo. <strong className="text-ink-2">Atenção:</strong> depois de
                    salvo, não dá para trocar.
                  </p>
                </>
              )}
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Você fuma?</p>
              <ChipPicker options={smokingHabitOptions} value={smokingHabit} onChange={setSmokingHabit} />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Bebida</p>
              <ChipPicker options={drinkingHabitOptions} value={drinkingHabit} onChange={setDrinkingHabit} />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Alimentação</p>
              <ChipPicker options={dietOptions} value={diet} onChange={setDiet} />
              {diet === 'OUTRO' && (
                <input
                  value={dietOther}
                  onChange={(e) => setDietOther(e.target.value)}
                  maxLength={160}
                  placeholder="Qual?"
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Pets</p>
              <ChipMultiPicker options={petPreferenceOptions} values={petPreferences} onChange={setPetPreferences} />
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Rotina</p>
              <div className="inline-grid min-w-[200px] grid-flow-col auto-cols-fr gap-[3px] rounded-md border border-line-strong bg-surface p-[3px]">
                {(['DIURNO', 'NOTURNO', 'MISTO'] as Routine[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRoutine(routine === option ? null : option)}
                    className={`h-[34px] rounded-[7px] text-sm font-semibold transition ${
                      routine === option ? 'bg-inverse text-on-inverse' : 'text-ink-2 hover:bg-surface-sunk hover:text-ink'
                    }`}
                  >
                    {option === 'DIURNO' ? 'Diurna' : option === 'NOTURNO' ? 'Noturna' : 'Mista'}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Precisa de vaga de garagem?</p>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    { key: 'car', label: 'Carro', icon: Car, active: needsCarParking === true },
                    { key: 'moto', label: 'Moto', icon: Motorbike, active: needsMotorcycleParking === true },
                    {
                      key: 'none',
                      label: 'Não preciso',
                      icon: Ban,
                      active: needsCarParking === false && needsMotorcycleParking === false,
                    },
                  ] as const
                ).map(({ key, label, icon: Icon, active }) => (
                  <button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => {
                      if (key === 'none') {
                        setNeedsCarParking(active ? null : false)
                        setNeedsMotorcycleParking(active ? null : false)
                        return
                      }
                      // Carro e moto podem ser marcados juntos; desmarcar os dois volta para "não informado".
                      const car = key === 'car' ? !active : needsCarParking === true
                      const moto = key === 'moto' ? !active : needsMotorcycleParking === true
                      setNeedsCarParking(car || moto ? car : null)
                      setNeedsMotorcycleParking(car || moto ? moto : null)
                    }}
                    className={`inline-flex h-[64px] w-[96px] flex-col items-center justify-center gap-1 rounded-md border text-xs font-semibold transition ${
                      active ? 'border-inverse bg-inverse text-on-inverse' : 'border-line-strong bg-surface text-ink-2 hover:border-ink'
                    }`}
                  >
                    <Icon className="h-6 w-6" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[13px] text-ink-3">Dá para marcar carro e moto juntos.</p>
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Alergias</p>
              <ChipMultiPicker options={allergyTagOptions} values={allergyTags} onChange={setAllergyTags} />
              {allergyTags.includes('OUTRO') && (
                <input
                  value={allergyOther}
                  onChange={(e) => setAllergyOther(e.target.value)}
                  placeholder="Qual?"
                  className={`mt-2 ${inputClass}`}
                />
              )}
            </div>

            <div>
              <p className="mb-2 text-[13px] font-semibold text-ink">Tipos de música que curte</p>
              <ChipMultiPicker
                options={[...musicGenreOptions, { value: MUSIC_OTHER, label: 'Outro' }]}
                values={showMusicOther ? [...musicGenres, MUSIC_OTHER] : musicGenres}
                onChange={(values) => {
                  setShowMusicOther(values.includes(MUSIC_OTHER))
                  setMusicGenres(values.filter((v) => v !== MUSIC_OTHER))
                }}
              />
              {showMusicOther && (
                <input
                  value={musicOther}
                  onChange={(e) => setMusicOther(e.target.value)}
                  placeholder="Qual? Ex.: blues, lo-fi"
                  className={`mt-2 ${inputClass}`}
                />
              )}
              <p className="mt-1 text-[13px] text-ink-3">Escolha quantos quiser. Usamos isso para calcular compatibilidade.</p>
            </div>
          </>
        )}

        {error && <p className="rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}
        {saved && <p className="rounded-md bg-leaf-tint px-3 py-2 text-sm text-leaf">Perfil salvo!</p>}

        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => navigate('/anuncio')}
            className="text-sm font-semibold text-ink-2 hover:text-ink"
          >
            Pular por agora
          </button>
          <button
            type="submit"
            disabled={loading}
            className="h-[42px] rounded-md bg-brand px-6 font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-60"
          >
            {loading ? 'Salvando…' : 'Salvar e continuar'}
          </button>
        </div>
      </form>

      <CapabilitiesSection />
      <ConviviosSection />
      <BlockedUsersSection />

      <button
        type="button"
        onClick={() => {
          logout()
          navigate('/login')
        }}
        className="mx-auto mt-6 flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-ink-2 transition hover:bg-danger-tint hover:text-danger"
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair
      </button>
    </div>
  )
}
