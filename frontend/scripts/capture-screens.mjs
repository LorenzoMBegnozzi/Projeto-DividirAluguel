// Capturas de todas as telas em 390 e 1440, claro e escuro (design system: antes/depois).
// Uso (com o ambiente dev no ar em :8082 e o seed rodado):
//   node scripts/capture-screens.mjs antes      →  docs/capturas/design-system/antes/
//   node scripts/capture-screens.mjs depois [filtro]
// Loga pela API com as contas de exemplo do seed (senha123) e põe o token no localStorage;
// não preenche nem envia formulário nenhum (nada de e-mail disparado).
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const require = createRequire(new URL('../../marketing/package.json', import.meta.url))
const { chromium } = require('playwright-core')

const BASE = process.env.BASE ?? 'http://localhost:8082'
const STAGE = process.argv[2] ?? 'antes'
const FILTER = process.argv[3] ?? ''
const OUT = new URL(`../../docs/capturas/design-system/${STAGE}/`, import.meta.url)
mkdirSync(OUT, { recursive: true })

async function token(email) {
  const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, password: 'senha123' }) })
  if (!r.ok) throw new Error(`login ${email}: ${r.status}`)
  return (await r.json()).token
}
const api = async (tk, path) => (await fetch(`${BASE}/api${path}`, { headers: { Authorization: `Bearer ${tk}` } })).json()

const T = {
  rita: await token('rita.alugar@teste.com'),
  novato: await token('novato.alugar@teste.com'),
  bia: await token('bia.vaga@teste.com'),
  admin: await token('admin@teste.com'),
}
// ids reais para as telas com parâmetro
const convs = await api(T.rita, '/conversations').catch(() => [])
const firstConv = Array.isArray(convs) && convs[0] ? convs[0].id : null
const mine = await api(T.bia, '/listings/mine').catch(() => [])
const firstListing = Array.isArray(mine) && mine[0] ? mine[0].id : null
const ownerId = Array.isArray(mine) && mine[0] ? (mine[0].ownerId ?? mine[0].userId ?? mine[0].owner?.id) : null

const screens = [
  // [nome, rota, conta, página inteira?]
  ['landing', '/', null, false],
  ['login', '/login', null, true],
  ['registro', '/registro', null, true],
  ['esqueci-senha', '/esqueci-senha', null, true],
  ['redefinir-senha', '/redefinir-senha/exemplo', null, true],
  ['confirmar-email', '/confirmar-email/exemplo', null, true],
  ['termos', '/termos', null, false],
  ['browse', '/browse', 'rita', true],
  ['perfil', '/perfil', 'rita', true],
  ['conversas', '/conversas', 'rita', true],
  ['chat', firstConv ? `/conversas/${firstConv}` : '/conversas', 'rita', false],
  ['anuncio-detalhe', firstListing ? `/anuncios/${firstListing}` : '/browse', 'rita', true],
  ['usuario-publico', ownerId ? `/usuarios/${ownerId}` : '/perfil', 'rita', true],
  ['onboarding', '/onboarding', 'novato', true],
  ['meus-anuncios', '/anuncio', 'bia', true],
  ['pagamentos', '/pagamentos', 'bia', true],
  ['pagamento-retorno', '/pagamentos/retorno', 'bia', true],
  ['admin', '/admin', 'admin', true],
].filter(([n]) => !FILTER || n.includes(FILTER))

const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
for (const [name, route, who, full] of screens) {
  for (const [w, h] of [[390, 844], [1440, 900]]) {
    for (const theme of ['claro', 'escuro']) {
      const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme === 'escuro' ? 'dark' : 'light' })
      await ctx.addInitScript(([tk, th]) => {
        localStorage.setItem('rachaai_theme', th)
        if (tk) localStorage.setItem('rachaai_token', tk); else localStorage.removeItem('rachaai_token')
      }, [who ? T[who] : null, theme === 'escuro' ? 'dark' : 'light'])
      const p = await ctx.newPage()
      await p.goto(BASE + route, { waitUntil: 'load', timeout: 120000 })
      await p.waitForTimeout(name === 'landing' ? 3500 : 1800)
      await p.screenshot({ path: new URL(`${name}-${w}-${theme}.png`, OUT).pathname.slice(1), fullPage: full })
      await ctx.close()
    }
  }
  console.log('ok', name)
}
await b.close()
