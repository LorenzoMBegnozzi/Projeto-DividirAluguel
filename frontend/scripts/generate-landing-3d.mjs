// Gera os modelos 3D da landing (public/landing/), sem depender de download:
//   apartment.glb  apartamento em corte, com DOIS quartos espelhados (nós "left" e
//                  "right") e a animação "split", que afasta as metades. O front-end
//                  não toca a animação: controla o quadro (currentTime 0..1) pelo GSAP.
//                  O material "accent" (cobertor, moldura da janela, tapete) é
//                  recolorido em runtime conforme o modo (procurar/anunciar).
//   house.glb      casinha usada como partícula (material branco, tingido em runtime)
//
// Rodar:  node scripts/generate-landing-3d.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { Document, NodeIO } from '@gltf-transform/core'

const OUT = new URL('../public/landing/', import.meta.url)
await mkdir(OUT, { recursive: true })

// ---------------------------------------------------------------------------
// Geometria: caixas (24 vértices, normais planas) e faces livres
// ---------------------------------------------------------------------------
function box([cx, cy, cz], [sx, sy, sz]) {
  const x = sx / 2, y = sy / 2, z = sz / 2
  const faces = [
    [[1, 0, 0], [[x, -y, z], [x, -y, -z], [x, y, -z], [x, y, z]]],
    [[-1, 0, 0], [[-x, -y, -z], [-x, -y, z], [-x, y, z], [-x, y, -z]]],
    [[0, 1, 0], [[-x, y, z], [x, y, z], [x, y, -z], [-x, y, -z]]],
    [[0, -1, 0], [[-x, -y, -z], [x, -y, -z], [x, -y, z], [-x, -y, z]]],
    [[0, 0, 1], [[-x, -y, z], [x, -y, z], [x, y, z], [-x, y, z]]],
    [[0, 0, -1], [[x, -y, -z], [-x, -y, -z], [-x, y, -z], [x, y, -z]]],
  ]
  return faces.map(([n, quad]) => ({ n, pts: quad.map(([a, b, c]) => [a + cx, b + cy, c + cz]) }))
}

// polígono convexo plano (triângulo ou quad) com normal calculada
function face(pts) {
  const [a, b, c] = pts
  const u = b.map((v, i) => v - a[i]), w = c.map((v, i) => v - a[i])
  const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
  const len = Math.hypot(...n) || 1
  return [{ n: n.map((v) => v / len), pts }]
}

function toArrays(faceList) {
  const pos = [], nor = [], idx = []
  for (const { n, pts } of faceList) {
    const base = pos.length / 3
    for (const p of pts) { pos.push(...p); nor.push(...n) }
    for (let i = 1; i < pts.length - 1; i++) idx.push(base, base + i, base + i + 1)
  }
  return { pos, nor, idx }
}

// ---------------------------------------------------------------------------
// glTF
// ---------------------------------------------------------------------------
const doc = new Document()
const buffer = doc.createBuffer()
const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer)
const srgb = (hex) => hex.match(/\w\w/g).map((h) => (parseInt(h, 16) / 255) ** 2.2)
const mat = (name, hex, { rough = 0.8, metal = 0 } = {}) =>
  doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setRoughnessFactor(rough).setMetallicFactor(metal)

const M = {
  accent: mat('accent', '237fa4', { rough: 0.6 }),   // recolorido em runtime
  wall: mat('wall', 'f3efe8'),
  floor: mat('floor', 'c89f74', { rough: 0.55 }),
  wood: mat('wood', '7d5c43', { rough: 0.6 }),
  white: mat('linen', 'fbfbfa', { rough: 0.9 }),
  desk: mat('desk', 'dcc6a6', { rough: 0.5 }),
  rug: mat('rug', 'e6dccf', { rough: 1 }),
  glass: mat('glass', 'bfe3f2', { rough: 0.1 }),
  pot: mat('pot', 'c0673f'),
  plant: mat('plant', '3f9a63', { rough: 0.7 }),
}

