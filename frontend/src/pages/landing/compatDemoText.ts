// Roteiro da demonstração automática do "Experimente".
import { demoListings, demoScore, habits } from './content'
import type { HabitId } from './content'

export type Habits = Record<HabitId, boolean>

export const INITIAL_HABITS: Habits = { fuma: false, pet: true, cedo: true, visitas: false }

/**
 * Um hábito por passo, ~2,5 s cada; volta ao estado inicial no fim (6 passos, todos mudam o
 * 1º ou o 2º lugar):
 *   início            Zona 7 · Centro · República · UEM
 *   − Durmo cedo      República ↑ topo
 *   + Eu fumo         Centro ↑ 2º
 *   + Durmo cedo      Centro ↑ topo
 *   + Recebo visitas  República ↑ topo
 *   − Eu fumo         Zona 7 ↑ topo
 *   − Recebo visitas  Centro ↑ 2º (= início)
 */
export const DEMO_SCRIPT: HabitId[] = ['cedo', 'fuma', 'cedo', 'visitas', 'fuma', 'visitas']

export function rank(me: Habits) {
  return demoListings
    .map((l) => ({ ...l, score: demoScore(me, l) }))
    .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id))
}

/** Próximo hábito a tocar: segue o roteiro; no fim, desfaz o que estiver diferente do início. */
export function nextDemoHabit(step: number, me: Habits): { habit: HabitId; next: number } {
  if (step < DEMO_SCRIPT.length) return { habit: DEMO_SCRIPT[step], next: step + 1 }
  const diff = habits.find((h) => me[h.id] !== INITIAL_HABITS[h.id])
  if (diff) return { habit: diff.id, next: step }
  return { habit: DEMO_SCRIPT[0], next: 1 }
}

/** Para onde cada anúncio foi: up / down / same. */
export function moves(before: Habits, after: Habits) {
  const a = rank(before).map((l) => l.id), b = rank(after).map((l) => l.id)
  return Object.fromEntries(b.map((id, i) => [id, i < a.indexOf(id) ? 'up' : i > a.indexOf(id) ? 'down' : 'same'])) as Record<string, 'up' | 'down' | 'same'>
}
