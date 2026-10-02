// Tipagem mínima do <model-viewer> (só o que a landing usa) e o carregamento
// sob demanda da biblioteca: o import é dinâmico, então o Three.js (~300 KB gzip)
// só é baixado por quem abre a landing — nunca pelo app logado.

export interface MvMaterial {
  name: string
  pbrMetallicRoughness: { setBaseColorFactor(color: string | number[]): void }
}

export interface ModelViewerElement extends HTMLElement {
  loaded: boolean
  cameraOrbit: string
  currentTime: number
  jumpCameraToGoal(): void
  pause(): void
  model?: { materials: MvMaterial[]; getMaterialByName(name: string): MvMaterial | null }
}

let loading: Promise<unknown> | null = null
export function loadModelViewer() {
  loading ??= import('@google/model-viewer')
  return loading
}

export function createModelViewer(attrs: Record<string, string>): ModelViewerElement {
  const mv = document.createElement('model-viewer') as ModelViewerElement
  for (const [k, v] of Object.entries(attrs)) mv.setAttribute(k, v)
  return mv
}
