import { Link } from 'react-router-dom'

/** Rodapé com os links jurídicos (Termos de Uso e Política de Privacidade). */
export default function LegalLinks({ className = '' }: { className?: string }) {
  return (
    <p className={`flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-ink-3 ${className}`}>
      <Link to="/termos" className="hover:text-ink">
        Termos de Uso
      </Link>
      <Link to="/privacidade" className="hover:text-ink">
        Política de Privacidade
      </Link>
    </p>
  )
}
