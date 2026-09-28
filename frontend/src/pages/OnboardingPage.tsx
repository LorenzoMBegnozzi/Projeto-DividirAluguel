import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Car, Motorbike } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { ChipMultiPicker, ChipPicker } from '../components/ChipPicker'
import {
  allergyTagOptions,
  ALLERGY_HINT,
  normalizeAllergyTags,
  dietOptions,
  drinkingHabitOptions,
  genderOptions,
  petPreferenceOptions,
  smokingHabitOptions,
} from '../constants/profileOptions'
import type { AllergyTag, Diet, DrinkingHabit, Gender, PetPreference, SmokingHabit } from '../types'

const inputClass =
  'h-11 rounded-md border border-line-strong bg-surface px-3 text-ink outline-none placeholder:text-ink-3 hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1'

interface Step {
  title: string
  subtitle: string
  isValid: () => boolean
  render: () => ReactNode
}

export default function OnboardingPage() {
  const { user, refreshUser } = useAuth()
  const navigate = useNavigate()

  const [step, setStep] = useState(0)
  const [gender, setGender] = useState<Gender | null>(null)
  const [smokingHabit, setSmokingHabit] = useState<SmokingHabit | null>(null)
  const [drinkingHabit, setDrinkingHabit] = useState<DrinkingHabit | null>(null)
  const [diet, setDiet] = useState<Diet | null>(null)
  const [dietOther, setDietOther] = useState('')
  const [petPreferences, setPetPreferences] = useState<PetPreference[]>([])
  const [allergyTags, setAllergyTags] = useState<AllergyTag[]>([])
  const [allergyOther, setAllergyOther] = useState('')
  const [needsCarParking, setNeedsCarParking] = useState<boolean | null>(null)
  const [needsMotorcycleParking, setNeedsMotorcycleParking] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const steps: Step[] = [
    {
      title: 'Qual é o seu sexo?',
      subtitle: 'Usamos para mostrar vagas feitas para o seu sexo. Depois de salvo, não dá para trocar.',
      isValid: () => !!gender,
      render: () => <ChipPicker options={genderOptions} value={gender} onChange={setGender} />,
    },
    {
      title: 'Você fuma?',
      subtitle: 'Ajuda a encontrar gente com hábitos parecidos com os seus.',
      isValid: () => !!smokingHabit,
      render: () => <ChipPicker options={smokingHabitOptions} value={smokingHabit} onChange={setSmokingHabit} />,
    },
    {
      title: 'E bebida?',
      subtitle: '',
      isValid: () => !!drinkingHabit,
      render: () => <ChipPicker options={drinkingHabitOptions} value={drinkingHabit} onChange={setDrinkingHabit} />,
    },
    {
      title: 'Como é sua alimentação?',
      subtitle: '',
      isValid: () => !!diet && (diet !== 'OUTRO' || dietOther.trim() !== ''),
      render: () => (
        <>
          <ChipPicker options={dietOptions} value={diet} onChange={setDiet} />
          {diet === 'OUTRO' && (
            <input
              autoFocus
              value={dietOther}
              onChange={(e) => setDietOther(e.target.value)}
              maxLength={160}
              placeholder="Qual?"
              className={`mt-3 ${inputClass}`}
            />
          )}
        </>
      ),
    },
    {
      title: 'E os pets?',
      subtitle: 'Escolha quantas opções fizerem sentido.',
      isValid: () => petPreferences.length > 0,
      render: () => <ChipMultiPicker options={petPreferenceOptions} values={petPreferences} onChange={setPetPreferences} />,
    },
    {
      title: 'Tem alguma alergia?',
      subtitle: 'Escolha quantas fizerem sentido, "Nenhuma alergia" ou "Prefiro não informar".',
      isValid: () => allergyTags.length > 0 && (!allergyTags.includes('OUTRO') || allergyOther.trim() !== ''),
      render: () => (
        <>
          <ChipMultiPicker
            options={allergyTagOptions}
            values={allergyTags}
            onChange={(next) => setAllergyTags((prev) => normalizeAllergyTags(prev, next))}
          />
          <p className="mt-2 text-[13px] text-ink-3">{ALLERGY_HINT}</p>
          {allergyTags.includes('OUTRO') && (
            <input
              autoFocus
              value={allergyOther}
              onChange={(e) => setAllergyOther(e.target.value)}
              placeholder="Qual?"
              className={`mt-3 ${inputClass}`}
            />
          )}
        </>
      ),
    },
    {
      title: 'Precisa de vaga de garagem?',
      subtitle: 'Dá para marcar carro e moto juntos.',
      isValid: () => needsCarParking !== null,
      render: () => {
        const options = [
          { key: 'car', label: 'Carro', icon: Car, active: needsCarParking === true },
          { key: 'moto', label: 'Moto', icon: Motorbike, active: needsMotorcycleParking === true },
          {
            key: 'none',
            label: 'Não preciso',
            icon: Ban,
            active: needsCarParking === false && needsMotorcycleParking === false,
          },
        ] as const
        return (
          <div className="flex flex-wrap gap-2">
            {options.map(({ key, label, icon: Icon, active }) => (
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
        )
      },
    },
  ]

  const current = steps[step]
  const isLastStep = step === steps.length - 1

  async function handleContinue() {
    if (!current.isValid()) return
    setError(null)

    if (!isLastStep) {
      setStep((s) => s + 1)
      return
    }

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
        bio: '',
        occupation: '',
      })
      await refreshUser()
      navigate(user?.renter ? '/browse' : '/anuncio')
    } catch (err) {
      setError(apiErrorMessage(err, 'Não foi possível salvar o perfil'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-paper px-4 py-8">
      <div className="w-full max-w-md rounded-lg border border-line bg-surface p-8">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="mb-3 inline-flex items-center gap-1 text-sm text-ink-3 hover:text-ink"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            voltar
          </button>
        )}

        <p className="mb-1 text-[13px] font-semibold text-brand">
          Passo {step + 1} de {steps.length}
        </p>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h1 className="mb-1 text-2xl font-extrabold tracking-tight text-ink">{current.title}</h1>
        {current.subtitle && <p className="mb-6 text-sm text-ink-3">{current.subtitle}</p>}
        {!current.subtitle && <div className="mb-6" />}

        <div className="mb-6">{current.render()}</div>

        {error && <p className="mb-4 rounded-md bg-danger-tint px-3 py-2 text-sm text-danger">{error}</p>}

        <button
          type="button"
          onClick={handleContinue}
          disabled={!current.isValid() || loading}
          className="h-[46px] w-full rounded-md bg-brand font-semibold text-on-brand transition hover:bg-brand-strong disabled:opacity-40"
        >
          {loading ? 'Salvando…' : isLastStep ? 'Concluir' : 'Continuar'}
        </button>
      </div>
    </div>
  )
}
