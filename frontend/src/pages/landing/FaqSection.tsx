import type { CSSProperties } from 'react'
import { ChevronDown } from 'lucide-react'
import { faq } from './content'

// <details> nativo: abre/fecha por teclado e leitor de tela sem JavaScript.
export default function FaqSection() {
  return (
    <div className="mx-auto max-w-3xl">
      <div className="reveal mb-10 text-center">
        <p className="landing-kicker mb-3">dúvidas</p>
        <h2 className="landing-h2">Perguntas que todo mundo faz</h2>
      </div>
      <div className="space-y-3">
        {faq.map(({ q, a }, i) => (
          <details key={q} className="faq-item reveal" style={{ '--i': i } as CSSProperties}>
            <summary>
              {q}
              <ChevronDown className="faq-icon h-5 w-5 flex-none" aria-hidden="true" />
            </summary>
            <p>{a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
