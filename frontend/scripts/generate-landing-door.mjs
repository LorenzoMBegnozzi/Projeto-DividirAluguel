// Gera o modelo 3D do topo da landing (public/landing/door-house.glb), sem depender de download:
//   fachada de uma casinha com a porta dupla do logo (folha azul e folha coral), arco, telhado,
//   janelas com floreira, luminária, degrau e capacho. Atrás da porta, um "dentro" com luz quente.
//   Animação "open": 0 = porta fechada, 1 = as duas folhas abertas para dentro (giram nas dobradiças).
//   O front-end não toca a animação: controla o quadro (currentTime 0..1) pelo GSAP.
//   Materiais recoloridos em runtime: "leafLeft" (--color-brand), "leafRight" (--color-coral-bright)
//   e "accent" (telhado e capacho: cor do modo procurar/anunciar).
//
// Rodar:  node scripts/generate-landing-door.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { Document, NodeIO } from '@gltf-transform/core'

const OUT = new URL('../public/landing/', import.meta.url)
await mkdir(OUT, { recursive: true })

// ---------------------------------------------------------------------------
// Geometria: caixas, faces livres e polígonos extrudados (normais planas)
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

function face(pts) {
  const [a, b, c] = pts
  const u = b.map((v, i) => v - a[i]), w = c.map((v, i) => v - a[i])
  const n = [u[1] * w[2] - u[2] * w[1], u[2] * w[0] - u[0] * w[2], u[0] * w[1] - u[1] * w[0]]
  const len = Math.hypot(...n) || 1
  return [{ n: n.map((v) => v / len), pts }]
}

/** Polígono CONVEXO no plano XY (anti-horário visto de +z), extrudado de z0 a z1. */
function extrude(poly, z0, z1) {
  const out = []
  out.push({ n: [0, 0, 1], pts: poly.map(([x, y]) => [x, y, z1]) })
  out.push({ n: [0, 0, -1], pts: [...poly].reverse().map(([x, y]) => [x, y, z0]) })
  for (let i = 0; i < poly.length; i++) {
    const [ax, ay] = poly[i], [bx, by] = poly[(i + 1) % poly.length]
    const len = Math.hypot(bx - ax, by - ay) || 1
    out.push({ n: [(by - ay) / len, -(bx - ax) / len, 0], pts: [[ax, ay, z0], [bx, by, z0], [bx, by, z1], [ax, ay, z1]] })
  }
  return out
}

/** Fatia de anel (entre dois arcos) extrudada: usada no batente em arco. */
function ringSegment(cx, cy, r0, r1, t0, t1, z0, z1) {
  const p = (r, t) => [cx + r * Math.cos(t), cy + r * Math.sin(t)]
  return extrude([p(r0, t0), p(r1, t0), p(r1, t1), p(r0, t1)].reverse(), z0, z1)
}

/** Esfera low-poly (quads/triângulos planos): cabeça do personagem. */
function sphere([cx, cy, cz], r, seg = 10, rings = 7) {
  const p = (i, j) => {
    const t = (Math.PI * i) / rings, f = (2 * Math.PI * j) / seg
    return [cx + r * Math.sin(t) * Math.cos(f), cy + r * Math.cos(t), cz + r * Math.sin(t) * Math.sin(f)]
  }
  const out = []
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const quad = [p(i, j), p(i, j + 1), p(i + 1, j + 1), p(i + 1, j)]
    const pts = i === 0 ? [quad[0], quad[2], quad[3]] : i === rings - 1 ? [quad[0], quad[1], quad[2]] : quad
    out.push(...face(pts))
  }
  return out
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
const mat = (name, hex, { rough = 0.8, metal = 0, emissive = null, double = false } = {}) => {
  const m = doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setRoughnessFactor(rough).setMetallicFactor(metal)
  if (emissive) m.setEmissiveFactor(srgb(emissive))
  if (double) m.setDoubleSided(true)
  return m
}

