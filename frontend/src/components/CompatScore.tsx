import { useEffect, useRef, useState } from 'react'

function tier(score: number) {
  if (score >= 75) return { num: 'text-leaf', bar: 'bg-leaf' }
  if (score >= 50) return { num: 'text-mel', bar: 'bg-mel' }
  return { num: 'text-ink-2', bar: 'bg-ink-3' }
}

const DURATION = 900 // ms
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Conta de 0 até `target` quando o elemento aparece na tela (uma vez por montagem).
 * Com "reduzir movimento" (ou sem IntersectionObserver) mostra o valor final direto.
 */
function useCountUp(target: number) {
  const ref = useRef<HTMLDivElement>(null)
  const reduce = typeof window !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [value, setValue] = useState(reduce ? target : 0)

  useEffect(() => {
    const el = ref.current
    if (reduce || !el || !('IntersectionObserver' in window)) { setValue(target); return }
    let raf = 0
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return
      io.disconnect()
      const start = performance.now()
      const step = (now: number) => {
        const t = Math.min(1, (now - start) / DURATION)
        setValue(Math.round(easeOut(t) * target))
        if (t < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, { threshold: 0.4 })
    io.observe(el)
    return () => { io.disconnect(); cancelAnimationFrame(raf) }
  }, [target, reduce])

  return { ref, value }
}

export default function CompatScore({ score }: { score: number }) {
  const { num, bar } = tier(score)
  const pct = Math.min(100, Math.max(0, score))
  const { ref, value } = useCountUp(pct)
  return (
    <div ref={ref} className="inline-grid min-w-[84px] gap-1.5 text-right">
      <span className={`font-extrabold leading-[28px] tracking-[-0.03em] tabular-nums ${num}`} style={{ fontSize: 28 }}>
        {/* leitores de tela recebem o valor final, não a contagem */}
        <span aria-hidden="true">{value}</span>
        <span className="sr-only">{pct}</span>
        <small className="text-base font-bold">%</small>
      </span>
      <span className="h-1.5 overflow-hidden rounded-sm bg-surface-sunk">
        {/* a barra cresce via transform (compositor), não via width */}
        <span
          className={`block h-full origin-left rounded-sm ${bar}`}
          style={{ width: `${pct}%`, transform: `scaleX(${pct ? value / pct : 0})` }}
        />
      </span>
      <span className="text-xs text-ink-3">compatível</span>
    </div>
  )
}
