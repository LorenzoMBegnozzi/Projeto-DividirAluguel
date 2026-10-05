import { useEffect, useRef, useState } from 'react'
import { Check } from 'lucide-react'
import type { LandingMode } from '../../../landing3d/Landing3D'
import { steps } from '../content'
import type { Step } from '../content'
import Phone3D from './Phone3D'
import type { PhoneScreen } from './Phone3D'
import type { PhoneEngine } from './engine'
import './phone.css'

// "Como funciona" contado pelo celular 3D. Três versões:
//  - completa: celular fixo numa "câmera", viaja entre os atos guiado pela rolagem (engine.ts)
//  - leve: mesma viagem com menos camadas, sem órbita e sem reflexo (aparelho fraco / economia de dados)
//  - estática: quem pediu menos movimento vê um celular parado ao lado de cada passo
// Para testar: ?celular=completo | leve | estatico
//
// Nas versões animadas o texto NÃO rola: as legendas ficam presas na tela (sticky) e o motor
// troca uma pela outra com fade, só enquanto o celular está parado no ato. Durante a viagem
// do celular não há texto na tela, então os dois nunca se sobrepõem. Os "marcos" (data-act)
// são só espaço de rolagem: um por ato.

export type PhoneQuality = 'full' | 'light' | 'static'

function detectQuality(): PhoneQuality {
  const forced = new URLSearchParams(location.search).get('celular')
  if (forced === 'estatico') return 'static'
  if (forced === 'leve') return 'light'
  if (forced === 'completo') return 'full'
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return 'static'
  const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } }
  if (nav.connection?.saveData || (nav.deviceMemory ?? 8) <= 4 || (nav.hardwareConcurrency ?? 8) <= 4) return 'light'
  return 'full'
}

const actScreen: PhoneScreen[] = ['habits', 'list', 'chat']
// lado do TEXTO em cada ato na versão estática (o celular fica do outro lado)
const textSide = ['center', 'right', 'left'] as const

function Caption({ i, title, step, mode }: { i: number; title: string; step: Step; mode: LandingMode }) {
  return (
    <>
      {/* número gigante e clarinho atrás do texto: preenche o fundo sem competir com ele */}
      <span className="story-bignum" aria-hidden="true">0{i + 1}</span>
      {i === 0 && (
        <div className="story-text story-text-top">
          <p className="landing-kicker mb-3">como funciona</p>
          <h2 key={mode} className="landing-h2">{title}</h2>
        </div>
      )}
      <div className="story-text">
        <span className="story-num">{i + 1}</span>
        <h3 className="mb-2 text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">{step.title}</h3>
        <p className="max-w-md text-lg leading-relaxed text-ink-2">{step.text}</p>
        <ul className="story-details">
          {step.details.map((d) => (
            <li key={d}><Check className="h-4 w-4 flex-none" aria-hidden="true" />{d}</li>
          ))}
        </ul>
      </div>
    </>
  )
}

export default function PhoneStory({ mode }: { mode: LandingMode }) {
  const [quality] = useState(detectQuality)
  const sectionRef = useRef<HTMLElement>(null)
  const stageRef = useRef<HTMLDivElement>(null)
  const engine = useRef<PhoneEngine | null>(null)
  const firstMode = useRef(mode)

  useEffect(() => {
    if (quality === 'static') return
    let cancelled = false
    // o motor da coreografia vem depois do primeiro desenho, num chunk separado
    const idle = window.requestIdleCallback ?? ((fn: () => void) => setTimeout(fn, 300))
    idle(() => {
      import('./engine').then(({ startPhone }) => {
        if (cancelled || !sectionRef.current || !stageRef.current) return
        engine.current = startPhone({ section: sectionRef.current, stage: stageRef.current, quality })
      })
    })
    return () => { cancelled = true; engine.current?.destroy(); engine.current = null }
  }, [quality])

  // troca de modo: o React já trocou o conteúdo; o motor reencontra os elementos e gira
  useEffect(() => {
    if (mode === firstMode.current && !engine.current) return
    engine.current?.refresh()
    engine.current?.spin()
  }, [mode])

  const { title, items } = steps[mode]

  if (quality === 'static') {
    return (
      <section id="como-funciona" className="story" data-quality="static">
        {items.map((s, i) => (
          <div key={i} className="story-act" data-text={textSide[i]}>
            <div className="story-copy"><Caption i={i} title={title} step={s} mode={mode} /></div>
            <div className="story-static" aria-hidden="true">
              <Phone3D mode={mode} slices={3} cards={false} screen={actScreen[i]} />
            </div>
          </div>
        ))}
      </section>
    )
  }

  return (
    <section ref={sectionRef} id="como-funciona" className="story" data-quality={quality}>
      <div ref={stageRef} className="story-stage" aria-hidden="true">
        <span className="p3-floor" data-floor />
        <Phone3D mode={mode} slices={quality === 'full' ? 9 : 3} cards />
      </div>
      <div className="story-pin">
        {items.map((s, i) => (
          <div key={i} className="story-cap" data-cap={i + 1}>
            <Caption i={i} title={title} step={s} mode={mode} />
          </div>
        ))}
        {/* em que passo estamos (o motor marca data-step e controla a opacidade) */}
        <ol className="story-rail" aria-hidden="true" data-rail>
          {items.map((s, i) => (
            <li key={i} data-rail-step={i + 1}><span>{i + 1}</span>{s.short}</li>
          ))}
        </ol>
      </div>
      {items.map((_, i) => <div key={i} className="story-mark" data-act={i + 1} aria-hidden="true" />)}
      <div className="story-mark is-exit" data-act={4} aria-hidden="true" />
    </section>
  )
}
