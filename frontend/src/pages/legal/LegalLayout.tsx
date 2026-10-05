import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { LEGAL_VERSION_LABEL } from './legalVersion'

/** Moldura das páginas jurídicas: título, data da versão e tipografia de leitura. */
export default function LegalLayout({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link to="/" className="mb-6 inline-flex items-center gap-1 text-sm font-semibold text-ink-3 hover:text-ink">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Voltar
      </Link>
      <h1 className="mb-1 text-[32px] font-serif font-medium tracking-tight text-ink">{title}</h1>
      <p className="mb-8 text-sm text-ink-3">Versão de {LEGAL_VERSION_LABEL}</p>
      <article className="legal-text flex flex-col gap-4 text-[15px] leading-relaxed text-ink-2 [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-ink [&_h3]:mt-2 [&_h3]:font-bold [&_h3]:text-ink [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:pl-6 [&_strong]:text-ink [&_ul]:list-disc [&_ul]:pl-6 [&_a]:font-semibold [&_a]:text-brand">
        {children}
      </article>
    </div>
  )
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <h2>{title}</h2>
      {children}
    </section>
  )
}
