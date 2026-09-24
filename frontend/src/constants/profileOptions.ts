import type { AllergyTag, Diet, DrinkingHabit, Gender, GenderPreference, PetPreference, SmokingHabit } from '../types'

interface Option<T extends string> {
  value: T
  label: string
}

export const smokingHabitOptions: Option<SmokingHabit>[] = [
  { value: 'NAO_FUMO', label: 'Não fumo' },
  { value: 'FUMO_SOCIALMENTE', label: 'Fumo socialmente' },
  { value: 'FUMO_QUANDO_BEBO', label: 'Fumo quando bebo' },
  { value: 'FUMANTE', label: 'Fumante' },
  { value: 'TENTANDO_PARAR', label: 'Tentando parar' },
]

export const drinkingHabitOptions: Option<DrinkingHabit>[] = [
  { value: 'NAO_CURTO', label: 'Não curto' },
  { value: 'PAREI_DE_BEBER', label: 'Parei de beber' },
  { value: 'BEBO_COM_MODERACAO', label: 'Bebo com moderação' },
  { value: 'OCASIOES_ESPECIAIS', label: 'Em ocasiões especiais' },
  { value: 'SOCIALMENTE_FDS', label: 'Socialmente, aos fins de semana' },
  { value: 'QUASE_TODA_NOITE', label: 'Quase toda noite' },
]

export const genderOptions: Option<Gender>[] = [
  { value: 'MASCULINO', label: 'Masculino' },
  { value: 'FEMININO', label: 'Feminino' },
  { value: 'OUTRO', label: 'Outro' },
]

export const genderLabels = buildLabelMap(genderOptions)

export const genderPreferenceOptions: Option<GenderPreference>[] = [
  { value: 'QUALQUER', label: 'Tanto faz' },
  { value: 'MASCULINO', label: 'Somente homens' },
  { value: 'FEMININO', label: 'Somente mulheres' },
]

export const genderPreferenceLabels = buildLabelMap(genderPreferenceOptions)

export const dietOptions: Option<Diet>[] = [
  { value: 'VEGETARIANO', label: 'Vegetariano(a)' },
  { value: 'VEGANO', label: 'Vegano(a)' },
  { value: 'OUTRO', label: 'Outro' },
]

export const petPreferenceOptions: Option<PetPreference>[] = [
  { value: 'CACHORRO', label: 'Cachorro' },
  { value: 'GATO', label: 'Gato' },
  { value: 'REPTIL', label: 'Réptil' },
  { value: 'ANFIBIO', label: 'Anfíbio' },
  { value: 'PASSARINHO', label: 'Passarinho' },
  { value: 'PEIXE', label: 'Peixe' },
  { value: 'TARTARUGA', label: 'Tartaruga' },
  { value: 'HAMSTER', label: 'Hamster' },
  { value: 'COELHO', label: 'Coelho' },
  { value: 'OUTRO_PET', label: 'Outro bicho' },
  { value: 'NAO_TENHO_MAS_AMO', label: 'Não tenho, mas amo' },
  { value: 'NAO_TENHO_PETS', label: 'Não tenho pets' },
  { value: 'GOSTO_DE_TODOS', label: 'Gosto de todos' },
  { value: 'QUERO_UM_PET', label: 'Quero um pet' },
  { value: 'TENHO_ALERGIA_A_PETS', label: 'Tenho alergia a pets' },
]

export const allergyTagOptions: Option<AllergyTag>[] = [
  { value: 'POEIRA', label: 'Poeira' },
  { value: 'PELO_DE_ANIMAL', label: 'Pelo de animal' },
  { value: 'ALIMENTOS', label: 'Alimentos' },
  { value: 'NENHUMA', label: 'Nenhuma alergia' },
  { value: 'OUTRO', label: 'Outro' },
]

function buildLabelMap<T extends string>(options: Option<T>[]): Record<T, string> {
  return Object.fromEntries(options.map((o) => [o.value, o.label])) as Record<T, string>
}

export const smokingHabitLabels = buildLabelMap(smokingHabitOptions)
export const drinkingHabitLabels = buildLabelMap(drinkingHabitOptions)
// valores antigos não aparecem mais como botão, mas perfis já salvos ainda podem tê-los
export const dietLabels: Record<Diet, string> = {
  ...buildLabelMap(dietOptions),
  ONIVORO: 'Onívoro(a)',
  PESCETARIANO: 'Pescetariano(a)',
  FLEXITARIANO: 'Flexitariano(a)',
}
export const allergyTagLabels: Record<AllergyTag, string> = {
  ...buildLabelMap(allergyTagOptions),
  POLEN_MOFO: 'Pólen / mofo',
  PICADA_DE_INSETO: 'Picada de inseto',
  MEDICAMENTOS: 'Medicamentos',
  LATEX: 'Látex',
}

export const petPreferenceLabels: Record<PetPreference, string> = {
  ...buildLabelMap(petPreferenceOptions),
  // só existe em perfis migrados do antigo campo sim/não; não aparece como botão selecionável
  TENHO_PET_NAO_ESPECIFICADO: 'Tem pet',
}
