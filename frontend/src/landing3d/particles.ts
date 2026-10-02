// Casinhas 3D ao redor do apartamento: parallax por profundidade, campo de
// repulsão do cursor e flutuação. Um modelo só (house.glb); a cor de cada modo é
// aplicada no material (instantâneo, sem baixar/compilar outro modelo).
//
// Duas camadas de DOM por partícula, para loop e GSAP não brigarem pelo transform:
//   .l3d-particle        → posição base + transform do LOOP (parallax/repulsão)
//   .l3d-particle-inner  → transform do GSAP (implodir/explodir na troca)
import { damp, onFrame, pointer } from './loop'
import { createModelViewer, type ModelViewerElement } from './modelViewer'

interface Spot { x: number; y: number; size: number; depth: number; mobile?: boolean }

// posição em fração do palco (0..1), tamanho em px, profundidade do parallax
const LAYOUT: Spot[] = [
  { x: 0.06, y: 0.14, size: 64, depth: 0.8 },
  { x: 0.82, y: 0.06, size: 52, depth: 0.5 },
  { x: 0.92, y: 0.58, size: 70, depth: 1 },
  { x: 0.02, y: 0.7, size: 48, depth: 0.4, mobile: false },
  { x: 0.7, y: 0.86, size: 56, depth: 0.7 },
  { x: 0.38, y: 0.0, size: 40, depth: 0.25, mobile: false },
]
const REPEL_RADIUS = 200, REPEL_FORCE = 70, PARALLAX = 26

export interface Particle { el: HTMLElement; inner: HTMLElement; mv: ModelViewerElement }

export function createParticles(container: HTMLElement, { isMobile, reducedMotion }: { isMobile: boolean; reducedMotion: boolean }) {
  const spots = LAYOUT.filter((s) => !isMobile || s.mobile !== false)
  let origin = { x: 0, y: 0, w: 0, h: 0 }
  let color = ''

  const items = spots.map((s, i) => {
    const el = document.createElement('div')
    el.className = 'l3d-particle'
    const size = isMobile ? Math.round(s.size * 0.75) : s.size
    Object.assign(el.style, { left: `${s.x * 100}%`, top: `${s.y * 100}%`, width: `${size}px`, height: `${size}px` })
    const inner = document.createElement('div')
    inner.className = 'l3d-particle-inner'
    const mv = createModelViewer({
      'aria-hidden': 'true',
      'environment-image': 'neutral',
      'interaction-prompt': 'none',
      'disable-zoom': '',
      'disable-tap': '',
      'camera-orbit': `${30 + i * 50}deg 70deg auto`,
      ...(reducedMotion ? {} : { 'auto-rotate': '', 'auto-rotate-delay': '0', 'rotation-per-second': `${(i % 2 ? -1 : 1) * (16 + i * 5)}deg` }),
    })
    inner.append(mv)
    el.append(inner)
    container.append(el)
    return { el, inner, mv, s, size, ox: 0, oy: 0 }
  })

  const tintOne = (mv: ModelViewerElement) => {
    if (color && mv.loaded) mv.model?.getMaterialByName('house')?.pbrMetallicRoughness.setBaseColorFactor(color)
  }

  /** Lê o layout UMA vez (montagem / resize), nunca dentro do loop. */
  function measure() {
    const r = container.getBoundingClientRect()
    origin = { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }
  }
  measure()
  addEventListener('resize', measure, { passive: true })

  /** Carrega uma casinha por vez, depois do apartamento (não disputa banda com ele). */
  function load(src: string, stagger = 150) {
    items.forEach((it, i) => setTimeout(() => {
      it.mv.addEventListener('load', () => tintOne(it.mv), { once: true })
      it.mv.setAttribute('src', src)
    }, i * stagger))
  }

  function tint(c: string) {
    color = c
    items.forEach((it) => tintOne(it.mv))
  }

  const stop = reducedMotion ? () => {} : onFrame((now, dt) => {
    const px = pointer.clientX + scrollX - origin.x
    const py = pointer.clientY + scrollY - origin.y
    for (const it of items) {
      let tx = -pointer.x * PARALLAX * it.s.depth
      let ty = -pointer.y * PARALLAX * it.s.depth
      if (pointer.active) {
        const dx = it.s.x * origin.w + it.size / 2 - px
        const dy = it.s.y * origin.h + it.size / 2 - py
        const d = Math.hypot(dx, dy) || 1
        if (d < REPEL_RADIUS) {
          const f = (1 - d / REPEL_RADIUS) ** 2 * REPEL_FORCE
          tx += (dx / d) * f
          ty += (dy / d) * f
        }
      }
      ty += Math.sin(now / 950 + it.s.x * 10) * 6 * it.s.depth
      it.ox = damp(it.ox, tx, 0.1, dt)
      it.oy = damp(it.oy, ty, 0.1, dt)
      it.el.style.transform = `translate3d(${it.ox.toFixed(1)}px, ${it.oy.toFixed(1)}px, 0)`
    }
  })

  return {
    items: items as Particle[],
    load,
    tint,
    destroy() {
      stop()
      removeEventListener('resize', measure)
      items.forEach((it) => it.el.remove())
    },
  }
}
