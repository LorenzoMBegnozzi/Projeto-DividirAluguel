// Coreografia GSAP do topo da landing (o mascote caranguejo-eremita, em 3D):
//   cena em loop: o quadro da animação "cena" do modelo (heroState.frame, 0..13 s, aplicado pelo
//                 loop do tilt) anda no tempo real; as falas em HTML aparecem nos momentos certos:
//                 o laranja sai da concha e diz "Vou deixar pro próximo!", o pequeno pega a concha
//                 e comemora "Opa, casa nova!" (ver scripts/generate-landing-crab.mjs)
//   troca de modo (procurar ↔ anunciar): a praia dá um giro de 360° com blur leve; no pico
//                 recolore e troca o texto (onPeak); depois a cena recomeça do começo
// Só transform/opacity/filter-no-palco.
import gsap from 'gsap'
import { heroState } from './tilt'

/** Duração da animação "cena" do caranguejo.glb (igual a DURATION no gerador). */
export const SCENE_SECONDS = 13
/** Câmera fixa da cena (o tilt soma a inclinação do mouse e o giro da troca de modo). */
export const CAMERA = { yaw: 0, pitch: 78, radius: '10m', target: '0m 0.55m 0m' }
const SPIN = 1.2

export interface SceneEls {
  leaving: HTMLElement
  arriving: HTMLElement
}

interface Options {
  stage: HTMLElement
  reducedMotion: boolean
  onPeak: () => void
  restartScene: () => void
}

const pop = { scale: 1, opacity: 1, y: 0, duration: 0.4, ease: 'back.out(2.2)' }
const hide = { opacity: 0, y: -8, duration: 0.3, ease: 'power1.out' }

/** A cena em loop. Devolve a timeline (a troca de modo pausa e recomeça). */
export function createScene(els: SceneEls, { reducedMotion }: { reducedMotion: boolean }) {
  // o ponto (left/top do CSS) é a ponta do rabinho: o balão fica acima e centrado nele. Fica no GSAP
  // (xPercent/yPercent) e não no "translate" do CSS, que o GSAP sobrescreve ao animar o y.
  gsap.set([els.leaving, els.arriving], { xPercent: -50, yPercent: -100 })
  if (reducedMotion) {
    // sem movimento: o quadro em que o laranja já deixou a concha, com a fala parada
    heroState.frame = 4.8
    gsap.set(els.leaving, { scale: 1, opacity: 1, y: 0 })
    gsap.set(els.arriving, { opacity: 0 })
    return null
  }
  gsap.set([els.leaving, els.arriving], { opacity: 0 })
  heroState.frame = 0
  const tl = gsap.timeline({ repeat: -1 })
  tl.fromTo(heroState, { frame: 0 }, { frame: SCENE_SECONDS - 0.001, duration: SCENE_SECONDS, ease: 'none' }, 0)
  tl.fromTo(els.leaving, { scale: 0.5, opacity: 0, y: 10 }, pop, 4.25)
  tl.to(els.leaving, hide, 5.75)
  tl.fromTo(els.arriving, { scale: 0.5, opacity: 0, y: 10 }, pop, 10.45)
  tl.to(els.arriving, hide, 11.65)
  return tl
}

export function createSwitcher({ stage, reducedMotion, onPeak, restartScene }: Options) {
  let busy = false
  let queued: (() => void) | null = null   // clique durante a troca roda em seguida (só o último)

  async function run() {
    if (reducedMotion) { onPeak(); return }
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
    tl.call(onPeak, undefined, SPIN * 0.46)
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
