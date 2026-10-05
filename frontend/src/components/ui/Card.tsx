import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cardClass, cx } from './styles'
import type { CardPadding, CardTone } from './styles'

interface Props extends HTMLAttributes<HTMLElement> {
  /** tag: div (padrão), section, article, li, form… */
  as?: ElementType
  tone?: CardTone
  padding?: CardPadding
  /** sobe 4 px e ganha sombra maior no hover (cartão clicável) */
  interactive?: boolean
  children?: ReactNode
}

/**
 * Cartão padrão: raio xl (22 px), borda `line`, sombra sm, padding 20/24 px.
 * tone="sunk" é o painel interno (dentro de outro cartão), sem sombra.
 */
export default function Card({ as: Tag = 'div', tone, padding, interactive, className, children, ...rest }: Props) {
  return <Tag className={cx(cardClass({ tone, padding, interactive }), className)} {...rest}>{children}</Tag>
}
