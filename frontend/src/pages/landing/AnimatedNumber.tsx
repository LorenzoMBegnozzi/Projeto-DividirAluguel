import { useEffect, useRef, useState } from 'react'
import { prefersReducedMotion } from './motion'

/** Número que desliza do valor anterior até o atual (easeOutCubic). */
export default function AnimatedNumber({ value, duration = 700 }: { value: number; duration?: number }) {
  const [shown, setShown] = useState(value)
  const from = useRef(value)
  useEffect(() => {
    if (prefersReducedMotion()) { from.current = value; return }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration)
      const v = Math.round(a + (value - a) * (1 - (1 - p) ** 3))
      setShown(v)
      from.current = v
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])
  return (
    <>
      <span aria-hidden="true">{prefersReducedMotion() ? value : shown}</span>
      <span className="sr-only">{value}</span>
    </>
  )
}