const M = {
  leafLeft: mat('leafLeft', '1e5f7a', { rough: 0.45 }),    // recolorido em runtime (tema)
  leafRight: mat('leafRight', 'e8704a', { rough: 0.45 }),  // recolorido em runtime (tema)
  accent: mat('accent', '1e5f7a', { rough: 0.6 }),         // telhado e capacho: cor do modo
  wall: mat('wall', 'f6f1ea', { rough: 0.9 }),
  trim: mat('trim', 'fffdf9', { rough: 0.7 }),
  base: mat('base', 'd9c3a5', { rough: 0.85 }),
  step: mat('step', 'c9b392', { rough: 0.8 }),
  knob: mat('knob', 'f3d9a4', { rough: 0.25, metal: 0.6 }),
  glass: mat('glass', 'cfe8f2', { rough: 0.1, emissive: '3a4a50' }),
  warm: mat('warm', 'ffd9a8', { rough: 1, emissive: 'ffc98a', double: true }),  // luz de dentro
  inside: mat('inside', 'e9c9a0', { rough: 0.9, double: true }),
  lamp: mat('lamp', 'fff1d6', { rough: 0.4, emissive: 'ffe2a8' }),
  dark: mat('dark', '1b2b33', { rough: 0.6 }),
  pot: mat('pot', 'c0673f'),
  skin: mat('skin', 'd9a27c', { rough: 0.7 }),
  hair: mat('hair', '2e2420', { rough: 0.8 }),
  pants: mat('pants', '2f3e46', { rough: 0.8 }),
  spill: mat('spill', 'ffe1b5', { rough: 1, emissive: 'ffcf94' }),
  plant: mat('plant', '3f9a63', { rough: 0.7 }),
}

function meshFrom(name, parts) {
  const mesh = doc.createMesh(name)
  for (const [m, faces] of Object.entries(parts)) {
    const g = toArrays(faces)
    mesh.addPrimitive(doc.createPrimitive()
      .setAttribute('POSITION', acc('VEC3', new Float32Array(g.pos)))
      .setAttribute('NORMAL', acc('VEC3', new Float32Array(g.nor)))
      .setIndices(acc('SCALAR', new Uint16Array(g.idx)))
      .setMaterial(M[m]))
  }
  return mesh
}

// medidas (metros). Porta: vão de 1.2 de largura, reto até 1.45, arco de raio 0.6 (topo em 2.05)
const DW = 0.6, HS = 1.45, R = 0.6, TOP = HS + R
const WALL_W = 3.4, WALL_H = 2.75, WZ0 = -0.12, WZ1 = 0.12   // parede da frente (z de -0.12 a 0.12)
const ARC = 14                                                // segmentos por quarto de arco
const arcPt = (t, r = R) => [r * Math.cos(t), HS + r * Math.sin(t)]

// ---------------------------------------------------------------------------
// Fachada (parede com o vão em arco, telhado, janelas, detalhes)
// ---------------------------------------------------------------------------
const house = {}
const add = (m, f) => (house[m] ??= []).push(...f)

