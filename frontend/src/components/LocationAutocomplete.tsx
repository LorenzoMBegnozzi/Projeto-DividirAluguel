import { useEffect, useRef, useState } from 'react'
import { searchPlaces, type PlaceSuggestion } from '../api/geocoding'

interface Props {
  value: string
  onChange: (value: string) => void
  onSelectPlace?: (suggestion: PlaceSuggestion) => void
  placeholder?: string
  className?: string
}

export default function LocationAutocomplete({ value, onChange, onSelectPlace, placeholder, className }: Props) {
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const skipNextFetch = useRef(false)

  useEffect(() => {
    if (skipNextFetch.current) {
      skipNextFetch.current = false
      return
    }
    if (value.trim().length < 3) {
      setSuggestions([])
      return
    }
    const timeout = setTimeout(() => {
      searchPlaces(value.trim())
        .then((results) => {
          setSuggestions(results)
          setOpen(results.length > 0)
        })
        .catch(() => setSuggestions([]))
    }, 450)
    return () => clearTimeout(timeout)
  }, [value])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(suggestion: PlaceSuggestion) {
    skipNextFetch.current = true
    onChange(suggestion.label)
    onSelectPlace?.(suggestion)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => suggestions.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className={className}
      />
      {open && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-line-strong bg-surface shadow-pop">
          {suggestions.map((s) => (
            <li key={s.label}>
              <button
                type="button"
                onClick={() => handleSelect(s)}
                className="block w-full truncate px-3 py-2 text-left text-sm text-ink hover:bg-surface-sunk"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
