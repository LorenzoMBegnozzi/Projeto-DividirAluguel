// Coreografia GSAP do topo da landing (a porta dupla do logo, em 3D):
//   cena em loop:  toc (a porta treme + balão "toc") · toc · "who?" aparece · a porta abre,
//                  com a luz quente de dentro · segura · fecha · pausa · recomeça
//   troca de modo (procurar ↔ anunciar): a casinha dá um giro de 360° com blur leve,
//                  a porta fecha durante o giro e, no pico, recolore e troca o texto (onPeak);
//                  depois a cena recomeça do primeiro "toc"
// Só transform/opacity/filter-no-palco; a porta é o quadro da animação "open" do modelo
// (heroState.open, aplicado pelo loop do tilt).
import gsap from 'gsap'
import { heroState } from './tilt'
import type { Particle } from './particles'

export const OPEN_MAX = 0.999   // o quadro 1.0 volta ao 0 no model-viewer (fim = começo do loop)
const SPIN = 1.2

export interface SceneEls {
  mv: HTMLElement
  tocs: [HTMLElement, HTMLElement]
  who: HTMLElement
}

interface Options {
  stage: HTMLElement
  particles: () => Particle[]
  reducedMotion: boolean
  onPeak: () => void
  restartScene: () => void
}

const pop = { scale: 1, opacity: 1, y: 0, duration: 0.35, ease: 'back.out(2.2)' }
const hide = { opacity: 0, duration: 0.3, ease: 'power1.out' }

/** Uma batida: a porta treme e o balão "toc" do lado sobe e some. */
function knock(tl: gsap.core.Timeline, { mv }: SceneEls, toc: HTMLElement, at: number) {
  tl.to(mv, { keyframes: { x: [0, -5, 4, -2, 0], rotate: [0, -0.6, 0.5, 0] }, duration: 0.28, ease: 'none' }, at)
  tl.fromTo(toc, { scale: 0.6, opacity: 0, y: 8 }, pop, at)
  tl.to(toc, { ...hide, y: -10 }, at + 0.7)
}

/** A cena da porta, em loop. Devolve a timeline (a troca de modo pausa e recomeça). */
export function createScene(els: SceneEls, { reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) {
    // sem movimento: porta entreaberta e o "who?" parado, sem loop
    heroState.open = 0.45
    gsap.set(els.who, { scale: 1, opacity: 1, y: 0 })
    return null
  }
  gsap.set([...els.tocs, els.who], { opacity: 0 })
  heroState.open = 0
  const tl = gsap.timeline({ repeat: -1, repeatDelay: 1.6, delay: 0.5 })
  knock(tl, els, els.tocs[0], 0)
  knock(tl, els, els.tocs[1], 0.42)
  tl.fromTo(els.who, { scale: 0.5, opacity: 0, y: 10 }, { ...pop, duration: 0.5 }, 1.15)
  tl.to(heroState, { open: OPEN_MAX, duration: 1.4, ease: 'power2.inOut' }, 1.9)
  tl.to(els.who, hide, 5.2)
  tl.to(heroState, { open: 0, duration: 1.0, ease: 'power2.inOut' }, 5.3)
  return tl
}

export function createSwitcher({ stage, particles, reducedMotion, onPeak, restartScene }: Options) {
  let busy = false
  let queued: (() => void) | null = null   // clique durante a troca roda em seguida (só o último)

  function vectorsToCenter() {
    const c = stage.getBoundingClientRect()
    const cx = c.left + c.width / 2, cy = c.top + c.height / 2
    return particles().map((p) => {
      const r = p.el.getBoundingClientRect()
      return { x: cx - (r.left + r.width / 2), y: cy - (r.top + r.height / 2) }
    })
  }

  async function run() {
    if (reducedMotion) { onPeak(); return }
    const inners = particles().map((p) => p.inner)
    const toCenter = vectorsToCenter()

    const tl = gsap.timeline()
    tl.to(heroState, {
      spin: '+=360',
      duration: SPIN,
      ease: 'power3.inOut',
      onUpdate() {
        const v = Math.sin(this.progress() * Math.PI)
        stage.style.filter = v > 0.05 ? `blur(${(v * 3).toFixed(1)}px)` : ''
      },
      onComplete() {
        heroState.spin %= 360
        stage.style.filter = ''
      },
    }, 0)
    tl.to(heroState, { open: 0, duration: 0.5, ease: 'power2.out' }, 0)
    tl.call(onPeak, undefined, SPIN * 0.46)

    inners.forEach((el, i) => {
      tl.to(el, { x: toCenter[i].x, y: toCenter[i].y, scale: 0.15, opacity: 0, rotate: 160, duration: 0.5, ease: 'back.in(1.4)', force3D: true }, i * 0.03)
      tl.to(el, { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.6)', force3D: true }, 0.62 + i * 0.04)
    })
    await tl
    restartScene()
  }

  return async function switchMode(): Promise<void> {
    if (busy) { queued = () => void switchMode(); return }
    busy = true
    try { await run() } finally { busy = false }
    const next = queued
    queued = null
    next?.()
  }
}
