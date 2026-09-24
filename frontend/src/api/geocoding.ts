// west,north,east,south around Maringá, PR
const MARINGA_VIEWBOX = '-52.08,-23.30,-51.78,-23.55'

export interface PlaceSuggestion {
  label: string
  lat: number
  lon: number
}

export async function searchPlaces(query: string): Promise<PlaceSuggestion[]> {
  const params = new URLSearchParams({
    format: 'json',
    q: query,
    viewbox: MARINGA_VIEWBOX,
    bounded: '1',
    limit: '5',
  })
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params}`)
  if (!res.ok) throw new Error('geocoding failed')
  const data: Array<{ display_name: string; lat: string; lon: string }> = await res.json()
  const seen = new Set<string>()
  const suggestions: PlaceSuggestion[] = []
  for (const item of data) {
    const label = item.display_name.split(',')[0].trim()
    if (seen.has(label)) continue
    seen.add(label)
    suggestions.push({ label, lat: Number(item.lat), lon: Number(item.lon) })
  }
  return suggestions
}