// parede: laterais do vão, faixa acima do arco e os "cantos" entre arco e retângulo (leque a partir do canto)
add('wall', box([-(DW + (WALL_W / 2 - DW) / 2), WALL_H / 2, 0], [WALL_W / 2 - DW, WALL_H, WZ1 - WZ0]))
add('wall', box([(DW + (WALL_W / 2 - DW) / 2), WALL_H / 2, 0], [WALL_W / 2 - DW, WALL_H, WZ1 - WZ0]))
add('wall', box([0, (TOP + WALL_H) / 2, 0], [2 * DW, WALL_H - TOP, WZ1 - WZ0]))
for (const side of [-1, 1]) {
  // região entre o arco e o canto (±DW, TOP): leque convexo por fatias
  for (let i = 0; i < ARC; i++) {
    const t0 = side < 0 ? Math.PI - (i * Math.PI / 2) / ARC : (i * Math.PI / 2) / ARC
    const t1 = side < 0 ? Math.PI - ((i + 1) * Math.PI / 2) / ARC : ((i + 1) * Math.PI / 2) / ARC
    const corner = [side * DW, TOP]
    let tri = [corner, arcPt(t0), arcPt(t1)]
    // garante anti-horário visto de +z
    const area = (tri[1][0] - tri[0][0]) * (tri[2][1] - tri[0][1]) - (tri[2][0] - tri[0][0]) * (tri[1][1] - tri[0][1])
    if (area < 0) tri = [tri[0], tri[2], tri[1]]
    add('wall', extrude(tri, WZ0, WZ1))
  }
}
// batente em arco (moldura clara que salta da parede) + laterais
const FR0 = R, FR1 = R + 0.1, FZ0 = WZ1 - 0.02, FZ1 = WZ1 + 0.06
for (let i = 0; i < ARC * 2; i++) add('trim', ringSegment(0, HS, FR0, FR1, (i * Math.PI) / (ARC * 2), ((i + 1) * Math.PI) / (ARC * 2), FZ0, FZ1))
add('trim', box([-(DW + 0.05), HS / 2, (FZ0 + FZ1) / 2], [0.1, HS, FZ1 - FZ0]))
add('trim', box([DW + 0.05, HS / 2, (FZ0 + FZ1) / 2], [0.1, HS, FZ1 - FZ0]))
// espessura do vão (o "túnel" da parede atrás das folhas)
add('inside', box([-(DW + 0.005), HS / 2, 0], [0.01, HS, WZ1 - WZ0]))
add('inside', box([DW + 0.005, HS / 2, 0], [0.01, HS, WZ1 - WZ0]))
// rodapé e cimalha
add('trim', box([0, 0.06, WZ1 + 0.02], [WALL_W + 0.04, 0.12, 0.04]))
add('trim', box([0, WALL_H + 0.04, 0], [WALL_W + 0.16, 0.08, WZ1 - WZ0 + 0.16]))

// telhado de duas águas (cor do modo), com beiral
{
  const y0 = WALL_H + 0.08, y1 = WALL_H + 0.72, xw = WALL_W / 2 + 0.18, z0 = -0.7, z1 = 0.38
  add('accent', face([[-xw, y0, z1], [xw, y0, z1], [xw, y1, (z0 + z1) / 2 + 0.05], [-xw, y1, (z0 + z1) / 2 + 0.05]]))
  add('accent', face([[xw, y0, z0], [-xw, y0, z0], [-xw, y1, (z0 + z1) / 2 + 0.05], [xw, y1, (z0 + z1) / 2 + 0.05]]))
  add('wall', face([[xw - 0.2, y0, z1 - 0.08], [xw - 0.2, y0, z0 + 0.08], [xw - 0.2, y1 - 0.06, (z0 + z1) / 2 + 0.05]]))
  add('wall', face([[-xw + 0.2, y0, z0 + 0.08], [-xw + 0.2, y0, z1 - 0.08], [-xw + 0.2, y1 - 0.06, (z0 + z1) / 2 + 0.05]]))
  add('dark', box([0, y1 + 0.02, (z0 + z1) / 2 + 0.05], [2 * xw + 0.04, 0.06, 0.1]))   // cumeeira
  add('wall', box([1.05, y1 - 0.05, -0.25], [0.26, 0.6, 0.26]))                         // chaminé
  add('dark', box([1.05, y1 + 0.27, -0.25], [0.32, 0.06, 0.32]))
}

// janelas com floreira (uma de cada lado)
for (const side of [-1, 1]) {
  const cx = side * 1.17, cy = 1.45
  add('trim', box([cx, cy, WZ1 + 0.03], [0.62, 0.72, 0.06]))
  add('glass', box([cx, cy, WZ1 + 0.065], [0.5, 0.6, 0.02]))
  add('trim', box([cx, cy, WZ1 + 0.08], [0.04, 0.6, 0.02]))
  add('trim', box([cx, cy, WZ1 + 0.08], [0.5, 0.04, 0.02]))
  add('pot', box([cx, cy - 0.45, WZ1 + 0.12], [0.66, 0.16, 0.2]))
  for (const dx of [-0.2, 0, 0.2]) add('plant', box([cx + dx, cy - 0.31, WZ1 + 0.12], [0.18, 0.14, 0.16]))
}

