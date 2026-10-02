// O apartamento inclina em direção ao cursor. `heroState.spin` (giro da troca de
// modo, animado pelo GSAP) é somado ao ângulo; só este loop escreve no elemento.
//
// Inclina pela CÂMERA (cameraOrbit + jumpCameraToGoal) e não por `orientation`:
// mudar orientation recalcula bounding box e sombra a cada frame no model-viewer.
// A inclinação lateral (roll) é um `rotate` de CSS: fica no compositor.
import { damp, onFrame, pointer } from './loop'
import type { ModelViewerElement } from './modelViewer'

export const heroState = { spin: 0, split: 0 }

interface TiltOptions { reducedMotion: boolean; baseYaw: number; basePitch: number }

export function startTilt(mv: ModelViewerElement, { reducedMotion, baseYaw, basePitch }: TiltOptions) {
  let roll = 0, pitch = 0, yaw = 0
  let lastSplit = -1

  return onFrame((now, dt) => {
    let tx = 0, ty = 0
    if (pointer.active) {
      tx = pointer.x; ty = pointer.y
    } else if (!reducedMotion) {
      // sem mouse (celular): balanço suave, para o 3D não parecer parado
      tx = Math.sin(now / 1600) * 0.3
      ty = Math.cos(now / 2100) * 0.15
    }
    roll = damp(roll, tx * 5, 0.08, dt)
    pitch = damp(pitch, ty * 8, 0.08, dt)
    yaw = damp(yaw, tx * 22, 0.08, dt)

    mv.cameraOrbit = `${(baseYaw - yaw - heroState.spin).toFixed(2)}deg ${(basePitch + pitch).toFixed(2)}deg auto`
    mv.jumpCameraToGoal()
    mv.style.rotate = `${roll.toFixed(2)}deg`

    // quadro da animação "split" (0 = colado, 1 = rachado); só escreve se mudou
    if (mv.loaded && Math.abs(heroState.split - lastSplit) > 0.0005) {
      mv.currentTime = heroState.split
      lastSplit = heroState.split
    }
  })
}
