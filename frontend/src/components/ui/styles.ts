// Classes dos primitivos do design system, como funções puras. Os componentes de ui/ usam
// estas funções, e casos que precisam de outra tag (um <Link> com cara de botão, um <label>
// com cara de chip) também — sem copiar a lista de classes.
// Todas as cores, raios, sombras e tamanhos vêm dos tokens do @theme (src/index.css).

export const cx = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ')

/* ---------- foco visível padrão (teclado) ---------- */
export const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/* ---------- botão ---------- */
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent' | 'inverse'
export type ButtonSize = 'sm' | 'md' | 'lg'

const btnBase = cx(
  'relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-md font-bold',
  'transition-[transform,background-color,border-color,color,box-shadow] duration-(--dur-fast) ease-(--ease-standard)',
  'disabled:cursor-not-allowed disabled:opacity-55 aria-disabled:cursor-not-allowed aria-disabled:opacity-55',
  'motion-reduce:transition-none',
  focusRing,
)
const btnVariant: Record<ButtonVariant, string> = {
  // as "cheias" sobem 2 px no hover (mesmo gesto da landing); sem movimento com reduced-motion
  primary: 'bg-brand text-on-brand hover:bg-brand-strong enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:translate-y-0',
  accent: 'bg-coral text-on-brand hover:bg-coral-strong enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:translate-y-0',
  inverse: 'bg-inverse text-on-inverse hover:opacity-90 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:translate-y-0',
  danger: 'bg-danger text-on-inverse hover:opacity-90 enabled:hover:-translate-y-0.5 enabled:hover:shadow-md enabled:active:translate-y-0',
  secondary: 'border border-field bg-surface text-ink hover:border-ink',
  ghost: 'text-ink-2 hover:bg-surface-sunk hover:text-ink',
}
const btnSize: Record<ButtonSize, string> = {
  // sm tem 36 px de altura visual, mas 44 px de área de toque em tela de toque
  sm: 'h-9 px-3.5 text-small pointer-coarse:min-h-11',
  md: 'h-11 px-5 text-small',
  lg: 'h-13 px-6 text-body',
}
/** só ícone: quadrado do tamanho do botão */
const btnIconOnly: Record<ButtonSize, string> = { sm: 'w-9 px-0 pointer-coarse:min-w-11', md: 'w-11 px-0', lg: 'w-13 px-0' }

export function buttonClass({ variant = 'primary', size = 'md', full = false, iconOnly = false }: { variant?: ButtonVariant; size?: ButtonSize; full?: boolean; iconOnly?: boolean } = {}) {
  return cx(btnBase, btnVariant[variant], btnSize[size], iconOnly && btnIconOnly[size], full && 'w-full', 'motion-reduce:hover:translate-y-0')
}

/* ---------- campos ---------- */
export function fieldClass({ invalid = false, multiline = false }: { invalid?: boolean; multiline?: boolean } = {}) {
  return cx(
    'w-full rounded-md border bg-surface px-3 text-body text-ink outline-none placeholder:text-ink-3',
    'transition-[border-color,box-shadow] duration-(--dur-fast)',
    'hover:border-ink-2 focus:border-ink focus:ring-2 focus:ring-focus focus:ring-offset-1 focus:ring-offset-surface',
    'disabled:cursor-not-allowed disabled:bg-surface-sunk disabled:text-ink-3',
    multiline ? 'min-h-24 py-2.5' : 'h-11',
    invalid ? 'border-danger' : 'border-field',
  )
}
export const labelClass = 'mb-1.5 block text-small font-semibold text-ink-2'
export const hintClass = 'mt-1.5 text-caption text-ink-3'
export const errorClass = 'mt-1.5 text-caption font-semibold text-danger'

/* ---------- cartão ---------- */
export type CardTone = 'surface' | 'sunk' | 'danger' | 'brand'
export type CardPadding = 'none' | 'sm' | 'md' | 'lg'
const cardTone: Record<CardTone, string> = {
  surface: 'rounded-xl border border-line bg-surface shadow-sm',
  // painel interno (dentro de outro cartão): sem sombra, raio menor
  sunk: 'rounded-lg border border-line bg-surface-sunk',
  danger: 'rounded-xl border border-danger/40 bg-surface shadow-sm',
  brand: 'rounded-xl border border-brand bg-brand-tint',
}
const cardPad: Record<CardPadding, string> = { none: '', sm: 'p-4', md: 'p-5 sm:p-6', lg: 'p-6 sm:p-8' }
export function cardClass({ tone = 'surface', padding = 'md', interactive = false }: { tone?: CardTone; padding?: CardPadding; interactive?: boolean } = {}) {
  return cx(
    cardTone[tone], cardPad[padding],
    interactive && 'transition-[transform,box-shadow,border-color] duration-(--dur-base) ease-(--ease-standard) hover:-translate-y-1 hover:border-line-strong hover:shadow-md motion-reduce:transition-none motion-reduce:hover:translate-y-0',
  )
}

/* ---------- chip (opção selecionável) e badge (rótulo) ---------- */
export function chipClass({ pressed = false, size = 'md' }: { pressed?: boolean; size?: 'sm' | 'md' } = {}) {
  return cx(
    'inline-flex select-none items-center gap-1.5 rounded-full border font-semibold',
    'transition-[background-color,border-color,color] duration-(--dur-fast)',
    size === 'sm' ? 'h-8 px-3 text-caption pointer-coarse:min-h-11' : 'h-9 px-3.5 text-small pointer-coarse:min-h-11',
    pressed ? 'border-brand bg-brand-tint text-brand-strong' : 'border-field bg-surface text-ink-2 hover:border-ink hover:text-ink',
    focusRing,
  )
}
export type BadgeTone = 'neutral' | 'brand' | 'success' | 'warning' | 'danger' | 'accent' | 'inverse'
const badgeTone: Record<BadgeTone, string> = {
  neutral: 'bg-surface-sunk text-ink-2',
  brand: 'bg-brand-tint text-brand-strong',
  success: 'bg-leaf-tint text-leaf',
  warning: 'bg-mel-tint text-mel',
  danger: 'bg-danger-tint text-danger',
  accent: 'bg-coral-tint text-coral-strong',
  inverse: 'bg-inverse text-on-inverse',
}
export function badgeClass({ tone = 'neutral', shape = 'tag' }: { tone?: BadgeTone; shape?: 'tag' | 'pill' } = {}) {
  return cx('inline-flex items-center gap-1 whitespace-nowrap px-2 py-0.5 text-caption font-bold', shape === 'pill' ? 'rounded-full' : 'rounded-sm', badgeTone[tone])
}

/* ---------- aviso ---------- */
export type AlertTone = 'info' | 'success' | 'warning' | 'danger'
const alertTone: Record<AlertTone, string> = {
  info: 'bg-brand-tint text-brand-strong',
  success: 'bg-leaf-tint text-leaf',
  warning: 'bg-mel-tint text-mel',
  danger: 'bg-danger-tint text-danger',
}
export function alertClass(tone: AlertTone = 'info') {
  return cx('flex items-start gap-2.5 rounded-md px-3.5 py-2.5 text-small', alertTone[tone])
}

/* ---------- títulos e kicker ---------- */
export const pageTitleClass = 'text-h1 text-ink'
export const kickerClass = 'text-label uppercase text-ink-3'
