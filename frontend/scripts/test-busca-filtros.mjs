// Teste de ponta a ponta da busca em tela cheia (filtros na lateral / gaveta no celular).
//   node frontend/scripts/test-busca-filtros.mjs          (ambiente dev em :8082 com o seed)
// Só navega, clica e usa o teclado: nada é enviado. Capturas em docs/capturas/telas-etapa-1/.
import { createRequire } from 'node:module'
import { mkdirSync } from 'node:fs'
const require = createRequire(new URL('../../marketing/package.json', import.meta.url))
const { chromium } = require('playwright-core')

const BASE = process.env.BASE ?? 'http://localhost:8082'
const OUT = new URL('../../docs/capturas/telas-etapa-1/', import.meta.url)
mkdirSync(OUT, { recursive: true })
const file = (n) => decodeURIComponent(new URL(`${n}.png`, OUT).pathname).replace(/^\/([A-Za-z]:)/, '$1')
const r = await fetch(`${BASE}/api/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: 'rita.alugar@teste.com', password: 'senha123' }) })
const token = (await r.json()).token

let fails = 0
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FALHOU'} ${msg}`); if (!cond) fails++ }
const b = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true })
async function open(w, h, theme = 'claro', path = '/browse') {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, colorScheme: theme === 'escuro' ? 'dark' : 'light' })
  await ctx.addInitScript(([tk, th]) => { localStorage.setItem('rachaai_token', tk); localStorage.setItem('rachaai_theme', th) }, [token, theme === 'escuro' ? 'dark' : 'light'])
  const p = await ctx.newPage()
  const errors = []
  p.on('pageerror', (e) => errors.push(e.message))
  await p.goto(BASE + path, { waitUntil: 'load' })
  await p.waitForTimeout(1600)
  return { p, ctx, errors }
}
const header = async (p) => (await p.locator('h1 + p').textContent())?.trim() ?? ''
const n = (t) => Number(/^(\d+)/.exec(t)?.[1] ?? NaN)
const prices = async (p) => p.locator('[data-preco]').evaluateAll((els) => els.map((e) => Number(e.getAttribute('data-preco'))))

// ---------- computador (1440) ----------
{
  const { p, ctx, errors } = await open(1440, 900)
  const aside = p.getByRole('complementary', { name: 'Filtros' })
  ok(await aside.isVisible(), 'barra de filtros aparece na lateral')
  const total = n(await header(p))
  ok(total > 0, `cabeçalho conta os anúncios: "${await header(p)}"`)

  const hi = aside.getByRole('slider', { name: /máximo/ })
  const before = Number(await hi.inputValue())
  await hi.focus()
  ok(before === 4000 && Number(await hi.getAttribute('min')) === 0, `barra vai de R$ 0 a R$ 4.000 (máx. ${before})`)
  // de 4.000 até 600: 68 passos de 50, apertando rápido (não pode perder passo)
  for (let i = 0; i < 68; i++) await p.keyboard.press('ArrowLeft')
  await p.waitForTimeout(400)
  ok(Number(await hi.inputValue()) === 600, `alça de valor pelo teclado (${before} → ${await hi.inputValue()})`)
  ok(n(await header(p)) < total && (await header(p)).includes('no total'), `lista filtra ao vivo: "${await header(p)}"`)
  ok(p.url().includes('max='), 'endereço guarda o valor')

  await aside.getByRole('button', { name: /^70%\+/ }).click()
  await p.waitForTimeout(300)
  ok(p.url().includes('compat=70'), 'compatibilidade mínima grava ?compat=70')
  ok(await p.getByRole('button', { name: /Remover filtro: 70%\+/ }).count() === 1, 'chip "70%+ compatível" aparece')

  await p.getByRole('button', { name: 'Limpar filtros' }).click()
  await p.waitForTimeout(300)
  ok(n(await header(p)) === total, 'limpar filtros volta ao total')

  await p.getByLabel('Ordenar por').selectOption('menor')
  await p.waitForTimeout(400)
  ok(p.url().includes('ordem=menor'), 'ordenar grava ?ordem=menor')
  const ps = await prices(p)
  ok(ps.length > 1 && ps.every((v, i) => i === 0 || ps[i - 1] <= v), `ordem por menor valor: ${ps.join(', ')}`)

  // bairro: sugestões dos anúncios já das primeiras letras, sem acento importar
  await p.getByLabel('Ordenar por').selectOption('compat')
  const bairro = aside.getByPlaceholder('Bairro ou faculdade')
  await bairro.click()
  await bairro.pressSequentially('zon', { delay: 60 })
  await p.waitForTimeout(500)
  const sugestoes = await aside.locator('ul button').allTextContents()
  ok(sugestoes.some((t) => /zona/i.test(t)), `sugestões ao digitar "zon": ${sugestoes.slice(0, 4).join(' | ')}`)
  await aside.locator('ul button').first().click()
  await p.waitForTimeout(1200)
  ok(p.url().includes('bairro=') && n(await header(p)) >= 1, `escolher a sugestão filtra a lista: "${await header(p)}"`)

  ok(errors.length === 0, `sem erro no console (${errors.join(' | ') || 'nenhum'})`)
  await ctx.close()
}

// ---------- celular (390) ----------
{
  const { p, ctx, errors } = await open(390, 844)
  ok(!(await p.getByRole('complementary', { name: 'Filtros' }).isVisible()), 'no celular a lateral some')
  await p.getByRole('button', { name: /^Filtros/ }).click()
  await p.waitForTimeout(600)
  const sheet = p.getByRole('dialog', { name: 'Filtros' })
  ok(await sheet.isVisible(), 'botão "Filtros" abre a gaveta')
  await p.screenshot({ path: file('busca-390-claro-gaveta') })
  const hi = sheet.getByRole('slider', { name: /máximo/ })
  await hi.focus()
  for (let i = 0; i < 2; i++) await p.keyboard.press('ArrowLeft')
  await p.waitForTimeout(300)
  const footer = await sheet.getByRole('button', { name: /^Ver / }).textContent()
  ok(/^Ver \d+ anúncio/.test(footer ?? ''), `rodapé mostra quantos ficam: "${footer}"`)
  await sheet.getByRole('button', { name: /^Ver / }).click()
  await p.waitForTimeout(600)
  ok(!(await sheet.isVisible()), '"Ver N anúncios" fecha a gaveta')
  ok(await p.getByRole('button', { name: /Remover filtro/ }).count() >= 1, 'chip do filtro aparece na lista')
  ok((await p.getByRole('button', { name: /^Filtros/ }).textContent())?.includes('1'), 'botão mostra quantos filtros estão ligados')
  await p.getByRole('button', { name: /^Filtros/ }).click()
  await p.waitForTimeout(500)
  await p.keyboard.press('Escape')
  await p.waitForTimeout(500)
  ok(!(await sheet.isVisible()), 'Esc fecha a gaveta')
  ok(errors.length === 0, `sem erro no console (${errors.join(' | ') || 'nenhum'})`)
  await ctx.close()
}

// ---------- capturas ----------
for (const [w, h] of [[390, 844], [1440, 900], [1920, 1080]]) {
  for (const theme of ['claro', 'escuro']) {
    if (w === 1920 && theme === 'escuro') continue
    const { p, ctx } = await open(w, h, theme, '/browse?min=500&max=650&compat=70')
    await p.screenshot({ path: file(`busca-${w}-${theme}`) })
    await ctx.close()
  }
}
await b.close()
console.log(fails ? `\n${fails} falha(s)` : '\ntudo certo')
process.exit(fails ? 1 : 0)
