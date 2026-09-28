import { MAPTILER_KEY, usingMapTiler } from '../config/maps'

// Região de Maringá - PR: oeste, sul, leste, norte (lon/lat).
const MARINGA_BBOX = { west: -52.08, south: -23.55, east: -51.78, north: -23.3 }
const MARINGA_CENTER = { lon: -51.9333, lat: -23.4205 }

export interface PlaceSuggestion {
  label: string
  lat: number
  lon: number
}

/** Sugestões de endereço/bairro em Maringá para o texto digitado. */
export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  return usingMapTiler ? searchMapTiler(query) : searchNominatim(query)
}

/** MapTiler Geocoding (com chave): feito para uso comercial, sem o limite de 1 busca/s do Nominatim. */
async function searchMapTiler(query: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    key: MAPTILER_KEY,
    country: 'br',
    language: 'pt',
    // pede 10 porque parte vem de cidades vizinhas e é descartada abaixo; mostra no máximo 5
    limit: '10',
    autocomplete: 'true',
    bbox: [MARINGA_BBOX.west, MARINGA_BBOX.south, MARINGA_BBOX.east, MARINGA_BBOX.north].join(','),
    proximity: [MARINGA_CENTER.lon, MARINGA_CENTER.lat].join(','),
  })
  const res = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?${params}`)
  if (!res.ok) throw new Error('geocoding failed')
  const data: {
    features: Array<{ text: string; place_name: string; address?: string; center: [number, number] }>
  } = await res.json()
  // O site é só de Maringá: a caixa de busca também pega Sarandi, Marialva... que têm ruas com o
  // mesmo nome ("Avenida Brasil"). Fica só o que é de Maringá.
  const inMaringa = data.features.filter((f) => /Maring[áa]/i.test(f.place_name))
  return unique(
    inMaringa.map((f) => ({
      label: mapTilerLabel(f),
      lon: f.center[0],
      lat: f.center[1],
    })),
  ).slice(0, 5)
}

/**
 * "Avenida Brasil, 1000 - Zona 01": rua (e número, quando existe) mais o bairro, para diferenciar
 * ruas com o mesmo nome. Tira cidade, estado, CEP e país, que são sempre os mesmos.
 */
function mapTilerLabel(f: { text: string; place_name: string; address?: string }): string {
  const street = tidy(f.text || f.place_name.split(',')[0])
  const parts = f.place_name.split(',').map((p) => p.trim())
  const neighborhood = parts.slice(1).find((p) => p && !/maring[áa]|paran[áa]|brasil|\d{5}-?\d{3}/i.test(p))
  const withNumber = f.address ? `${street}, ${f.address}` : street
  return neighborhood && tidy(neighborhood) !== street ? `${withNumber} - ${tidy(neighborhood)}` : withNumber
}

/** Espaços duplos fora; TUDO MAIÚSCULO vira "Primeiras Maiúsculas" (preposições em minúsculo). */
function tidy(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  if (clean !== clean.toUpperCase()) return clean
  const small = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])
  return clean
    .toLowerCase()
    .split(' ')
    .map((w, i) => (i > 0 && small.has(w) ? w : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(' ')
}

/** Nominatim (OpenStreetMap), gratuito: só para desenvolver sem chave. Limite de ~1 busca por segundo. */
async function searchNominatim(query: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    viewbox: [MARINGA_BBOX.west, MARINGA_BBOX.north, MARINGA_BBOX.east, MARINGA_BBOX.south].join(','),
    bounded: '1',
    limit: '5',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) throw new Error('geocoding failed')
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json()
  return unique(data.map((item) => ({ label: item.display_name.split(',')[0].trim(), lat: Number(item.lat), lon: Number(item.lon) })))
}

function unique(suggestions: PlaceSuggestion[]): PlaceSuggestion[] {
  const seen = new Set<string>()
  return suggestions.filter((s) => {
    if (!s.label || seen.has(s.label)) return false
    seen.add(s.label)
    return true
  })
}
