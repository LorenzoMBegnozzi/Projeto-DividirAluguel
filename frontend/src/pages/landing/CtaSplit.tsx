import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { DOOR_LEFT, DOOR_RIGHT } from '../../components/logoShape'

// Chamada final: as duas folhas da porta do logo chegam de lados opostos e se encontram
// quando a seção entra na tela. Mesmo desenho do LogoMark, em tamanho grande.
export default function CtaSplit() {
  return (
    <div className="cta-split reveal">
      <svg viewBox="4 14 112 124" className="cta-mark" aria-hidden="true">
        <g className="cta-half is-left">
          <path d={DOOR_LEFT} fill="var(--color-brand)" />
          <circle cx="50" cy="82" r="3.4" fill="var(--color-paper)" />
        </g>
        <g className="cta-half is-right">
          <path d={DOOR_RIGHT} fill="var(--color-coral-bright)" />
          <circle cx="70" cy="82" r="3.4" fill="var(--color-paper)" />
        </g>
        <rect x="12" y="128" width="96" height="6" rx="3" fill="var(--color-ink)" />
      </svg>
      <h2 className="landing-h2 mx-auto mb-4 max-w-2xl">Bora rachar o aluguel?</h2>
      <p className="mx-auto mb-9 max-w-md text-lead text-ink-2">Comece procurando ou anunciando. Dá para ativar o outro lado depois, na mesma conta.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Link to="/registro?perfil=procurar" className="landing-btn" data-tone="brand">Quero uma vaga <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        <Link to="/registro?perfil=anunciar" className="landing-btn" data-tone="coral">Tenho vaga <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </div>
    </div>
  )
}
