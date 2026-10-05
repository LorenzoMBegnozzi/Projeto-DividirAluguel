import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, Ban, Car, Motorbike } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/profile'
import { apiErrorMessage } from '../api/client'
import { ChipMultiPicker, ChipPicker } from '../components/ChipPicker'
import { LogoLink } from '../components/Logo'
import { Alert, Button, Card, Chip, fieldClass } from '../components/ui'
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
              className={`mt-3 ${fieldClass()}`}
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
          <p className="mt-2 text-caption text-ink-3">{ALLERGY_HINT}</p>
          {allergyTags.includes('OUTRO') && (
            <input
              autoFocus
              value={allergyOther}
              onChange={(e) => setAllergyOther(e.target.value)}
              placeholder="Qual?"
              className={`mt-3 ${fieldClass()}`}
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
              <Chip
                key={key}
                pressed={active}
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
                className="h-16! w-24 flex-col justify-center gap-1! rounded-md! px-0! text-caption!"
              >
                <Icon className="size-6" aria-hidden="true" />
                {label}
              </Chip>
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-8">
      <LogoLink size="lg" className="mb-6" />
      <Card padding="lg" className="w-full max-w-md">
        {step > 0 && (
          <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setStep((s) => s - 1)} className="-ml-3 mb-3">
            voltar
          </Button>
        )}

        <p className="mb-1 text-caption font-semibold text-brand">
          Passo {step + 1} de {steps.length}
        </p>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-surface-sunk">
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${((step + 1) / steps.length) * 100}%` }}
          />
        </div>

        <h1 className="mb-1 text-h2 text-ink">{current.title}</h1>
        {current.subtitle && <p className="mb-6 text-small text-ink-3">{current.subtitle}</p>}
        {!current.subtitle && <div className="mb-6" />}

        <div className="mb-6">{current.render()}</div>

        {error && <Alert tone="danger" className="mb-4">{error}</Alert>}

        <Button size="lg" full onClick={handleContinue} disabled={!current.isValid() || loading}>
          {loading ? 'Salvando…' : isLastStep ? 'Concluir' : 'Continuar'}
        </Button>
      </Card>
    </div>
  )
}