// luminária ao lado da porta
add('dark', box([0.9, 1.95, WZ1 + 0.03], [0.1, 0.16, 0.06]))
add('lamp', box([0.9, 1.84, WZ1 + 0.1], [0.12, 0.18, 0.12]))

// base, degrau, capacho e vaso
add('base', box([0, -0.08, 0.35], [WALL_W + 0.5, 0.16, 1.6]))
add('step', box([0, 0.04, WZ1 + 0.22], [1.5, 0.08, 0.42]))
add('accent', box([0, 0.085, WZ1 + 0.24], [0.9, 0.012, 0.32]))
add('pot', box([-0.95, 0.2, WZ1 + 0.42], [0.3, 0.4, 0.3]))
add('plant', box([-0.95, 0.52, WZ1 + 0.42], [0.42, 0.3, 0.42]))
add('plant', box([-0.95, 0.76, WZ1 + 0.42], [0.26, 0.22, 0.26]))

// "dentro": caixa atrás do vão, com a parede do fundo em luz quente
add('warm', box([0, 1.1, -1.0], [1.5, 2.2, 0.02]))
add('inside', box([0, 0.0, -0.56], [1.5, 0.02, 0.9]))
add('inside', box([-0.75, 1.1, -0.56], [0.02, 2.2, 0.9]))
add('inside', box([0.75, 1.1, -0.56], [0.02, 2.2, 0.9]))
add('inside', box([0, 2.15, -0.56], [1.5, 0.02, 0.9]))

const houseNode = doc.createNode('house').setMesh(meshFrom('house', house))

// ---------------------------------------------------------------------------
// Folhas da porta: meia-folha (retângulo + quarto de arco), dobradiça na borda de fora
// ---------------------------------------------------------------------------
const LZ0 = -0.03, LZ1 = 0.03, GAP = 0.012

function leaf(side) {
  // contorno no mundo (x0..x1 dentro do vão), em sentido anti-horário: base, lado, arco, lado;
  // depois vai para coordenadas locais, com a dobradiça (borda de fora) em x = 0
  const w = DW - GAP / 2
  const [x0, x1] = side < 0 ? [-DW, -GAP / 2] : [GAP / 2, DW]
  const pts = [[x0, 0], [x1, 0]]
  for (let i = 0; i <= ARC; i++) {
    const x = x1 + ((x0 - x1) * i) / ARC
    pts.push([x, HS + Math.sqrt(Math.max(0, R * R - x * x))])
  }
  const poly = pts.map(([x, y]) => [x - side * DW, y])

  const parts = {}
  const put = (m, f) => (parts[m] ??= []).push(...f)
  put(side < 0 ? 'leafLeft' : 'leafRight', extrude(poly, LZ0, LZ1))
  // almofadas (frisos) e maçaneta perto do meio
  const inner = side < 0 ? 1 : -1
  const mid = inner * (w / 2)
  put('trim', box([mid, 0.55, LZ1 + 0.006], [w * 0.62, 0.62, 0.012]))
  put(side < 0 ? 'leafLeft' : 'leafRight', box([mid, 0.55, LZ1 + 0.01], [w * 0.52, 0.52, 0.012]))
  put('knob', box([inner * (w - 0.09), 0.98, LZ1 + 0.035], [0.06, 0.06, 0.06]))
  return doc.createNode(side < 0 ? 'leafLeft' : 'leafRight')
    .setMesh(meshFrom(side < 0 ? 'leafLeft' : 'leafRight', parts))
    .setTranslation([side * DW, 0, 0])
}

const leftLeaf = leaf(-1), rightLeaf = leaf(1)

