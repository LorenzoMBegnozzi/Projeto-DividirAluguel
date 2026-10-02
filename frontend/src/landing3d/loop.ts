// Um único requestAnimationFrame para todo o 3D da landing.
// Eventos só ESCREVEM no estado; leituras/escritas no DOM acontecem no frame.
// Nada aqui lê layout (getBoundingClientRect): sem reflow forçado por frame.

export type FrameFn = (now: number, dt: number) => void

const subscribers = new Set<FrameFn>()
let running = false
let rafId = 0
let last = 0

export const pointer = {
  x: 0, y: 0,                 // normalizado -1..1 (relativo à viewport)
  clientX: -9999, clientY: -9999,
  active: false,              // false em touch ou com o mouse fora da janela
}

function tick(now: number) {
  if (!running) return
  const dt = Math.min((now - last) / 1000, 0.05)
  last = now
  for (const fn of subscribers) fn(now, dt)
  rafId = requestAnimationFrame(tick)
}

export function setRunning(value: boolean) {
  if (value === running) return
  running = value
  if (running) {
    last = performance.now()
    rafId = requestAnimationFrame(tick)
  } else {
    cancelAnimationFrame(rafId)
  }
}

function onPointerMove(e: PointerEvent) {
  if (e.pointerType !== 'mouse') return
  pointer.clientX = e.clientX
  pointer.clientY = e.clientY
  pointer.x = (e.clientX / innerWidth) * 2 - 1
  pointer.y = (e.clientY / innerHeight) * 2 - 1
  pointer.active = true
}
function onPointerLeave() {
  pointer.active = false
  pointer.clientX = pointer.clientY = -9999
}

/** Inscreve no frame. Liga os listeners no primeiro inscrito e desliga no último. */
export function onFrame(fn: FrameFn): () => void {
  if (subscribers.size === 0) {
    addEventListener('pointermove', onPointerMove, { passive: true })
    document.documentElement.addEventListener('pointerleave', onPointerLeave)
    setRunning(true)
  }
  subscribers.add(fn)
  return () => {
    subscribers.delete(fn)
    if (subscribers.size === 0) {
      removeEventListener('pointermove', onPointerMove)
      document.documentElement.removeEventListener('pointerleave', onPointerLeave)
      setRunning(false)
    }
  }
}

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** lerp independente de FPS: `rate` ≈ fração por frame a 60 fps */
export const damp = (a: number, b: number, rate: number, dt: number) => lerp(a, b, 1 - Math.pow(1 - rate, dt * 60))
