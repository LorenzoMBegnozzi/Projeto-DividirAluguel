import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { MapPin } from 'lucide-react'
import AnimatedNumber from './AnimatedNumber'
import { habits } from './content'
import type { HabitId } from './content'
import { INITIAL_HABITS, moves, nextDemoHabit, rank } from './compatDemoText'
import type { Habits } from './compatDemoText'
import { prefersReducedMotion } from './motion'

// "Experimente": a pessoa liga/desliga hábitos e os anúncios de EXEMPLO se reordenam pela
// compatibilidade. A reordenação usa FLIP: mede onde cada card estava, deixa o React mudar a
// ordem e anima do lugar antigo até o novo (só transform, então roda no compositor).
//
// Demonstração automática: com a seção visível e a aba ativa, um cursor falso (aria-hidden)
// toca um hábito a cada 2,5 s seguindo um roteiro (compatDemoText.ts), sem legenda nem botão. Passar o mouse, focar
// ou tocar num hábito para a demo na hora; ela volta 8 s depois da última interação, a partir
// do estado atual. Com prefers-reduced-motion não há demo nem cursor.

const tier = (s: number) => (s >= 75 ? 'is-high' : s >= 50 ? 'is-mid' : 'is-low')
const STEP_MS = 2500
const RESUME_MS = 8000

type Source = 'demo' | 'user'

