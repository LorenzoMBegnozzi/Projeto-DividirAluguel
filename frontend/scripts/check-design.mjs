// Checagem do design system: falha se estilo solto voltar ao código.
//   node scripts/check-design.mjs            → lista as violações e sai com erro se houver
//   node scripts/check-design.mjs --report   → só conta por regra/arquivo (não falha)
// Regras (docs/10-DESIGN-SYSTEM.md, "Proibido"):
//   cor          hex/rgb()/hsl() fora de src/index.css
//   style        style={{…}} com cor, espaço, tipografia ou camada (largura/altura dinâmica,
//                transform, opacity e variáveis --x continuam permitidos)
//   paleta-crua  classes de paleta do Tailwind (bg-gray-*, text-white, border-blue-500…)
//   arbitrario   text-[…], leading-[…], tracking-[…], rounded-[…], shadow-[…], z-[…], font-[…], bg-[#…]
//   serif        font-serif (o sistema usa uma família só)
//   css-*        no CSS (fora do index.css): font-size, font-family, z-index e border-radius com número
// Exceção pontual: comentário `design-ok: motivo` na mesma linha (e anote no docs).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const ROOT = new URL('../src/', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')
const REPORT = process.argv.includes('--report')

const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? walk(p) : [p] })
const files = walk(ROOT).filter((f) => /\.(tsx?|css)$/.test(f) && !f.endsWith('.d.ts'))

const PALETTE = 'gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const rules = [
  { id: 'cor', test: (l, f) => !f.endsWith('index.css') && /#[0-9a-fA-F]{3,8}\b(?![\w-])|\b(?:rgba?|hsla?)\(/.test(l) && !/^\s*(\/\/|\*|\/\*)/.test(l) },
  { id: 'style', tsx: true, test: (l) => /style=\{\{[^}]*\b(color|background|border|margin|padding|gap|font\w*|lineHeight|letterSpacing|zIndex|fill|stroke|boxShadow|borderRadius)\s*:/.test(l) },
  { id: 'paleta-crua', tsx: true, test: (l) => new RegExp(`(?<![\\w-])(?:bg|text|border|ring|from|to|via|fill|stroke|outline|divide|accent|decoration)-(?:(?:${PALETTE})-\\d{2,3}|black|white)(?![\\w-])`).test(l) },
  { id: 'arbitrario', tsx: true, test: (l) => /(?<![\w-])(?:text|leading|tracking|rounded(?:-[trbl]{1,2})?|shadow|z|font)-\[[^\]]+\]|bg-\[#/.test(l) },
  { id: 'serif', tsx: true, test: (l) => /(?<![\w-])font-serif(?![\w-])/.test(l) },
  { id: 'css-font-size', css: true, test: (l) => /font-size:(?!\s*var\()/.test(l) },
  { id: 'css-font-family', css: true, test: (l) => /font-family:(?!\s*(?:var\(|inherit))/.test(l) },
  { id: 'css-z-index', css: true, test: (l) => /z-index:(?!\s*(?:var\(|calc\(var\(|auto|inherit|0\b|-1\b|1\b))/.test(l) },
  { id: 'css-radius', css: true, test: (l) => /border-radius:(?![^;]*(?:var\(|inherit|50%|999px|0;|0 ))[^;]*\d+px/.test(l) },
]

const hits = []
for (const f of files) {
  const rel = relative(ROOT, f).replace(/\\/g, '/')
  const isCss = f.endsWith('.css'), isTsx = /\.tsx?$/.test(f)
  if (isCss && rel === 'index.css') continue
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (line.includes('design-ok:')) return
    for (const r of rules) {
      if (r.tsx && !isTsx) continue
      if (r.css && !isCss) continue
      if (r.test(line, rel)) hits.push({ rule: r.id, at: `${rel}:${i + 1}`, line: line.trim().slice(0, 140) })
    }
  })
}

if (REPORT) {
  const by = (k) => Object.entries(hits.reduce((a, h) => ((a[h[k]] = (a[h[k]] ?? 0) + 1), a), {})).sort((a, b) => b[1] - a[1])
  console.log(`design: ${hits.length} violações`)
  for (const [r, n] of by('rule')) console.log(`  ${String(n).padStart(4)}  ${r}`)
  console.log('  por arquivo:')
  for (const [f, n] of Object.entries(hits.reduce((a, h) => { const k = h.at.split(':')[0]; a[k] = (a[k] ?? 0) + 1; return a }, {})).sort((a, b) => b[1] - a[1])) console.log(`  ${String(n).padStart(4)}  ${f}`)
  process.exit(0)
}
if (hits.length) {
  for (const h of hits) console.error(`${h.at}  [${h.rule}]  ${h.line}`)
  console.error(`\n✗ design: ${hits.length} violações. Use os tokens do @theme e os primitivos de components/ui (docs/10-DESIGN-SYSTEM.md).`)
  process.exit(1)
}
console.log('✓ design: nenhuma violação')
