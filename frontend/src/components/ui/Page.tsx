import type { ReactNode } from 'react'
import { cx, pageTitleClass } from './styles'

/**
 * Molde das telas do app. Duas larguras:
 *   wide   — usa a tela toda (até 1600 px), com colunas: busca, conversas, anúncios, perfil…
 *   medium — página de um item, estilo portal (1152 px): o anúncio
 *   narrow — coluna de leitura (672 px): formulários curtos e textos (login, onboarding, termos)
 * A mesma margem lateral da NavBar (px-4, lg:px-8), para tudo alinhar com o menu.
 */
export function Page({ width = 'wide', className, children }: { width?: 'wide' | 'medium' | 'narrow'; className?: string; children: ReactNode }) {
  const w = { wide: 'max-w-400 py-6 lg:px-8', medium: 'max-w-6xl py-6 lg:px-8', narrow: 'max-w-2xl py-8' }[width]
  return (
    <div className={cx('mx-auto w-full px-4', w, className)}>
      {children}
    </div>
  )
}

/** Cabeçalho da tela: título e apoio à esquerda, ações à direita (descem no celular). */
export function PageHeader({ title, description, actions, className }: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}) {
  return (
    <div className={cx('mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 className={cx('mb-1', pageTitleClass)}>{title}</h1>
        {description && <div className="text-small text-ink-3">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/**
 * Duas colunas no computador (lg+): uma lateral de largura fixa e o conteúdo principal.
 * A lateral pode ficar presa ao rolar (sticky, abaixo da NavBar). No celular empilha:
 * `asideFirst` decide se a lateral vem antes (ex.: foto do perfil) ou depois (ex.: formulário).
 */
export function Columns({ aside, children, side = 'left', asideWidth = 'md', sticky = true, asideFirst = true, className }: {
  aside: ReactNode
  children: ReactNode
  side?: 'left' | 'right'
  /** sm 300 px · md 340 px · lg 420 px */
  asideWidth?: 'sm' | 'md' | 'lg'
  sticky?: boolean
  asideFirst?: boolean
  className?: string
}) {
  const cols = {
    left: { sm: 'lg:grid-cols-[300px_minmax(0,1fr)]', md: 'lg:grid-cols-[340px_minmax(0,1fr)]', lg: 'lg:grid-cols-[420px_minmax(0,1fr)]' },
    right: { sm: 'lg:grid-cols-[minmax(0,1fr)_300px]', md: 'lg:grid-cols-[minmax(0,1fr)_340px]', lg: 'lg:grid-cols-[minmax(0,1fr)_420px]' },
  }[side][asideWidth]
  // ordem: celular (empilhado) segue asideFirst; computador segue o lado
  const order = side === 'left'
    ? (asideFirst ? '' : 'order-last lg:order-first')
    : (asideFirst ? 'lg:order-last' : 'order-last')
  const asideEl = (
    <aside className={cx('min-w-0', order)}>
      <div className={cx(sticky && 'lg:sticky lg:top-20')}>{aside}</div>
    </aside>
  )
  return (
    <div className={cx('grid grid-cols-1 gap-6 lg:gap-8', cols, className)}>
      {asideEl}
      <div className="min-w-0">{children}</div>
    </div>
  )
}
