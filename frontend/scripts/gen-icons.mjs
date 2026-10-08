// Gera os PNG do PWA e o apple-touch-icon a partir de public/pwa-icon.svg (mesma porta dupla da LogoMark).
//   node scripts/gen-icons.mjs   (usa o playwright-core de ../marketing e o Chrome instalado)
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
const require = createRequire(new URL('../../marketing/package.json', import.meta.url))
const { chromium } = require('playwright-core')

const pub = new URL('../public/', import.meta.url)
const pwa = readFileSync(new URL('pwa-icon.svg', pub), 'utf8')
// no apple-touch-icon o iOS não recorta em círculo: o desenho pode ocupar 60% do lado
const apple = pwa.replace('translate(121 82.75) scale(2.25)', 'translate(94 48.1) scale(2.7)')
const jobs = [[pwa, 192, 'pwa-192x192.png'], [pwa, 512, 'pwa-512x512.png'], [apple, 180, 'apple-touch-icon.png']]

const browser = await chromium.launch({ executablePath: process.env.CHROME ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe' })
const page = await browser.newPage()
for (const [svg, size, out] of jobs) {
  await page.setViewportSize({ width: size, height: size })
  await page.setContent(`<style>*{margin:0}svg{display:block;width:${size}px;height:${size}px}</style>${svg}`)
  await page.screenshot({ path: new URL(out, pub).pathname.replace(/^\/([A-Za-z]:)/, '$1') })
  console.log('ok', out)
}
await browser.close()