// quem estava batendo do outro lado: aparece no vão quando a porta abre (a resposta do "who?").
// Camisa no material "accent" (cor do modo). Origem nos pés, de frente para a câmera.
const person = {}
{
  const put = (m, f) => (person[m] ??= []).push(...f)
  put('pants', box([-0.075, 0.33, 0], [0.12, 0.66, 0.14]))
  put('pants', box([0.075, 0.33, 0], [0.12, 0.66, 0.14]))
  put('accent', box([0, 0.92, 0], [0.36, 0.56, 0.2]))
  put('accent', box([-0.215, 0.95, 0], [0.09, 0.46, 0.12]))
  put('accent', box([0.215, 1.12, 0.03], [0.09, 0.42, 0.12]))   // braço levantado: acenando
  put('skin', box([0.215, 1.38, 0.03], [0.09, 0.1, 0.1]))
  put('skin', box([-0.215, 0.68, 0], [0.08, 0.08, 0.09]))
  put('skin', box([0, 1.24, 0], [0.09, 0.06, 0.09]))
  put('skin', sphere([0, 1.39, 0], 0.14))
  put('hair', sphere([0, 1.43, -0.025], 0.135, 10, 4))
  put('dark', box([-0.045, 1.4, 0.135], [0.025, 0.03, 0.01]))
  put('dark', box([0.045, 1.4, 0.135], [0.025, 0.03, 0.01]))
}
const PERSON_IN = -0.85, PERSON_OUT = -0.2
const personNode = doc.createNode('person').setMesh(meshFrom('person', person)).setTranslation([0, 0, PERSON_IN])

// luz que sai pela porta e se espalha no degrau (escala em z: 0 fechada → 1 aberta)
const spill = {}
spill.spill = face([[-0.5, 0, 0], [0.5, 0, 0], [0.62, 0, 0.42], [-0.62, 0, 0.42]])
const spillNode = doc.createNode('spill').setMesh(meshFrom('spill', spill)).setTranslation([0, 0.093, WZ1]).setScale([1, 1, 0.001])

const scene = doc.createScene('door-house')
scene.addChild(houseNode).addChild(leftLeaf).addChild(rightLeaf).addChild(personNode).addChild(spillNode)
doc.getRoot().setDefaultScene(scene)

// animação "open": 0 = fechada, 1 = folhas abertas para dentro (78°), pessoa no vão e luz no degrau
const OPEN = (78 * Math.PI) / 180
const keys = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875, 1]
const times = acc('SCALAR', new Float32Array(keys))
const anim = doc.createAnimation('open')
for (const [node, dir] of [[leftLeaf, 1], [rightLeaf, -1]]) {
  const q = keys.flatMap((k) => { const a = (dir * OPEN * k) / 2; return [0, Math.sin(a), 0, Math.cos(a)] })
  const sampler = doc.createAnimationSampler().setInput(times).setOutput(acc('VEC4', new Float32Array(q))).setInterpolation('LINEAR')
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath('rotation').setSampler(sampler))
}

// a pessoa chega ao vão na segunda metade (depois que a porta já abriu um pouco)
{
  const ease = (k) => (k < 0.35 ? 0 : 1 - (1 - (k - 0.35) / 0.65) ** 2)
  const z = keys.flatMap((k) => [0, 0, PERSON_IN + (PERSON_OUT - PERSON_IN) * ease(k)])
  const sampler = doc.createAnimationSampler().setInput(times).setOutput(acc('VEC3', new Float32Array(z))).setInterpolation('LINEAR')
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(personNode).setTargetPath('translation').setSampler(sampler))
  const sc = keys.flatMap((k) => [1, 1, Math.max(0.001, k)])
  const s2 = doc.createAnimationSampler().setInput(times).setOutput(acc('VEC3', new Float32Array(sc))).setInterpolation('LINEAR')
  anim.addSampler(s2).addChannel(doc.createAnimationChannel().setTargetNode(spillNode).setTargetPath('scale').setSampler(s2))
}

const glb = await new NodeIO().writeBinary(doc)
await writeFile(new URL('door-house.glb', OUT), glb)
console.log(`  door-house.glb  ${(glb.byteLength / 1024).toFixed(1)} KB`)
