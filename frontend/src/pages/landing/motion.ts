// Peças de animação da landing: "entrou na tela" e "está na tela" (o número animado fica em
// AnimatedNumber.tsx).
//
// Regra: o CSS de base é sempre o estado FINAL (tudo visível). O estado escondido de entrada
// só vale quando o JS "arma" o contêiner (.reveal-armed), então sem JS, com movimento reduzido
// ou se o observer falhar, nada fica invisível.
import { useCallback, useRef } from 'react'

export const prefersReducedMotion = () =>
  typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Callback ref: marca cada `.reveal` dentro do contêiner com `is-visible` quando ele entra na
 * tela (uma vez só) e liga os loops das artes (`[data-loop]` ganha `is-playing` enquanto está
 * visível e perde quando sai, pausando o loop).
 */
export function useRevealEach() {
  const ios = useRef<IntersectionObserver[]>([])
  return useCallback((root: HTMLElement | null) => {
    ios.current.forEach((io) => io.disconnect())
    ios.current = []
    if (!root) return
    const items = root.querySelectorAll('.reveal')
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      items.forEach((el) => el.classList.add('is-visible'))
      return
    }
    root.classList.add('reveal-armed')
    const reveal = new IntersectionObserver((entries, obs) => {
      for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-visible'); obs.unobserve(e.target) }
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' })
    items.forEach((el) => reveal.observe(el))
    const loops = new IntersectionObserver((entries) => {
      for (const e of entries) e.target.classList.toggle('is-playing', e.isIntersecting)
    }, { threshold: 0.25 })
    root.querySelectorAll('[data-loop]').forEach((el) => loops.observe(el))
    ios.current = [reveal, loops]
  }, [])
}
