// Capturas das telas do app em tela cheia (1440 e 1920) e no celular (390), tema claro, e
// conferência de que nada sai da largura da tela (sem rolagem lateral).
//   node frontend/scripts/capturas-tela-cheia.mjs [filtro]      (ambiente dev em :8082 com o seed)
// Loga pela API com as contas de teste do seed (senha123); só navega, não envia nada.
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const require = createRequire(new URL('../../marketing/package.json', import.meta.url))
const { chromium } = require('playwright-core')

const BASE = process.env.BASE ?? 'http://localhost:8082'
const FILTER = process.argv[2] ?? ''
const OUT = new URL('../../docs/capturas/telas-etapa-1/tela-cheia/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const file = (n) => decodeURIComponent(new URL(`${n}.png`, OUT).pathname).replace(/^\/([A-Za-z]:)/, '$1')

async function token(email) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'senha123' }) })
  return (await r.json()).token
}
const api = async (tk, path) => (await fetch(`${BASE}/api${path}`, { headers: { Authorization: `Bearer ${tk}` } })).json()
const T = { rita: await token('rita.alugar@teste.com'), bia: await token('bia.vaga@teste.com'), admin: await token('admin@teste.com') }
const convs = await api(T.rita, '/conversations').catch(() => [])
const conv = Array.isArray(convs) && convs[0] ? convs[0].id : null
const mine = await api(T.bia, '/listings/mine').catch(() => [])
const listing = Array.isArray(mine) && mine[0] ? mine[0] : null
const owner = listing ? (listing.userId ?? listing.ownerId) : null

const screens = [
  ['conversas', '/conversas', 'rita'],
  ['chat', conv ? `/conversas/${conv}` : '/conversas', 'rita'],
  ['meus-anuncios', '/anuncio', 'bia'],
  ['perfil', '/perfil', 'rita'],
  ['usuario', owner ? `/usuarios/${owner}` : '/perfil', 'rita'],
  ['anuncio', listing ? `/anuncios/${listing.id}` : '/browse', 'rita'],
  ['pagamentos', '/pagamentos', 'bia'],
  ['admin', '/admin', 'admin'],
].filter(([n]) => n.includes(FILTER))

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
let problems = 0
for (const [name, route, who] of screens) {
  for (const [w, h] of [[1440, 900], [1920, 1080], [390, 844]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } })
    await ctx.addInitScript((tk) => { localStorage.setItem('rachaai_token', tk); localStorage.setItem('rachaai_theme', 'light') }, T[who])
    const p = await ctx.newPage()
    const errors = []
    p.on('pageerror', (e) => errors.push(e.message))
    await p.goto(BASE + route, { waitUntil: 'load' })
    await p.waitForTimeout(1800)
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    if (overflow > 0 || errors.length) { problems++; console.log(`  ! ${name} ${w}: ${overflow > 0 ? `rolagem lateral de ${overflow}px ` : ''}${errors.join(' | ')}`) }
    await p.screenshot({ path: file(`${name}-${w}`) })
    await ctx.close()
  }
  console.log('ok', name)
}
await b.close()
console.log(problems ? `${problems} problema(s)` : 'sem rolagem lateral nem erro de página')
