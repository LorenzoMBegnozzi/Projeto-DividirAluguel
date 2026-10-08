// Palco 3D da landing: a casinha com a porta dupla do logo (toc toc → who? → abre) + casinhas.
// Carregado com React.lazy pela HomePage, então nem o Three.js nem o GSAP entram
// no bundle do app logado. Os elementos 3D são criados fora do React (DOM direto)
// e destruídos no unmount; o React só cuida do contêiner e dos props.
import { useEffect, useRef } from 'react'
import { setRunning } from './loop'
import { createModelViewer, loadModelViewer, type ModelViewerElement } from './modelViewer'
import { createParticles } from './particles'
import { isLiteDevice, whenIdle } from './perf'
import { createScene, createSwitcher } from './choreography'
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
const TOC_LABEL = 'toc'

export default function Landing3D({ mode, onPeak, onReady }: Props) {
  const stageRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<HTMLDivElement>(null)
  const tocLeftRef = useRef<HTMLSpanElement>(null)
  const tocRightRef = useRef<HTMLSpanElement>(null)
  const whoRef = useRef<HTMLSpanElement>(null)
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
    const lite = isLiteDevice()
    const cleanups: Array<() => void> = []
    let cancelled = false
    let mv: ModelViewerElement | null = null
    let particles: ReturnType<typeof createParticles> | null = null
    let scene: ReturnType<typeof createScene> = null

    const applyColors = () => {
      const c = colorFor(modeRef.current)
      const paint = (name: string, color: string) => mv?.model?.getMaterialByName(name)?.pbrMetallicRoughness.setBaseColorFactor(color)
      paint('accent', c)
      // as folhas da porta seguem o logo (e o tema claro/escuro)
      paint('leafLeft', cssColor('--color-brand'))
      paint('leafRight', cssColor('--color-coral-bright'))
      particles?.tint(c)
    }
    const startScene = () => {
      scene?.kill()
      if (!mv) return
      scene = createScene({ mv, tocs: [tocLeftRef.current!, tocRightRef.current!], who: whoRef.current! }, { reducedMotion })
    }

    const boot = () => loadModelViewer().then(() => {
      if (cancelled) return
      mv = createModelViewer({
        src: '/landing/door-house.glb',
        alt: 'Ilustração 3D de uma casinha com uma porta dupla, uma folha azul e outra coral, que se abre',
        'animation-name': 'open',
        'camera-orbit': '0deg 76deg auto',
        'field-of-view': '26deg',
        'environment-image': 'neutral',
        exposure: '1.05',
        'shadow-intensity': lite ? '0' : '1',
        'shadow-softness': '0.9',
        'interaction-prompt': 'none',
        'disable-zoom': '',
        'disable-pan': '',
        'disable-tap': '',
        loading: 'eager',
      })
      stage.prepend(mv)
      particles = createParticles(particlesBox, { isMobile, reducedMotion, lite })
      cleanups.push(() => particles?.destroy())
      cleanups.push(startTilt(mv, { reducedMotion, baseYaw: 0, basePitch: 76 }))

      mv.addEventListener('load', () => {
        if (cancelled || !mv) return
        mv.pause()                     // a animação não "toca": o GSAP escolhe o quadro
        applyColors()
        startScene()
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
        restartScene: startScene,
      })
      // a troca de modo assume a porta: a cena para e recomeça quando o giro termina
      const runSwitch = switchRef.current
      switchRef.current = () => {
        scene?.pause()
        for (const el of [tocLeftRef.current, tocRightRef.current, whoRef.current]) if (el) el.style.opacity = '0'
        return runSwitch()
      }
    }).catch(() => { /* sem 3D (offline, navegador antigo): a landing segue só com texto */ })

    // o 3D só começa quando o navegador está ocioso: texto e botões aparecem primeiro
    cleanups.push(whenIdle(boot))

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
      scene?.kill()
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
      {/* balões da cena (o 3D não tem texto): só decoração, o leitor de tela fica com o alt */}
      <span ref={tocLeftRef} className="l3d-bubble l3d-toc is-left" aria-hidden="true">{TOC_LABEL}</span>
      <span ref={tocRightRef} className="l3d-bubble l3d-toc is-right" aria-hidden="true">{TOC_LABEL}</span>
      <span ref={whoRef} className="l3d-bubble l3d-who" aria-hidden="true">who?</span>
    </div>
  )
}
