// Palco 3D da landing: o mascote. Um caranguejo-eremita deixa a concha ("vou deixar pro próximo")
// e outro caranguejo chega e faz dela a casa nova — a vaga passando adiante.
// Carregado com React.lazy pela HomePage, então nem o Three.js nem o GSAP entram
// no bundle do app logado. Os elementos 3D são criados fora do React (DOM direto)
// e destruídos no unmount; o React só cuida do contêiner e dos props.
import { useEffect, useRef } from 'react'
import { setRunning } from './loop'
import { createModelViewer, loadModelViewer, type ModelViewerElement } from './modelViewer'
import { isLiteDevice, whenIdle } from './perf'
import { CAMERA, createScene, createSwitcher } from './choreography'
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
  const sayLeavingRef = useRef<HTMLSpanElement>(null)
  const sayArrivingRef = useRef<HTMLSpanElement>(null)
  const switchRef = useRef<(() => Promise<void>) | null>(null)
  const modeRef = useRef(mode)
  // callbacks mais recentes, sem recriar o 3D quando o pai re-renderiza
  const callbacks = useRef({ onPeak, onReady })
  useEffect(() => { callbacks.current = { onPeak, onReady } })

  useEffect(() => {
    const stage = stageRef.current!
    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches
    const lite = isLiteDevice()
    const cleanups: Array<() => void> = []
    let cancelled = false
    let mv: ModelViewerElement | null = null
    let scene: ReturnType<typeof createScene> = null

    // a estrela-do-mar da areia acompanha o modo (azul procurar / coral anunciar)
    const applyColors = () => {
      mv?.model?.getMaterialByName('accent')?.pbrMetallicRoughness.setBaseColorFactor(colorFor(modeRef.current))
    }
    const startScene = () => {
      scene?.kill()
      scene = createScene({ leaving: sayLeavingRef.current!, arriving: sayArrivingRef.current! }, { reducedMotion })
    }

    const boot = () => loadModelViewer().then(() => {
      if (cancelled) return
      mv = createModelViewer({
        src: '/landing/caranguejo.glb',
        alt: 'Ilustração 3D: um caranguejo-eremita laranja sai da concha azul e a deixa na areia; outro caranguejo chega e faz dela a casa nova',
        'animation-name': 'cena',
        'camera-orbit': `${CAMERA.yaw}deg ${CAMERA.pitch}deg ${CAMERA.radius}`,
        'camera-target': CAMERA.target,
        // câmera fixa um pouco mais perto que o enquadramento automático (os caranguejos saem pela borda)
        'min-camera-orbit': 'auto auto 1m',
        'max-camera-orbit': 'auto auto 40m',
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
      cleanups.push(startTilt(mv, { reducedMotion, baseYaw: CAMERA.yaw, basePitch: CAMERA.pitch, radius: CAMERA.radius }))

      mv.addEventListener('load', () => {
        if (cancelled || !mv) return
        mv.pause()                     // a animação não "toca": o GSAP escolhe o quadro
        applyColors()
        startScene()
        stage.classList.add('is-ready')
        callbacks.current.onReady()
      }, { once: true })

      const runSwitch = createSwitcher({
        stage,
        reducedMotion,
        onPeak: () => {
          applyColors()
          callbacks.current.onPeak(modeRef.current)
        },
        restartScene: startScene,
      })
      // a troca de modo assume o palco: a cena para (balões somem) e recomeça quando o giro termina
      switchRef.current = () => {
        scene?.pause()
        for (const el of [sayLeavingRef.current, sayArrivingRef.current]) if (el) el.style.opacity = '0'
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
      <div ref={stageRef} className="l3d-stage" />
      {/* falas dos caranguejos (o 3D não tem texto): só decoração, o leitor de tela fica com o alt */}
      <span ref={sayLeavingRef} className="l3d-bubble l3d-say is-leaving" aria-hidden="true">Vou deixar pro próximo!</span>
      <span ref={sayArrivingRef} className="l3d-bubble l3d-say is-arriving" aria-hidden="true">Opa, casa nova!</span>
    </div>
  )
}
