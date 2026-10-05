import { useEffect, useState } from 'react'
import { prefersReducedMotion } from './motion'

// Palavra final do título trocando sozinha. Todas ficam empilhadas na mesma célula do grid
// (a largura é a da maior); a ativa sobe para o lugar e a anterior sai por cima.
// Leitores de tela recebem a frase inteira com todas as opções, uma vez só.
export default function RotatingWords({ words, className = '' }: { words: string[]; className?: string }) {
  const [i, setI] = useState(0)
  useEffect(() => {
    if (prefersReducedMotion()) return
    const t = setInterval(() => setI((n) => (n + 1) % words.length), 2400)
    return () => clearInterval(t)
  }, [words])

  return (
    <span className={`rotator ${className}`}>
      <span className="sr-only">{words.join(', ')}</span>
      {words.map((w, n) => (
        <span key={w} aria-hidden="true" className={`rotator-word${n === i ? ' is-on' : n === (i - 1 + words.length) % words.length ? ' is-off' : ''}`}>
          {w}
        </span>
      ))}
    </span>
  )
}
