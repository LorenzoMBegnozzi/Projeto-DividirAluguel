// Teste de ponta a ponta das telas do login com Google (sem o Google de verdade).
//   node frontend/scripts/test-login-google.mjs        (ambiente dev em :8082 com o seed)
// O popup do Google não dá para automatizar: o teste simula o que vem depois dele.
//   1. sem GOOGLE_CLIENT_ID → o botão não aparece; com Client ID → aparece no login e no cadastro
//   2. tela "falta pouco": sem cadastro pendente volta para o login; com pendente, pede perfil,
//      nascimento, CPF e termos, manda para /api/auth/google/cadastro e entra na conta
// Nenhum cadastro de verdade é criado: a resposta do /google/cadastro é simulada com o login de
// uma conta do seed.
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../marketing/package.json', import.meta.url))
const { chromium } = require('playwright-core')

const BASE = process.env.BASE ?? 'http://localhost:8082'
let fails = 0
const ok = (cond, msg) => { console.log(`${cond ? 'ok  ' : 'FALHOU'} ${msg}`); if (!cond) fails++ }

const seedLogin = await (await fetch(`${BASE}/api/auth/login`, {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'rita.alugar@teste.com', password: 'senha123' }),
})).json()

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' })

// ---------- 1. botão aparece só com Client ID ----------
{
  const page = await browser.newPage()
  const real = await (await fetch(`${BASE}/api/auth/google/config`)).json()
  await page.goto(`${BASE}/login`)
  await page.waitForTimeout(1200)
  if (!real.clientId) ok(await page.getByText('ou', { exact: true }).count() === 0, 'sem GOOGLE_CLIENT_ID o login não mostra o Google')
  await page.route('**/api/auth/google/config', (r) => r.fulfill({ json: { clientId: 'teste-123.apps.googleusercontent.com' } }))
  await page.reload()
  await page.waitForTimeout(2500)
  ok(await page.locator('iframe[src*="accounts.google.com"]').count() >= 1, 'com Client ID o botão do Google aparece no login')
  await page.goto(`${BASE}/registro?perfil=procurar`)
  await page.waitForTimeout(2500)
  ok(await page.locator('iframe[src*="accounts.google.com"]').count() >= 1, 'e no cadastro')
  await page.close()
}

// ---------- 2. tela "falta pouco" ----------
{
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } })
  await page.goto(`${BASE}/completar-cadastro`)
  await page.waitForTimeout(800)
  ok(page.url().endsWith('/login'), 'sem cadastro pendente, /completar-cadastro volta para o login')

  await page.evaluate(() => sessionStorage.setItem('rachaai_google_signup', JSON.stringify({
    signupToken: 'comprovante-de-teste', name: 'Pessoa Google', email: 'pessoa.google@gmail.com', role: null,
  })))
  let sent = null
  await page.route('**/api/auth/google/cadastro', async (r) => {
    sent = r.request().postDataJSON()
    await r.fulfill({ json: seedLogin })
  })
  await page.goto(`${BASE}/completar-cadastro`)
  await page.waitForTimeout(800)
  ok(await page.getByRole('heading', { name: 'Falta pouco' }).isVisible(), 'mostra "Falta pouco" com nome e e-mail do Google')
  const submit = page.getByRole('button', { name: 'Criar minha conta' })
  ok(await submit.isDisabled(), 'enviar fica desligado até escolher o perfil e aceitar os termos')

  await page.getByRole('button', { name: /Tenho vaga/ }).click()
  await page.getByLabel('Data de nascimento').fill('1998-04-20')
  await page.getByLabel('CPF').fill('52998224725')
  ok(await page.getByLabel('CPF').inputValue() === '529.982.247-25', 'CPF é formatado enquanto digita')
  await page.getByRole('checkbox').check()
  ok(await submit.isDisabled(), 'anunciante precisa escolher vaga ou imóvel inteiro')
  await page.getByRole('button', { name: /Vaga pra dividir/ }).click()
  await page.screenshot({ path: decodeURIComponent(new URL('../../docs/capturas/telas-etapa-1/falta-pouco-390.png', import.meta.url).pathname).replace(/^\/([A-Za-z]:)/, '$1') }).catch(() => {})
  await page.getByRole('button', { name: /Procuro vaga/ }).click()
  await submit.click()
  await page.waitForTimeout(1500)
  ok(sent && sent.signupToken === 'comprovante-de-teste' && sent.cpf === '52998224725' && sent.role === 'RENTER'
    && sent.birthDate === '1998-04-20' && sent.acceptTerms === true && sent.advertiserKind === null,
    `envia o que foi preenchido: ${JSON.stringify(sent)}`)
  ok(!page.url().includes('/completar-cadastro') && !page.url().endsWith('/login'), `entra na conta depois de completar (${page.url()})`)
  ok(await page.evaluate(() => sessionStorage.getItem('rachaai_google_signup')) === null, 'o cadastro pendente é apagado')
  await page.close()
}

await browser.close()
console.log(fails ? `\n${fails} falha(s)` : '\ntudo certo')
process.exit(fails ? 1 : 0)
