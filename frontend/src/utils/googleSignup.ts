import type { Role } from '../types'

/**
 * Cadastro pendente do login com Google: quem o Google confirmou, guardado até a pessoa completar
 * a tela "falta pouco" (/completar-cadastro). Fica no sessionStorage (só nesta aba): o comprovante
 * vale 30 min no servidor e não é login, então não precisa sobreviver a fechar o navegador.
 */
export interface PendingGoogleSignup {
  signupToken: string
  name: string
  email: string
  /** perfil já escolhido antes de tocar no botão (tela de cadastro), para vir marcado */
  role: Role | null
}

const KEY = 'rachaai_google_signup'   // mesmo prefixo das outras chaves do navegador

export function savePendingGoogleSignup(data: PendingGoogleSignup) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data))
  } catch {
    /* navegação privada sem storage: a tela "falta pouco" volta para o login */
  }
}

export function readPendingGoogleSignup(): PendingGoogleSignup | null {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as PendingGoogleSignup) : null
  } catch {
    return null
  }
}

export function clearPendingGoogleSignup() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    /* nada a limpar */
  }
}
