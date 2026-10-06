import type { ReactNode } from 'react'
import ConversationList from './ConversationList'
import { cx } from '../ui'

/**
 * Molde das telas de conversa: lista à esquerda e a conversa à direita, na altura útil da
 * janela (menos a NavBar e, no celular, a barra de baixo). Como no WhatsApp Web.
 * No celular aparece uma coisa de cada vez: a lista em /conversas, o chat em /conversas/:id.
 */
export default function ChatLayout({ activeId, showListOnMobile = false, children }: {
  activeId?: number
  /** /conversas: no celular mostra a lista (e esconde o painel da direita) */
  showListOnMobile?: boolean
  children: ReactNode
}) {
  return (
    <div className="mx-auto flex h-[calc(100dvh-124px)] w-full max-w-400 gap-6 px-4 py-4 lg:h-[calc(100dvh-60px)] lg:px-8">
      <aside
        aria-label="Conversas"
        className={cx(
          'w-full shrink-0 flex-col overflow-hidden rounded-xl border border-line bg-surface lg:flex lg:w-90',
          showListOnMobile ? 'flex' : 'hidden',
        )}
      >
        <h1 className="border-b border-line px-4 py-3 text-h3 text-ink">Conversas</h1>
        <div className="flex-1 overflow-y-auto overscroll-contain p-2">
          <ConversationList activeId={activeId} />
        </div>
      </aside>
      <div className={cx('min-w-0 flex-1 flex-col', showListOnMobile ? 'hidden lg:flex' : 'flex')}>{children}</div>
    </div>
  )
}
