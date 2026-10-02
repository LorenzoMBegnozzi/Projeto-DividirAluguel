// Coreografia GSAP da troca de modo (procurar ↔ anunciar):
//   0.00s  apartamento começa um giro de 360° com blur leve no palco
//   0.00s  os quartos se afastam (o "racha") · casinhas implodem para o centro
//  ~0.55s pico: recolore o apartamento e as casinhas, troca o texto (onPeak)
//  ~0.60s quartos voltam para a posição de repouso · casinhas explodem de volta
// Só transform/opacity/filter-no-palco; nenhuma cor de fundo é interpolada aqui
// (o fundo da landing faz crossfade de camadas em CSS).
import gsap from 'gsap'
import { heroState } from './tilt'
import type { Particle } from './particles'

export const SPLIT_REST = 0.35   // quartos levemente separados: "dois quartos"
const SPIN = 1.2

interface Options {
  stage: HTMLElement
  particles: () => Particle[]
  reducedMotion: boolean
  onPeak: () => void
}

/** Entrada: o apartamento chega inteiro e "racha" em dois quartos. */
export function intro({ reducedMotion }: { reducedMotion: boolean }) {
  if (reducedMotion) { heroState.split = SPLIT_REST; return }
  heroState.split = 0
  gsap.timeline({ delay: 0.25 })
    .to(heroState, { split: 0.7, duration: 0.7, ease: 'power3.out' })
    .to(heroState, { split: SPLIT_REST, duration: 0.8, ease: 'back.out(2)' })
}

export function createSwitcher({ stage, particles, reducedMotion, onPeak }: Options) {
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
    tl.to(heroState, { split: 1, duration: 0.55, ease: 'power2.out' }, 0)
    tl.call(onPeak, undefined, SPIN * 0.46)
    tl.to(heroState, { split: SPLIT_REST, duration: 0.75, ease: 'back.out(1.6)' }, 0.6)

    inners.forEach((el, i) => {
      tl.to(el, { x: toCenter[i].x, y: toCenter[i].y, scale: 0.15, opacity: 0, rotate: 160, duration: 0.5, ease: 'back.in(1.4)', force3D: true }, i * 0.03)
      tl.to(el, { x: 0, y: 0, scale: 1, opacity: 1, rotate: 0, duration: 0.8, ease: 'back.out(1.6)', force3D: true }, 0.62 + i * 0.04)
    })
    await tl
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
