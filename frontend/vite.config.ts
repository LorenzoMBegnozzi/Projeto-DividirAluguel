import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

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
    plugins: [react(), tailwindcss()],
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
