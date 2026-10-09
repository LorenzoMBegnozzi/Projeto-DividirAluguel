import { useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Ban, Camera, Car, Lock, LogOut, Motorbike, ShieldCheck, Trash2 } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { removePhoto, updateProfile, uploadPhoto } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { ChipMultiPicker, ChipPicker } from '../components/ChipPicker'
import BlockedUsersSection from '../components/BlockedUsersSection'
import DeleteAccountSection from '../components/DeleteAccountSection'
import LegalLinks from '../components/LegalLinks'
import ConviviosSection from '../components/ConviviosSection'
import CapabilitiesSection from '../components/CapabilitiesSection'
import Avatar from '../components/Avatar'
import { Alert, Button, Card, Columns, Input, Page, PageHeader, Textarea, cardClass, cx, fieldClass, hintClass, labelClass } from '../components/ui'
import {
  allergyTagOptions,
  ALLERGY_HINT,
  normalizeAllergyTags,
  dietOptions,
  genderLabels,
  genderOptions,
  drinkingHabitOptions,
  petPreferenceOptions,
  smokingHabitOptions,
} from '../constants/profileOptions'
import type { AllergyTag, Diet, DrinkingHabit, Gender, PetPreference, SmokingHabit } from '../types'

export default function ProfilePage() {
  const { user, refreshUser, logout } = useAuth()
  const navigate = useNavigate()
  const isEstabelecimento = user?.advertiser && user.advertiserKind === 'ESTABELECIMENTO'
  const isAdmin = !!user?.admin

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
    <Page>
      <PageHeader
        title={isAdmin ? 'Minha conta' : isEstabelecimento ? 'Meus dados' : 'Meu perfil'}
        description={isAdmin
          ? `Conta de administração (${user?.email}). Ela não aparece para os outros usuários.`
          : isEstabelecimento
          ? 'Essas informações aparecem para quem entrar em contato sobre seus imóveis.'
          : 'Essas informações ajudam a encontrar pessoas com quem você vai combinar bem na convivência.'}
      />

      {/* computador: foto, atalhos e "Sair" numa coluna fixa à esquerda; formulário e seções à direita */}
      <Columns asideWidth="md" aside={(
        <div className="flex flex-col gap-4">

      {user?.admin && (
        <Link
          to="/admin"
          className={cx(
            cardClass({ tone: 'brand', padding: 'sm' }),
            'flex items-center gap-3 text-brand-strong transition-opacity duration-(--dur-fast) hover:opacity-90',
          )}
        >
          <ShieldCheck className="size-6 shrink-0" aria-hidden="true" />
          <span>
            <span className="block font-bold">Área de administração</span>
            <span className="block text-small">Denúncias, contas e anúncios</span>
          </span>
        </Link>
      )}

      <Card className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left lg:flex-col lg:text-center">
        <Avatar photoUrl={photoPreview ?? user?.photoUrl} name={user?.name ?? ''} size={96} />
        <div>
          {user?.name && <p className="mb-3 hidden text-h3 text-ink lg:block">{user.name}</p>}
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start lg:justify-center">
            <Button
              variant="secondary"
              size="sm"
              icon={Camera}
              onClick={() => fileInputRef.current?.click()}
              disabled={photoLoading}
            >
              {photoLoading ? 'Enviando…' : 'Trocar foto'}
            </Button>
            {(photoPreview ?? user?.photoUrl) && (
              <Button
                variant="secondary"
                size="sm"
                icon={Trash2}
                onClick={handleRemovePhoto}
                disabled={photoLoading}
                className="hover:border-danger! hover:text-danger!"
              >
                Remover
              </Button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handlePhotoChange}
            className="hidden"
          />
          <p className="mt-1 text-caption text-ink-3">JPEG, PNG ou WEBP, até 3 MB.</p>
          {photoError && <p className="mt-1 text-caption text-danger">{photoError}</p>}
        </div>
      </Card>

      <Button
        variant="ghost"
        icon={LogOut}
        onClick={() => {
          logout()
          navigate('/login')
        }}
        className="mx-auto flex! bg-danger-tint! text-danger! hover:bg-danger/15! lg:mx-0"
      >
        Sair
      </Button>
      <LegalLinks />
        </div>
      )}>

      {/* Conta de admin não usa perfil de convivência, anúncios nem bloqueios: só foto e sair. */}
      {!isAdmin && (
      <div className="flex flex-col gap-6">
      <Card as="form" onSubmit={handleSubmit} className="flex flex-col gap-6">
        <Input
          label={isEstabelecimento ? 'Empresa / imobiliária' : 'Curso / faculdade'}
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          placeholder={isEstabelecimento ? 'Ex.: Imobiliária Maringá' : 'Ex.: Engenharia Civil - UEM'}
        />

        <Textarea
          label={isEstabelecimento ? 'Sobre' : 'Sobre mim'}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder={
            isEstabelecimento
              ? 'Conte um pouco sobre você ou sua imobiliária...'
              : 'Conte um pouco sobre você, sua rotina, o que procura em quem vai dividir moradia...'
          }
        />

        {!isEstabelecimento && (
          <>
            <div>
              <p className={labelClass}>Sexo</p>
              {savedGender ? (
                <>
                  <span className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-line-strong bg-surface-sunk px-3 text-caption font-semibold text-ink-2">
                    <Lock className="size-3.5" aria-hidden="true" />
                    {genderLabels[savedGender]}
                  </span>
                  <p className={hintClass}>
                    Usado para mostrar vagas feitas para o seu sexo. Depois de salvo, não pode ser alterado.
                  </p>
                </>
              ) : (
                <>
                  <ChipPicker options={genderOptions} value={gender} onChange={setGender} />
                  <p className={hintClass}>
                    Usado para mostrar vagas feitas para o seu sexo. <strong className="text-ink-2">Atenção:</strong> depois de
                    salvo, não dá para trocar.
                  </p>
                </>
              )}
            </div>

            <div>
              <p className={labelClass}>Você fuma?</p>
              <ChipPicker options={smokingHabitOptions} value={smokingHabit} onChange={setSmokingHabit} />
            </div>

            <div>
              <p className={labelClass}>Bebida</p>
              <ChipPicker options={drinkingHabitOptions} value={drinkingHabit} onChange={setDrinkingHabit} />
            </div>

            <div>
              <p className={labelClass}>Alimentação</p>
              <ChipPicker options={dietOptions} value={diet} onChange={setDiet} />
              {diet === 'OUTRO' && (
                <input
                  value={dietOther}
                  onChange={(e) => setDietOther(e.target.value)}
                  maxLength={160}
                  placeholder="Qual?"
                  className={cx(fieldClass(), 'mt-2')}
                />
              )}
            </div>

            <div>
              <p className={labelClass}>Pets</p>
              <ChipMultiPicker options={petPreferenceOptions} values={petPreferences} onChange={setPetPreferences} />
            </div>

            <div>
              <p className={labelClass}>Precisa de vaga de garagem?</p>
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
                    className={cx(
                      'inline-flex h-16 w-24 flex-col items-center justify-center gap-1 rounded-md border text-caption font-semibold transition-colors duration-(--dur-fast)',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus',
                      active ? 'border-inverse bg-inverse text-on-inverse' : 'border-field bg-surface text-ink-2 hover:border-ink',
                    )}
                  >
                    <Icon className="size-6" aria-hidden="true" />
                    {label}
                  </button>
                ))}
              </div>
              <p className={hintClass}>Dá para marcar carro e moto juntos.</p>
            </div>

            <div>
              <p className={labelClass}>Alergias</p>
              <ChipMultiPicker
                options={allergyTagOptions}
                values={allergyTags}
                onChange={(next) => setAllergyTags((prev) => normalizeAllergyTags(prev, next))}
              />
              <p className={hintClass}>{ALLERGY_HINT}</p>
              {allergyTags.includes('OUTRO') && (
                <input
                  value={allergyOther}
                  onChange={(e) => setAllergyOther(e.target.value)}
                  placeholder="Qual?"
                  className={cx(fieldClass(), 'mt-2')}
                />
              )}
            </div>
          </>
        )}

        {error && <Alert tone="danger">{error}</Alert>}
        {saved && <Alert tone="success">Perfil salvo!</Alert>}

        {/* o botão acompanha a rolagem no pé do formulário (no celular, acima da barra de baixo) */}
        <div className="pointer-events-none sticky bottom-20 z-(--z-raised) flex justify-end lg:bottom-4">
          <Button type="submit" disabled={loading} className="pointer-events-auto shadow-lg">
            {loading ? 'Salvando…' : 'Salvar'}
          </Button>
        </div>
      </Card>

      <CapabilitiesSection />
      <ConviviosSection />
      <BlockedUsersSection />
      <DeleteAccountSection />
      </div>
      )}
      </Columns>
    </Page>
  )
}
