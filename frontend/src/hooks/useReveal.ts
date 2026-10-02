import { useCallback, useRef } from 'react'

/**
 * Marca os filhos com `.reveal` como visíveis quando o contêiner entra na tela
 * (uma vez só). A cascata vem do `--i` de cada filho (ver pages/home.css).
 *
 * Devolve um *callback ref*: funciona mesmo quando o elemento só aparece depois
 * (ex.: a página mostra "Carregando…" antes), o que um useEffect([]) perderia.
 */
export function useReveal<T extends HTMLElement>() {
  const observer = useRef<IntersectionObserver | null>(null)
  return useCallback((el: T | null) => {
    observer.current?.disconnect()
    observer.current = null
    if (!el) return
    const show = () => el.querySelectorAll('.reveal').forEach((c) => c.classList.add('is-visible'))
    if (!('IntersectionObserver' in window)) { show(); return }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { show(); io.disconnect() }
    }, { threshold: 0.15 })
    io.observe(el)
    observer.current = io
  }, [])
}
