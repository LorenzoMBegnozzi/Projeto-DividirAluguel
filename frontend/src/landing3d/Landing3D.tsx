// Palco 3D da landing: apartamento que "racha" em dois quartos + casinhas.
// Carregado com React.lazy pela HomePage, então nem o Three.js nem o GSAP entram
// no bundle do app logado. Os elementos 3D são criados fora do React (DOM direto)
// e destruídos no unmount; o React só cuida do contêiner e dos props.
import { useEffect, useRef } from 'react'
import { setRunning } from './loop'
import { createModelViewer, loadModelViewer, type ModelViewerElement } from './modelViewer'
import { createParticles } from './particles'
import { createSwitcher, intro } from './choreography'
import { startTilt } from './tilt'
import './landing.css'

export type LandingMode = 'procurar' | 'anunciar'

interface Props {
  mode: LandingMode
  /** Chamado no pico da troca (texto troca junto com a cor do 3D). */
  onPeak: (mode: LandingMode) => void
  /** O 3D carregou: a partir daqui o texto espera o pico para trocar. */
  onReady: () => void
}

// cor de cada modo vem do tema (claro/escuro), não fica fixa no código
const cssColor = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim()
const colorFor = (mode: LandingMode) => cssColor(mode === 'procurar' ? '--color-brand' : '--color-coral-bright')

export default function Landing3D({ mode, onPeak, onReady }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const switchRef = useRef<(() => Promise<void>) | null>(null)
  const modeRef = useRef(mode)
  // callbacks mais recentes, sem recriar o 3D quando o pai re-renderiza
  const callbacks = useRef({ onPeak, onReady })
  useEffect(() => { callbacks.current = { onPeak, onReady } })

  useEffect(() => {
    const stage = stageRef.current!
    const particlesBox = particlesRef.current!
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const isMobile = matchMedia('(max-width: 640px)').matches
    const cleanups: Array<() => void> = []
    let cancelled = false
    let mv: ModelViewerElement | null = null
    let particles: ReturnType<typeof createParticles> | null = null

    const applyColors = () => {
      const c = colorFor(modeRef.current)
      mv?.model?.getMaterialByName('accent')?.pbrMetallicRoughness.setBaseColorFactor(c)
      particles?.tint(c)
    }

    loadModelViewer().then(() => {
      if (cancelled) return
      mv = createModelViewer({
        src: '/landing/apartment.glb',
        alt: 'Ilustração 3D de um apartamento dividido em dois quartos',
        'animation-name': 'split',
        'camera-orbit': '20deg 62deg auto',
        'field-of-view': '30deg',
        'environment-image': 'neutral',
        exposure: '1.05',
        'shadow-intensity': '1',
        'shadow-softness': '0.9',
        'interaction-prompt': 'none',
        'disable-zoom': '',
        'disable-pan': '',
        'disable-tap': '',
        loading: 'eager',
      })
      stage.prepend(mv)
      particles = createParticles(particlesBox, { isMobile, reducedMotion })
      cleanups.push(() => particles?.destroy())
      cleanups.push(startTilt(mv, { reducedMotion, baseYaw: 20, basePitch: 62 }))

      mv.addEventListener('load', () => {
        if (cancelled || !mv) return
        mv.pause()                     // a animação não "toca": o GSAP escolhe o quadro
        applyColors()
        intro({ reducedMotion })
        particles?.load('/landing/house.glb')
        stage.classList.add('is-ready')
        callbacks.current.onReady()
      }, { once: true })

      switchRef.current = createSwitcher({
        stage,
        particles: () => particles?.items ?? [],
        reducedMotion,
        onPeak: () => {
          applyColors()
          callbacks.current.onPeak(modeRef.current)
        },
      })
    }).catch(() => { /* sem 3D (offline, navegador antigo): a landing segue só com texto */ })

    // pausa o loop com o palco fora da tela ou a aba escondida
    let visible = true
    const sync = () => setRunning(visible && !document.hidden)
    // sem IntersectionObserver (navegador muito antigo): roda sempre que a aba estiver ativa
    const io = 'IntersectionObserver' in window ? new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync() }) : null
    io?.observe(stage)
    document.addEventListener('visibilitychange', sync)
    cleanups.push(() => { io?.disconnect(); document.removeEventListener('visibilitychange', sync) })

    // tema claro/escuro trocado com a página aberta: recolore na hora
    const themeObserver = new MutationObserver(applyColors)
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    cleanups.push(() => themeObserver.disconnect())

    return () => {
      cancelled = true
      cleanups.forEach((fn) => fn())
      mv?.remove()
      switchRef.current = null
    }
  }, [])

  // troca de modo: dispara a coreografia (o texto troca no pico, via onPeak)
  useEffect(() => {
    if (modeRef.current === mode) return
    modeRef.current = mode
    if (switchRef.current) void switchRef.current()
    else callbacks.current.onPeak(mode)
  }, [mode])

  return (
    <div className="l3d-wrap">
      <div ref={particlesRef} className="l3d-particles" aria-hidden="true" />
      <div ref={stageRef} className="l3d-stage" />
    </div>
  )
}
