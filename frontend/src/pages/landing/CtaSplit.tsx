import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'

// Chamada final: as duas metades da casa do logo se afastam ("racham") e voltam a se
// encaixar quando a seção entra na tela. Mesmo desenho do LogoMark, em tamanho grande.
export default function CtaSplit() {
  return (
    <div className="cta-split reveal">
      <svg viewBox="0 0 26 26" className="cta-mark" aria-hidden="true">
        <path className="cta-half is-left" d="M12.2 3 3 10.4V23h9.2z" fill="var(--color-brand)" />
        <path className="cta-half is-right" d="M13.8 3 23 10.4V23h-9.2z" fill="var(--color-coral-bright)" />
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
