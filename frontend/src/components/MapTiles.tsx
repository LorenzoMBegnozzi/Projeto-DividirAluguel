import { TileLayer } from 'react-leaflet'
import { useTheme } from '../context/ThemeContext'
import { tileAttribution, tileUrl } from '../config/maps'

/** Camada de imagens do mapa, com o provedor configurado e a versão do tema atual (claro/escuro). */
export default function MapTiles() {
  const { theme } = useTheme()
  const url = tileUrl(theme)
  // key={url}: troca a camada inteira quando o tema muda (o Leaflet não atualiza a URL sozinho).
  return <TileLayer key={url} url={url} attribution={tileAttribution} tileSize={256} detectRetina={false} />
}
