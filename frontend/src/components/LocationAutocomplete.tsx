import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { searchPlaces, type PlaceSuggestion } from '../api/geocoding'
import { cx, focusRing } from './ui'
import { normalizePlace } from '../utils/place'

/** Sugestão local (sem API): bairro ou faculdade que já existe nos anúncios. */
export interface LocalOption {
  label: string
  /** texto curto à direita ("Bairro", "Faculdade", "2 anúncios") */
  hint?: string
}

interface Props {
  value: string
  onChange: (value: string) => void
  onSelectPlace?: (suggestion: PlaceSuggestion) => void
  /** aparecem primeiro, já da primeira letra (sem acento/maiúscula/zero à esquerda importar) */
  localOptions?: LocalOption[]
  placeholder?: string
  className?: string
}

export default function LocationAutocomplete({ value, onChange, onSelectPlace, localOptions = [], placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  // só busca endereços quando é este campo que está sendo usado (a busca tem o painel de filtros
  // duas vezes na página: lateral e gaveta do celular; sem isso cada letra virava 2 requisições)
  const [focused, setFocused] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const skipNextFetch = useRef(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    if (value.trim().length < 3) {
      setSuggestions([])
      return
    }
    // perder o foco não apaga a lista (senão o clique numa sugestão se perderia); só não busca de novo
    if (!focused) return
    const timeout = setTimeout(() => {
      searchPlaces(value.trim())
        .then((results) => setSuggestions(results))
        .catch(() => setSuggestions([]))
    }, 450)
    return () => clearTimeout(timeout)
  }, [value, focused])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // bairros/faculdades dos anúncios que batem com o que foi digitado (o idêntico não repete)
  const needle = normalizePlace(value)
  const local = needle
    ? localOptions.filter((o) => normalizePlace(o.label).includes(needle) && normalizePlace(o.label) !== needle).slice(0, 6)
    : []
  const visible = open && (local.length > 0 || suggestions.length > 0)

  function handleSelect(suggestion: PlaceSuggestion) {
    skipNextFetch.current = true
    onChange(suggestion.label)
    onSelectPlace?.(suggestion)
    setSuggestions([])
    setOpen(false)
  }

  /** o "x": apaga o texto, fecha as sugestões e devolve o cursor ao campo */
  function handleClear() {
    onChange('')
    setSuggestions([])
    setOpen(false)
    inputRef.current?.focus()
  }

  function handleSelectLocal(option: LocalOption) {
    skipNextFetch.current = true
    onChange(option.label)
    setSuggestions([])
    setOpen(false)
  }

  const itemClass =
    'flex min-h-11 w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-small text-ink hover:bg-surface-sunk focus-visible:bg-surface-sunk focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus'

  return (
    <div ref={containerRef} className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => { onChange(e.target.value); setOpen(true) }}
        onFocus={() => { setFocused(true); setOpen(true) }}
        onBlur={() => setFocused(false)}
        onKeyDown={(e) => { if (e.key === 'Escape') setOpen(false) }}
        placeholder={placeholder}
        autoComplete="off"
        className={cx(className, value && 'pr-11')}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Limpar o texto"
          title="Limpar"
          className={cx(
            'absolute top-1/2 right-1.5 grid size-8 -translate-y-1/2 place-items-center rounded-full text-ink-3 transition-colors duration-(--dur-fast) hover:bg-surface-sunk hover:text-ink',
            'pointer-coarse:size-10',
            focusRing,
          )}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      )}
      {visible && (
        <ul className="absolute z-(--z-dropdown) mt-1 max-h-72 w-full overflow-auto rounded-lg border border-line bg-surface py-1 shadow-lg">
          {local.map((o) => (
            <li key={`local-${o.label}`}>
              <button type="button" onClick={() => handleSelectLocal(o)} className={itemClass}>
                <span className="truncate font-semibold">{o.label}</span>
                {o.hint && <span className="shrink-0 text-caption text-ink-3">{o.hint}</span>}
              </button>
            </li>
          ))}
          {local.length > 0 && suggestions.length > 0 && (
            <li aria-hidden="true" className="mx-3 my-1 border-t border-line" />
          )}
          {suggestions.map((s) => (
            <li key={s.label}>
              <button type="button" onClick={() => handleSelect(s)} className={cx(itemClass, 'block truncate')}>
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
