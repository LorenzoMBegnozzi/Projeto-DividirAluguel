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

/** Para onde a pessoa vai ao entrar: admin → moderação; quem procura → busca; quem anuncia → anúncios. */
export function homePath(user: UserProfile): string {
  if (user.admin) return '/admin'
  return user.renter ? '/browse' : '/anuncio'
}

/**
 * Conta de administrador é só de moderação: não anuncia, não paga, não conversa. Fora a área
 * /admin, ela só abre o próprio perfil e as páginas que o painel linka (perfil público e anúncio).
 */
export function isAdminAllowedPath(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname === '/perfil' ||
    pathname.startsWith('/usuarios/') ||
    pathname.startsWith('/anuncios/')
  )
}