export default function CompatDemo() {
  const [reduced] = useState(prefersReducedMotion)
  const [me, setMe] = useState<Habits>(INITIAL_HABITS)
  const meRef = useRef(me)
  const [moveMap, setMoveMap] = useState<Record<string, 'up' | 'down' | 'same'>>({})
  const [flash, setFlash] = useState(0)                 // alterna 0/1 para reiniciar as animações de CSS
  const [live, setLive] = useState<Source | null>(null)

  // quem pode rodar a demo
  const [visible, setVisible] = useState(false)
  const [tabOn, setTabOn] = useState(() => !document.hidden)
  const [hold, setHold] = useState(false)               // pessoa mexendo (ou mexeu há < 8 s)
  const running = !reduced && visible && tabOn && !hold

  // cursor falso
  // `snap`: reposiciona sem transição (o cursor reaparece perto do próximo hábito em vez de
  // atravessar os outros por cima do texto)
  const [cursor, setCursor] = useState({ x: 0, y: 0, on: false, snap: false })
  const [press, setPress] = useState<{ id: HabitId | null; n: number }>({ id: null, n: 0 })

  const rootRef = useRef<HTMLDivElement>(null)
  const chipsRef = useRef<HTMLDivElement>(null)
  const chipEls = useRef(new Map<HabitId, HTMLButtonElement>())
  const cards = useRef(new Map<string, HTMLElement>())
  const before = useRef(new Map<string, DOMRect>())
  const step = useRef(0)

  const ranked = rank(me)

  const apply = useCallback((habit: HabitId, source: Source) => {
    before.current = new Map([...cards.current].map(([k, el]) => [k, el.getBoundingClientRect()]))
    const prev = meRef.current
    const next = { ...prev, [habit]: !prev[habit] }
    meRef.current = next
    setMe(next)
    setMoveMap(moves(prev, next))
    setFlash((f) => 1 - f)
    setLive(source)
  }, [])

  // FLIP: anima cada cartão do lugar antigo até o novo
  useLayoutEffect(() => {
    if (!before.current.size || reduced) { before.current.clear(); return }
    for (const [id, el] of cards.current) {
      const old = before.current.get(id)
      if (!old) continue
      const now = el.getBoundingClientRect()
      const dx = old.left - now.left, dy = old.top - now.top
      if (dx || dy) el.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration: 650, easing: 'cubic-bezier(.2,.8,.2,1)' })
    }
    before.current.clear()
  })

  // só roda com a seção na tela e a aba ativa
  useEffect(() => {
    // sem IntersectionObserver a demo automática simplesmente não liga (a seção funciona no clique)
    if (reduced || !rootRef.current || !('IntersectionObserver' in window)) return
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 })
    io.observe(rootRef.current)
    const onVis = () => setTabOn(!document.hidden)
    document.addEventListener('visibilitychange', onVis)
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', onVis) }
  }, [reduced])

  // o roteiro, a cada 2,5 s: o cursor surge perto do hábito (embaixo à direita), desliza até o
  // canto dele, "clica" e o hábito muda; depois some. Nunca passa por cima do texto dos chips.
  useEffect(() => {
    if (!running) return
    const timers: number[] = []
    const at = (ms: number, fn: () => void) => timers.push(window.setTimeout(fn, ms))
    const chipPoint = (id: HabitId) => {
      const el = chipEls.current.get(id)
      if (!el) return null
      // ponta do cursor no padding de baixo à direita do chip (o texto fica mais acima e à esquerda)
      return { x: el.offsetLeft + el.offsetWidth - 12, y: el.offsetTop + el.offsetHeight - 8 }
    }
    const run = (delay: number) => {
      const { habit, next } = nextDemoHabit(step.current, meRef.current)
      at(delay, () => {
        const pt = chipPoint(habit)
        if (pt) setCursor({ x: pt.x + 14, y: pt.y + 12, on: false, snap: true })
      })
      at(delay + 40, () => {
        const pt = chipPoint(habit)
        if (pt) setCursor({ ...pt, on: true, snap: false })
      })
      at(delay + 620, () => setPress((p) => ({ id: habit, n: p.n + 1 })))
      at(delay + 740, () => { step.current = next; apply(habit, 'demo') })
      at(delay + 1000, () => setPress((p) => ({ ...p, id: null })))
      at(delay + 1500, () => setCursor((c) => ({ ...c, on: false })))
      at(delay + STEP_MS, () => run(0))
    }
    run(400)
    return () => { timers.forEach(clearTimeout); setCursor((c) => ({ ...c, on: false })); setPress((p) => ({ ...p, id: null })) }
  }, [running, apply])

  // a pessoa assume: mouse em cima, foco ou toque param a demo na hora; volta 8 s depois
  const hovering = useRef(false), focusing = useRef(false), resumeTimer = useRef(0)
  const takeOver = () => { window.clearTimeout(resumeTimer.current); setHold(true) }
  const scheduleResume = () => {
    window.clearTimeout(resumeTimer.current)
    if (hovering.current || focusing.current) return
    resumeTimer.current = window.setTimeout(() => setHold(false), RESUME_MS)
  }
  useEffect(() => () => window.clearTimeout(resumeTimer.current), [])

  function toggleByUser(id: HabitId) {
    takeOver()
    apply(id, 'user')
    scheduleResume()
  }

  const showControls = !reduced

  return (
    <div ref={rootRef} className="grid grid-cols-1 gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
      <div className="reveal">
        <p className="landing-kicker mb-3">experimente</p>
        <h2 className="landing-h2 mb-4">Mude um hábito e veja a lista se reorganizar</h2>
        <p className="mb-8 max-w-md text-ink-2">É assim que a busca funciona de verdade: quem combina mais com você aparece primeiro. Toque nos hábitos abaixo.</p>
        <div
          ref={chipsRef}
          className="relative flex flex-wrap gap-2.5"
          role="group"
          aria-label="Seus hábitos"
          onPointerEnter={() => { hovering.current = true; takeOver() }}
          onPointerLeave={() => { hovering.current = false; scheduleResume() }}
          // só foco de teclado conta como "mexendo" (clicar com o mouse também foca o botão)
          onFocus={(e) => { if ((e.target as HTMLElement).matches(':focus-visible')) { focusing.current = true; takeOver() } }}
          onBlur={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node | null)) { focusing.current = false; scheduleResume() } }}
        >
          {habits.map((h) => (
            <button
              key={h.id}
              ref={(el) => { if (el) chipEls.current.set(h.id, el); else chipEls.current.delete(h.id) }}
              type="button"
              aria-pressed={me[h.id]}
              onClick={() => toggleByUser(h.id)}
              className="habit-chip"
              data-press={press.id === h.id ? press.n % 2 : undefined}
            >
              <span className="habit-dot" aria-hidden="true" />
              {h.label}
            </button>
          ))}
          {showControls && (
            <span
              className={`demo-cursor${cursor.on && running ? ' is-on' : ''}${cursor.snap ? ' is-snap' : ''}`}
              style={{ transform: `translate3d(${cursor.x}px, ${cursor.y}px, 0)` }}
              aria-hidden="true"
            >
              {press.id && <span key={press.n} className="demo-cursor-ring" />}
              <svg viewBox="0 0 20 24" className="demo-cursor-arrow" data-press={press.id ? '' : undefined}>
                <path d="M2 1.5v18.2l4.6-4.3 3.1 7 3.2-1.4-3.1-6.9H16L2 1.5z" />
              </svg>
            </span>
          )}
        </div>

        <p className="mt-6 text-xs text-ink-3">Anúncios fictícios, só para mostrar a ideia. No app a conta usa mais hábitos.</p>
      </div>

      {/* durante a demo automática a lista não é anunciada (aria-live off); só mudanças da pessoa */}
      <ol className="reveal relative grid min-w-0 grid-cols-1 gap-3" aria-live={live === 'user' ? 'polite' : 'off'} aria-label="Anúncios ordenados por compatibilidade">
        {ranked.map((l, i) => (
          <li
            key={l.id}
            ref={(el) => { if (el) cards.current.set(l.id, el); else cards.current.delete(l.id) }}
            className={`demo-card ${tier(l.score)}${i === 0 ? ' is-top' : ''}`}
            data-move={moveMap[l.id] !== 'same' ? moveMap[l.id] : undefined}
            data-flash={flash}
          >
            <span className="demo-thumb" aria-hidden="true" data-variant={l.id} />
            <span className="min-w-0 flex-1">
              <span className="block font-bold leading-snug text-ink">{l.title}</span>
              <span className="mt-0.5 flex items-center gap-1 text-[13px] text-ink-3">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" /> Maringá · {l.price}/mês
              </span>
              <span className="mt-2 flex flex-wrap gap-1.5">
                {l.tags.map((t) => <span key={t} className="demo-tag">{t}</span>)}
              </span>
            </span>
            <span className="demo-score">
              <span className="demo-score-num">
                {moveMap[l.id] === 'up' && <span className="demo-move is-up" aria-hidden="true">↑</span>}
                {moveMap[l.id] === 'down' && <span className="demo-move is-down" aria-hidden="true">↓</span>}
                <AnimatedNumber value={l.score} />%
              </span>
              <span className="demo-bar"><span style={{ transform: `scaleX(${l.score / 100})` }} /></span>
            </span>
            {i === 0 && <span className="demo-best">combina mais</span>}
          </li>
        ))}
      </ol>
    </div>
  )
}
