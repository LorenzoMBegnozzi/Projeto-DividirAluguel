// Provedor de mapas e de busca de endereço.
//
// Com VITE_MAPTILER_KEY definida (vem de MAPTILER_KEY no .env do ambiente), usa o MapTiler: mapas
// com versão clara e escura, e busca de endereço feita para uso comercial. Sem a chave, cai no
// OpenStreetMap/Nominatim gratuitos, que servem para desenvolver mas não aceitam tráfego alto.
//
// A chave vai para o navegador de quem usa o site (é pública por natureza). Proteja-a no painel
// do MapTiler (API keys → Allowed HTTP origins) liberando só os endereços do site.

export const MAPTILER_KEY: string = (import.meta.env.VITE_MAPTILER_KEY ?? '').trim()

export const usingMapTiler = MAPTILER_KEY !== ''

/** Estilo do MapTiler para cada tema do site. */
const MAPTILER_STYLE = {
  light: 'streets-v2',
  dark: 'streets-v2-dark',
} as const

/** URL das imagens do mapa (tiles) para o Leaflet. {r} vira "@2x" em telas de alta densidade. */
export function tileUrl(theme: 'light' | 'dark'): string {
  if (usingMapTiler) {
    return `https://api.maptiler.com/maps/${MAPTILER_STYLE[theme]}/256/{z}/{x}/{y}{r}.png?key=${MAPTILER_KEY}`
  }
  return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
}

/** Crédito obrigatório (MapTiler e OpenStreetMap exigem que apareça no mapa). */
export const tileAttribution = usingMapTiler
  ? '<a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">&copy; MapTiler</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">&copy; OpenStreetMap</a>'
  : '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
