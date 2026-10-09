// Modo leve do 3D: aparelho fraco, pouca memória, economia de dados ou movimento reduzido.
// Nele a cena do mascote aparece sem sombra.
interface NavigatorHints {
  deviceMemory?: number
  connection?: { saveData?: boolean }
}

export function isLiteDevice(): boolean {
  const nav = navigator as Navigator & NavigatorHints
  if (nav.connection?.saveData) return true
  if (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) return true
  if (nav.hardwareConcurrency !== undefined && nav.hardwareConcurrency <= 4) return true
  return false
}

/** Espera o navegador ficar ocioso (ou até `timeout` ms) para não disputar a primeira tela. */
export function whenIdle(fn: () => void, timeout = 1500): () => void {
  if ('requestIdleCallback' in window) {
    const id = window.requestIdleCallback(fn, { timeout })
    return () => window.cancelIdleCallback(id)
  }
  const id = setTimeout(fn, 300)
  return () => clearTimeout(id)
}
