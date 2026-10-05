import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Para onde o "npm run dev" manda as chamadas /api: decide a variável AMBIENTE (dev, homolog ou
// prod), lendo o .env daquele ambiente na raiz do projeto:
//   dev / homolog → http://localhost:<API_PORT do .env>
//   prod          → APP_BASE_URL do .env.prod (o site público; a API de prod não tem porta aberta)
// Sem AMBIENTE, usa dev. API_TARGET, se definida, passa por cima de tudo.
const AMBIENTES = ['dev', 'homolog', 'prod']

function readEnvFile(ambiente: string): Record<string, string> {
  const file = resolve(__dirname, '..', `.env.${ambiente}`)
  if (!existsSync(file)) {
    throw new Error(`AMBIENTE=${ambiente}, mas o arquivo .env.${ambiente} não existe na raiz do projeto.`)
  }
  const vars: Record<string, string> = {}
  for (const line of readFileSync(file, 'utf-8').split(/\r?\n/)) {
    const match = /^([A-Z_]+)=(.*)$/.exec(line)
    if (match) vars[match[1]] = match[2].trim()
  }
  return vars
}

function apiTarget(): string {
  if (process.env.API_TARGET) return process.env.API_TARGET
  const ambiente = process.env.AMBIENTE || 'dev'
  if (!AMBIENTES.includes(ambiente)) {
    throw new Error(`AMBIENTE inválido: "${ambiente}". Use dev, homolog ou prod.`)
  }
  const vars = readEnvFile(ambiente)
  return ambiente === 'prod' ? vars.APP_BASE_URL : `http://localhost:${vars.API_PORT}`
}

export default defineConfig(({ command }) => {
  // O proxy só existe no "npm run dev"; o build (Docker) não precisa de .env nenhum.
  const target = command === 'serve' ? apiTarget() : undefined
  // No "npm run dev", a chave do MapTiler vem do mesmo .env do AMBIENTE (no build do Docker ela
  // chega pela variável VITE_MAPTILER_KEY, ver Dockerfile).
  if (command === 'serve' && !process.env.VITE_MAPTILER_KEY && !process.env.API_TARGET) {
    const key = readEnvFile(process.env.AMBIENTE || 'dev').MAPTILER_KEY
    if (key) process.env.VITE_MAPTILER_KEY = key
  }
  if (target) console.log(`\n  AMBIENTE=${process.env.AMBIENTE || 'dev'}  →  /api vai para ${target}\n`)

  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.svg'],
        manifest: {
          id: '/',
          name: 'RachaAi',
          short_name: 'RachaAi',
          description: 'Encontre com quem dividir o aluguel',
          lang: 'pt-BR',
          start_url: '/',
          display: 'standalone',
          background_color: '#faf7f2',
          // o manifest não aceita cor por tema: fica a clara (igual ao splash); no navegador
          // as metas theme-color do index.html seguem o tema
          theme_color: '#faf7f2',
          icons: [
            { src: '/pwa-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Só o "app shell" (HTML/JS/CSS/ícones) entra em cache; chamadas a /api nunca ficam
          // em cache, sempre vão para a rede (dados de usuário não podem ficar desatualizados).
          globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
          // O 3D da landing (model-viewer/Three.js, ~1 MB) não entra no app shell: só quem
          // abre a landing baixa, e quem instala o app não leva esse peso.
          globIgnores: ['**/model-viewer-*.js', '**/Landing3D-*.{js,css}'],
          navigateFallbackDenylist: [/^\/api\//],
        },
      }),
    ],
    server: target
      ? {
          proxy: {
            '/api': {
              target,
              changeOrigin: true,
              // Tira o cabeçalho Origin: para o backend a chamada vem do próprio proxy, não do
              // localhost:5173, então funciona com qualquer ambiente sem mexer no CORS dele.
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => proxyReq.removeHeader('origin'))
              },
            },
          },
        }
      : undefined,
  }
})