/** Um quarto (metade do apartamento). side = 1 (direita) ou -1 (esquerda, espelhado). */
function room(side) {
  const parts = {}   // material → lista de faces
  const add = (m, f) => (parts[m] ??= []).push(...f)
  const X = (x) => x * side
  const b = (m, [x, y, z], s) => add(m, box([X(x), y, z], s))
  const H = 2.2, T = 0.1, D = 2.6

  b('floor', [1, -0.06, 0], [2, 0.12, D])
  b('wall', [1, H / 2, -D / 2 + T / 2], [2, H, T])            // fundo
  b('wall', [2 - T / 2, H / 2, 0], [T, H, D])                  // externa
  b('wall', [T / 4, H / 2, -0.55], [T / 2, H, 1.5])            // meia parede central (com vão de porta)
  b('wall', [T / 4, H - 0.2, 0.55], [T / 2, 0.4, 0.7])         // verga da porta
  // janela
  b('accent', [1.05, 1.35, -D / 2 + T + 0.015], [0.95, 0.75, 0.03])
  b('glass', [1.05, 1.35, -D / 2 + T + 0.035], [0.8, 0.6, 0.02])
  // cama
  b('wood', [1.35, 0.17, -0.3], [0.95, 0.34, 1.9])
  b('white', [1.35, 0.41, -0.3], [0.9, 0.14, 1.85])
  b('accent', [1.35, 0.5, 0.08], [0.94, 0.05, 1.12])
  b('white', [1.35, 0.53, -0.98], [0.62, 0.1, 0.32])
  b('wood', [1.35, 0.6, -1.22], [0.95, 0.85, 0.06])            // cabeceira
  // escrivaninha
  b('desk', [0.5, 0.76, -0.98], [0.72, 0.05, 0.5])
  for (const [dx, dz] of [[-0.31, -0.2], [0.31, -0.2], [-0.31, 0.2], [0.31, 0.2]]) b('wood', [0.5 + dx, 0.37, -0.98 + dz], [0.04, 0.74, 0.04])
  b('wood', [0.55, 0.95, -1.12], [0.34, 0.3, 0.03])            // "notebook"
  // tapete e planta
  b('rug', [0.8, 0.006, 0.62], [1.15, 0.012, 0.85])
  b('accent', [0.8, 0.013, 0.62], [0.95, 0.004, 0.65])
  b('pot', [0.32, 0.15, 1.02], [0.26, 0.3, 0.26])
  b('plant', [0.32, 0.45, 1.02], [0.36, 0.34, 0.36])
  b('plant', [0.32, 0.7, 1.02], [0.22, 0.2, 0.22])

  const mesh = doc.createMesh(side > 0 ? 'right' : 'left')
  for (const [name, faces] of Object.entries(parts)) {
    const g = toArrays(faces)
    mesh.addPrimitive(doc.createPrimitive()
      .setAttribute('POSITION', acc('VEC3', new Float32Array(g.pos)))
      .setAttribute('NORMAL', acc('VEC3', new Float32Array(g.nor)))
      .setIndices(acc('SCALAR', new Uint16Array(g.idx)))
      .setMaterial(M[name]))
  }
  return doc.createNode(side > 0 ? 'right' : 'left').setMesh(mesh)
}

const left = room(-1), right = room(1)
const scene = doc.createScene('apartment')
scene.addChild(left).addChild(right)
doc.getRoot().setDefaultScene(scene)

// animação "split": 0 = quartos colados, 1 = afastados (o "racha")
const SPLIT = 0.9
const times = acc('SCALAR', new Float32Array([0, 1]))
const anim = doc.createAnimation('split')
for (const [node, dir] of [[left, -1], [right, 1]]) {
  const sampler = doc.createAnimationSampler()
    .setInput(times)
    .setOutput(acc('VEC3', new Float32Array([0, 0, 0, dir * SPLIT, 0, 0])))
    .setInterpolation('LINEAR')
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('translation').setSampler(sampler))
}

const io = new NodeIO()
const glb = await io.writeBinary(doc)
await writeFile(new URL('apartment.glb', OUT), glb)
console.log(`  apartment.glb  ${(glb.byteLength / 1024).toFixed(1)} KB`)

// ---------------------------------------------------------------------------
// Casinha (partícula)
// ---------------------------------------------------------------------------
{
  const d = new Document()
  const buf = d.createBuffer()
  const a = (type, arr) => d.createAccessor().setType(type).setArray(arr).setBuffer(buf)
  const body = d.createMaterial('house').setBaseColorFactor([1, 1, 1, 1]).setRoughnessFactor(0.55)
  const door = d.createMaterial('door').setBaseColorFactor([...srgb('2b2e2f'), 1]).setRoughnessFactor(0.6)
  const E = 0.7, R = 1.15, W = 0.5
  const roof = [
    ...face([[-W, E, W], [W, E, W], [W, R, 0], [-W, R, 0]]),
    ...face([[W, E, -W], [-W, E, -W], [-W, R, 0], [W, R, 0]]),
    ...face([[W, E, W], [W, E, -W], [W, R, 0]]),
    ...face([[-W, E, -W], [-W, E, W], [-W, R, 0]]),
  ]
  const mesh = d.createMesh('house')
  for (const [m, faces] of [[body, [...box([0, 0.35, 0], [0.8, 0.7, 0.8]), ...roof]], [door, box([0, 0.2, 0.401], [0.22, 0.4, 0.02])]]) {
    const g = toArrays(faces)
    mesh.addPrimitive(d.createPrimitive()
      .setAttribute('POSITION', a('VEC3', new Float32Array(g.pos)))
      .setAttribute('NORMAL', a('VEC3', new Float32Array(g.nor)))
      .setIndices(a('SCALAR', new Uint16Array(g.idx)))
      .setMaterial(m))
  }
  const s = d.createScene()
  s.addChild(d.createNode('house').setMesh(mesh))
  d.getRoot().setDefaultScene(s)
  const out = await new NodeIO().writeBinary(d)
  await writeFile(new URL('house.glb', OUT), out)
  console.log(`  house.glb      ${(out.byteLength / 1024).toFixed(1)} KB`)
}
