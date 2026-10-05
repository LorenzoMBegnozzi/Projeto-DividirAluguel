import { forwardRef, useId } from 'react'
import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { cx, errorClass, fieldClass, focusRing, hintClass, labelClass } from './styles'

// Campos com rótulo, ajuda e erro ligados por id/aria (o leitor de tela lê os três).
// `label` é obrigatório para acessibilidade; `hideLabel` só esconde visualmente.

interface FieldProps {
  label: ReactNode
  hideLabel?: boolean
  hint?: ReactNode
  error?: ReactNode
  /** classes do contêiner (margem, largura) */
  wrapperClassName?: string
}

function useFieldIds(id: string | undefined, hint: unknown, error: unknown) {
  const auto = useId()
  const fieldId = id ?? auto
  const hintId = hint ? `${fieldId}-ajuda` : undefined
  const errorId = error ? `${fieldId}-erro` : undefined
  return { fieldId, describedBy: [hintId, errorId].filter(Boolean).join(' ') || undefined, hintId, errorId }
}

function Shell({ label, hideLabel, hint, error, wrapperClassName, fieldId, hintId, errorId, children }: FieldProps & { fieldId: string; hintId?: string; errorId?: string; children: ReactNode }) {
  return (
    <div className={wrapperClassName}>
      <label htmlFor={fieldId} className={hideLabel ? 'sr-only' : labelClass}>{label}</label>
      {children}
      {hint && <p id={hintId} className={hintClass}>{hint}</p>}
      {error && <p id={errorId} className={errorClass}>{error}</p>}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, FieldProps & InputHTMLAttributes<HTMLInputElement>>(function Input(
  { label, hideLabel, hint, error, wrapperClassName, id, className, ...rest }, ref,
) {
  const ids = useFieldIds(id, hint, error)
  return (
    <Shell label={label} hideLabel={hideLabel} hint={hint} error={error} wrapperClassName={wrapperClassName} {...ids}>
      <input ref={ref} id={ids.fieldId} aria-describedby={ids.describedBy} aria-invalid={error ? true : undefined} className={cx(fieldClass({ invalid: !!error }), className)} {...rest} />
    </Shell>
  )
})

export const Textarea = forwardRef<HTMLTextAreaElement, FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { label, hideLabel, hint, error, wrapperClassName, id, className, ...rest }, ref,
) {
  const ids = useFieldIds(id, hint, error)
  return (
    <Shell label={label} hideLabel={hideLabel} hint={hint} error={error} wrapperClassName={wrapperClassName} {...ids}>
      <textarea ref={ref} id={ids.fieldId} aria-describedby={ids.describedBy} aria-invalid={error ? true : undefined} className={cx(fieldClass({ invalid: !!error, multiline: true }), className)} {...rest} />
    </Shell>
  )
})

export const Select = forwardRef<HTMLSelectElement, FieldProps & SelectHTMLAttributes<HTMLSelectElement>>(function Select(
  { label, hideLabel, hint, error, wrapperClassName, id, className, children, ...rest }, ref,
) {
  const ids = useFieldIds(id, hint, error)
  return (
    <Shell label={label} hideLabel={hideLabel} hint={hint} error={error} wrapperClassName={wrapperClassName} {...ids}>
      <select ref={ref} id={ids.fieldId} aria-describedby={ids.describedBy} aria-invalid={error ? true : undefined} className={cx(fieldClass({ invalid: !!error }), 'pr-8', className)} {...rest}>
        {children}
      </select>
    </Shell>
  )
})

/** Caixa de seleção com o texto ao lado; a linha inteira tem 44 px de área de toque. */
export const Checkbox = forwardRef<HTMLInputElement, { label: ReactNode } & Omit<InputHTMLAttributes<HTMLInputElement>, 'type'>>(function Checkbox(
  { label, className, id, ...rest }, ref,
) {
  const auto = useId()
  const fieldId = id ?? auto
  return (
    <label htmlFor={fieldId} className={cx('inline-flex min-h-11 cursor-pointer items-start gap-2.5 py-2.5 text-small text-ink-2', className)}>
      <input ref={ref} id={fieldId} type="checkbox" className={cx('mt-0.5 size-4 shrink-0 cursor-pointer rounded-sm accent-brand', focusRing)} {...rest} />
      <span>{label}</span>
    </label>
  )
})
