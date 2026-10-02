// Renderiza as artes do Instagram: templates/*.html → saida/
//   imagem estática  → <nome>.png
//   carrossel        → <nome>-1.png, <nome>-2.png, ...
//   vídeo (Reels)    → <nome>.mp4 (H.264, 30 fps) + <nome>-capa.jpg
//
// Uso:  node render.mjs            (todas)
//       node render.mjs reel-01    (só as que contêm "reel-01" no nome)
//
// Usa o Chrome já instalado (headless, perfil temporário) via playwright-core e
// codifica o MP4 no próprio Chrome (WebCodecs). Nenhum programa extra é baixado.
import http from 'node:http'
import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'
import { chromium } from 'playwright-core'

const ROOT = resolve(import.meta.dirname, '..')          // raiz do projeto (acessa frontend/public e node_modules)
const OUT = join(import.meta.dirname, 'saida')
const FRAMES = join(OUT, '.frames')
const FPS = 30

const MIME = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.glb': 'model/gltf-binary', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.json': 'application/json', '.svg': 'image/svg+xml' }

const server = http.createServer(async (req, res) => {
  try {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^([/\\])+/, '')
    const file = join(ROOT, path)
    if (!file.startsWith(ROOT)) throw new Error('fora da raiz')
    const data = await readFile(file)
    res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' })
    res.end(data)
  } catch {
    res.writeHead(404); res.end()
  }
})
await new Promise((r) => server.listen(0, '127.0.0.1', r))
const base = `http://127.0.0.1:${server.address().port}`

const filter = process.argv[2]
const templates = (await readdir(join(import.meta.dirname, 'templates')))
  .filter((f) => f.endsWith('.html') && !f.startsWith('_') && (!filter || f.includes(filter)))
  .sort()

await mkdir(OUT, { recursive: true })
const browser = await chromium.launch({ channel: 'chrome', headless: true })
const kb = (n) => `${(n / 1024).toFixed(0)} KB`

try {
  for (const file of templates) {
    const name = file.replace(/\.html$/, '')
    const page = await browser.newPage({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })
    page.on('pageerror', (e) => console.error(`  [${name}] erro na página:`, e.message))
    await page.goto(`${base}/marketing/templates/${file}`)
    await page.waitForFunction(() => window.SCENE)
    const scene = await page.evaluate(() => ({ width: SCENE.width, height: SCENE.height, duration: SCENE.duration ?? 0, slides: SCENE.slides ?? 0, cover: SCENE.cover ?? 0 }))
    await page.setViewportSize({ width: scene.width, height: scene.height })
    await page.evaluate(() => SCENE.setup())
    const t0 = Date.now()

    if (scene.slides) {
      for (let i = 0; i < scene.slides; i++) {
        await page.evaluate((i) => SCENE.render(i), i)
        const out = join(OUT, `${name}-${i + 1}.png`)
        await page.screenshot({ path: out, type: 'png' })
        console.log(`  ${name}-${i + 1}.png  ${kb((await stat(out)).size)}`)
      }
    } else if (!scene.duration) {
      await page.evaluate(() => SCENE.render(SCENE.still ?? 0))
      const out = join(OUT, `${name}.png`)
      await page.screenshot({ path: out, type: 'png' })
      console.log(`  ${name}.png  ${kb((await stat(out)).size)}`)
    } else {
      const dir = join(FRAMES, name)
      await rm(dir, { recursive: true, force: true })
      await mkdir(dir, { recursive: true })
      const count = Math.round(scene.duration * FPS)
      for (let i = 0; i < count; i++) {
        await page.evaluate((t) => SCENE.render(t), i / FPS)
        await page.screenshot({ path: join(dir, `${String(i).padStart(5, '0')}.jpg`), type: 'jpeg', quality: 92 })
        if (i % 60 === 0) process.stdout.write(`  ${name}: quadro ${i}/${count}\r`)
      }
      // capa do Reels
      await page.evaluate((t) => SCENE.render(t), scene.cover)
      await page.screenshot({ path: join(OUT, `${name}-capa.jpg`), type: 'jpeg', quality: 92 })

      const enc = await browser.newPage()
      await enc.goto(`${base}/marketing/encoder.html`)
      await enc.waitForFunction(() => window.encoderReady)
      const { codec, base64 } = await enc.evaluate((opts) => window.encode(opts), {
        dir: `/marketing/saida/.frames/${name}`, count, width: scene.width, height: scene.height, fps: FPS, bitrate: 10_000_000,
      })
      const out = join(OUT, `${name}.mp4`)
      await writeFile(out, Buffer.from(base64, 'base64'))
      await enc.close()
      await rm(dir, { recursive: true, force: true })
      console.log(`  ${name}.mp4  ${kb((await stat(out)).size)}  ${scene.duration}s ${FPS}fps ${codec}  (${((Date.now() - t0) / 1000).toFixed(0)}s)        `)
    }
    await page.close()
  }
} finally {
  await browser.close()
  server.close()
  await rm(FRAMES, { recursive: true, force: true })
}
