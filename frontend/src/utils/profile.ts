import type { UserProfile } from '../types'

/**
 * Campos obrigatórios no primeiro preenchimento do perfil (ver OnboardingPage).
 * Depois de completo uma vez, editar fica livre — não volta a exigir nada.
 */
export function isProfileComplete(user: UserProfile): boolean {
  return (
    !!user.gender &&
    !!user.smokingHabit &&
    !!user.drinkingHabit &&
    !!user.diet &&
    user.petPreferences.length > 0 &&
    user.allergyTags.length > 0 &&
    user.needsCarParking !== null
  )
}
