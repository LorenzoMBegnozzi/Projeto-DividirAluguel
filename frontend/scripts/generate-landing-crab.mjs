// Gera a cena 3D do topo da landing (public/landing/caranguejo.glb), sem depender de download:
// uma prainha com dois caranguejos-eremitas e uma concha. A história (animação "cena", 13 s, em loop):
//   0.0–2.4  o caranguejo laranja chega andando de lado, com a concha azul nas costas
//   3.2–4.1  ele se remexe e sai da concha, que fica na areia
//   4.2–5.7  ele acena ("Vou deixar pro próximo!", balão em HTML) e vai embora pela direita
//   7.6–9.9  chega um caranguejo menor, olha a concha vazia
//   9.9–10.4 pula para dentro dela
//  10.4–11.6 comemora ("Opa, casa nova!") e sai andando com a casa nova
// O front-end não toca a animação: controla o quadro (currentTime 0..13) pelo GSAP, como antes.
// Material "accent" (a estrela-do-mar) é recolorido em runtime conforme o modo (procurar/anunciar).
//
// Rodar:  node scripts/generate-landing-crab.mjs
import { mkdir, writeFile } from 'node:fs/promises'
import { Document, NodeIO } from '@gltf-transform/core'

const OUT = new URL('../public/landing/', import.meta.url)
await mkdir(OUT, { recursive: true })

export const DURATION = 13
const FPS = 20   // a interpolação entre quadros é linear: 20 por segundo já fica liso

// ---------------------------------------------------------------------------
// Geometria lisa (normais por vértice): elipsoides e tubos
// ---------------------------------------------------------------------------
const add3 = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub3 = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const mul3 = (a, k) => [a[0] * k, a[1] * k, a[2] * k]
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const cross3 = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const norm3 = (a) => { const l = Math.hypot(...a) || 1; return [a[0] / l, a[1] / l, a[2] / l] }

/** Malha acumulada por material: posições, normais e índices. */
class Parts {
  constructor() { this.by = {} }
  get(m) { return (this.by[m] ??= { pos: [], nor: [], idx: [] }) }
  /** acrescenta vértices + triângulos, corrigindo o sentido para a face olhar para fora */
  push(m, verts, normals, tris) {
    const g = this.get(m)
    const base = g.pos.length / 3
    verts.forEach((v) => g.pos.push(...v))
    normals.forEach((n) => g.nor.push(...n))
    for (const [a, b, c] of tris) {
      const fn = cross3(sub3(verts[b], verts[a]), sub3(verts[c], verts[a]))
      const vn = add3(add3(normals[a], normals[b]), normals[c])
      if (dot3(fn, vn) < 0) g.idx.push(base + a, base + c, base + b)
      else g.idx.push(base + a, base + b, base + c)
    }
  }
}

function ellipsoid(parts, m, c, r, seg = 18, rings = 11) {
  const v = [], n = [], t = []
  for (let i = 0; i <= rings; i++) {
    const th = (Math.PI * i) / rings
    for (let j = 0; j <= seg; j++) {
      const ph = (2 * Math.PI * j) / seg
      const u = [Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph)]
      v.push([c[0] + r[0] * u[0], c[1] + r[1] * u[1], c[2] + r[2] * u[2]])
      n.push(norm3([u[0] / r[0], u[1] / r[1], u[2] / r[2]]))
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < seg; j++) {
    const a = i * (seg + 1) + j, b = a + seg + 1
    if (i > 0) t.push([a, b, a + 1])
    if (i < rings - 1) t.push([a + 1, b, b + 1])
  }
  parts.push(m, v, n, t)
}
const sphere = (parts, m, c, r, seg, rings) => ellipsoid(parts, m, c, [r, r, r], seg, rings)

/** Tubo de p0 a p1 (raio r0 → r1), com bolinhas nas pontas para as juntas ficarem redondas. */
function tube(parts, m, p0, p1, r0, r1, seg = 10) {
  const d = norm3(sub3(p1, p0))
  const helper = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]
  const u = norm3(cross3(d, helper)), w = cross3(d, u)
  const v = [], n = [], t = []
  for (const [p, r] of [[p0, r0], [p1, r1]]) {
    for (let j = 0; j <= seg; j++) {
      const a = (2 * Math.PI * j) / seg
      const dir = add3(mul3(u, Math.cos(a)), mul3(w, Math.sin(a)))
      v.push(add3(p, mul3(dir, r)))
      n.push(dir)
    }
  }
  for (let j = 0; j < seg; j++) t.push([j, j + seg + 1, j + 1], [j + 1, j + seg + 1, j + seg + 2])
  parts.push(m, v, n, t)
  sphere(parts, m, p0, r0, 8, 5)
  sphere(parts, m, p1, r1, 8, 5)
}

// ---------------------------------------------------------------------------
// glTF
// ---------------------------------------------------------------------------
const doc = new Document()
const buffer = doc.createBuffer()
const acc = (type, arr) => doc.createAccessor().setType(type).setArray(arr).setBuffer(buffer)
const srgb = (hex) => hex.match(/\w\w/g).map((h) => (parseInt(h, 16) / 255) ** 2.2)
const mat = (name, hex, { rough = 0.55, metal = 0, emissive = null } = {}) => {
  const m = doc.createMaterial(name).setBaseColorFactor([...srgb(hex), 1]).setRoughnessFactor(rough).setMetallicFactor(metal)
  if (emissive) m.setEmissiveFactor(srgb(emissive))
  return m
}
const M = {
  crab: mat('crab', 'e8704a', { rough: 0.45 }),        // laranja da marca (coral-bright)
  crabDark: mat('crabDark', 'c9542f', { rough: 0.45 }),
  crabB: mat('crabB', 'f39a74', { rough: 0.45 }),       // o caranguejo menor, mais clarinho
  crabBDark: mat('crabBDark', 'e07a52', { rough: 0.45 }),
  belly: mat('belly', 'f8c3ad', { rough: 0.6 }),        // a barriguinha que fica dentro da concha
  blush: mat('blush', 'ff8f87', { rough: 0.8 }),
  white: mat('white', 'ffffff', { rough: 0.25 }),
  ink: mat('ink', '1b2b33', { rough: 0.3 }),
  shell: mat('shell', '1e5f7a', { rough: 0.35 }),       // azul petróleo da marca
  shellLight: mat('shellLight', 'dcebf1', { rough: 0.4 }),
  shellInside: mat('shellInside', '0f3445', { rough: 0.7 }),
  sand: mat('sand', 'eed9b6', { rough: 0.95 }),
  sandDark: mat('sandDark', 'dcc196', { rough: 0.95 }),
  water: mat('water', '9fd3e6', { rough: 0.2 }),
  foam: mat('foam', 'f4fbfd', { rough: 0.6 }),
  pebble: mat('pebble', 'c9c2b6', { rough: 0.8 }),
  accent: mat('accent', '1e5f7a', { rough: 0.6 }),      // estrela-do-mar: cor do modo (runtime)
}

/**
 * Nó com a malha das peças. Os buffers de cada peça são criados uma vez só: o caranguejo pequeno
 * reaproveita a geometria do grande trocando só os materiais (remap), o que corta o arquivo quase pela metade.
 */
function meshNode(name, parts, remap = {}) {
  const mesh = doc.createMesh(name)
  for (const [m, g] of Object.entries(parts.by)) {
    if (g.idx.length === 0) continue
    g.acc ??= {
      pos: acc('VEC3', new Float32Array(g.pos)),
      nor: acc('VEC3', new Float32Array(g.nor)),
      idx: acc('SCALAR', g.pos.length / 3 > 65535 ? new Uint32Array(g.idx) : new Uint16Array(g.idx)),
    }
    mesh.addPrimitive(doc.createPrimitive()
      .setAttribute('POSITION', g.acc.pos)
      .setAttribute('NORMAL', g.acc.nor)
      .setIndices(g.acc.idx)
      .setMaterial(M[remap[m] ?? m]))
  }
  return doc.createNode(name).setMesh(mesh)
}

// ---------------------------------------------------------------------------
// Caranguejo (origem no chão, de frente para a câmera, +z)
// ---------------------------------------------------------------------------
const crabGeometry = {}   // peças do caranguejo, montadas uma vez e usadas pelos dois
const piece = (key, build) => (crabGeometry[key] ??= (() => { const p = new Parts(); build(p); return p })())

function makeCrab(name, remap = {}) {
  const root = doc.createNode(name)
  const node = (key, build) => meshNode(`${name}-${key}`, piece(key, build), remap)

  root.addChild(node('corpo', (p) => {
    ellipsoid(p, 'crab', [0, 0.55, 0], [0.62, 0.42, 0.5])
    // barriguinha enrolada atrás (fica dentro da concha; aparece quando ele sai dela)
    ellipsoid(p, 'belly', [0, 0.6, -0.42], [0.27, 0.27, 0.3])
    ellipsoid(p, 'belly', [0, 0.8, -0.62], [0.18, 0.18, 0.2])
    // bochechas e sorriso
    for (const s of [-1, 1]) ellipsoid(p, 'blush', [s * 0.36, 0.55, 0.41], [0.1, 0.06, 0.04])
    for (let k = -3; k <= 3; k++) {
      const x = k * 0.032
      const y = 0.46 - 0.035 * (1 - (k / 3) ** 2)
      const z = 0.5 * Math.sqrt(Math.max(0, 1 - (x / 0.62) ** 2 - ((y - 0.55) / 0.42) ** 2)) + 0.004
      sphere(p, 'ink', [x, y, z], 0.02, 8, 5)
    }
  }))

  // olhos em hastes (o globo é um nó próprio, para piscar)
  const eyes = []
  for (const s of [-1, 1]) {
    const lado = s > 0 ? 'd' : 'e'
    const eyeNode = node(`haste-${lado}`, (p) => tube(p, 'crab', [0, 0, 0], [s * 0.04, 0.33, 0.04], 0.06, 0.055)).setTranslation([s * 0.22, 0.82, 0.22])
    const ballNode = node('olho', (p) => {
      sphere(p, 'white', [0, 0, 0], 0.16)
      sphere(p, 'ink', [0, 0.01, 0.11], 0.09, 14, 9)
      sphere(p, 'white', [-0.03, 0.05, 0.19], 0.03, 8, 6)
    }).setTranslation([s * 0.04, 0.42, 0.05])
    eyeNode.addChild(ballNode)
    root.addChild(eyeNode)
    eyes.push(ballNode)
  }

  // garras (pivô no ombro, para acenar)
  const claws = {}
  for (const s of [-1, 1]) {
    claws[s] = node(`garra-${s > 0 ? 'd' : 'e'}`, (p) => {
      tube(p, 'crab', [0, 0, 0], [s * 0.26, 0.06, 0.22], 0.08, 0.07)
      ellipsoid(p, 'crabDark', [s * 0.38, 0.14, 0.36], [0.21, 0.16, 0.15])
      ellipsoid(p, 'crabDark', [s * 0.27, 0.3, 0.44], [0.08, 0.13, 0.07])
      ellipsoid(p, 'crabDark', [s * 0.48, 0.28, 0.42], [0.07, 0.11, 0.06])
    }).setTranslation([s * 0.5, 0.48, 0.22])
    root.addChild(claws[s])
  }

  // pernas: 3 de cada lado, pivô no quadril (a mesma peça para as três de cada lado)
  const legs = []
  ;[0.08, -0.12, -0.32].forEach((z, i) => {
    for (const s of [-1, 1]) {
      const leg = node(`perna-${s > 0 ? 'd' : 'e'}`, (p) => {
        tube(p, 'crab', [0, 0, 0], [s * 0.32, 0.12, 0], 0.06, 0.05)
        tube(p, 'crab', [s * 0.32, 0.12, 0], [s * 0.5, -0.42, 0.02], 0.05, 0.03)
      }).setTranslation([s * 0.5, 0.42, z])
      root.addChild(leg)
      legs.push({ node: leg, side: s, phase: (i % 2 === 0 ? 0 : Math.PI) + (s > 0 ? Math.PI : 0) })
    }
  })
  return { root, eyes, claws, legs }
}

// ---------------------------------------------------------------------------
// Concha: espiral logarítmica de verdade (como as conchas de caracol reais). Um tubo que dá ~4
// voltas em torno de um eixo, crescendo 2× por volta, com a ponta no alto; a boca (onde fica a
// barriguinha do caranguejo) tem uma borda clara e o fundo escuro; três listras claras seguem a espiral.
// ---------------------------------------------------------------------------
const SHELL = { turns: 4.2, mouth: 0.5, coil: 0.4, spire: 1.55, growth: 2.05 }
let shellBottom = 0   // quanto a concha desce abaixo da boca (para pousar na areia)

function makeShell() {
  const p = new Parts()
  const { turns, mouth, coil, spire, growth } = SHELL
  const k = Math.log(growth) / (2 * Math.PI)
  const S = 96, T = 20
  const sMin = -turns * 2 * Math.PI
  const up = [0, 1, 0]
  const center = (s) => { const g = Math.exp(k * s); return [coil * g * Math.cos(s), spire * (1 - g), coil * g * Math.sin(s)] }

  // malha da superfície (no "quadro de origem": eixo y, boca em (coil, 0, 0) olhando para +z)
  const verts = [], normals = []
  for (let i = 0; i <= S; i++) {
    const s = sMin + ((0 - sMin) * i) / S
    const g = Math.exp(k * s)
    const c = center(s), rad = [Math.cos(s), 0, Math.sin(s)]
    for (let j = 0; j <= T; j++) {
      const t = (2 * Math.PI * j) / T
      const n = add3(mul3(rad, Math.cos(t)), mul3(up, Math.sin(t)))
      verts.push(add3(c, mul3(n, mouth * g)))
      normals.push(n)
    }
  }
  const stripe = (j) => [3, 4, 10, 11, 17].includes(j)   // listras que acompanham a espiral
  const tris = { shell: [], shellLight: [] }
  for (let i = 0; i < S; i++) for (let j = 0; j < T; j++) {
    const a = i * (T + 1) + j, b = a + T + 1
    const m = stripe(j) ? 'shellLight' : 'shell'
    tris[m].push([a, b, a + 1], [a + 1, b, b + 1])
  }

  // borda da boca (um anel) e o fundo escuro lá dentro
  const lipV = [], lipN = [], lipT = []
  const c0 = center(0), R0 = mouth, LIP = 0.04, U = 28, V = 8
  for (let i = 0; i <= U; i++) {
    const t = (2 * Math.PI * i) / U
    const dir = [Math.cos(t), Math.sin(t), 0]
    for (let j = 0; j <= V; j++) {
      const q = (2 * Math.PI * j) / V
      const n = norm3(add3(mul3(dir, Math.cos(q)), [0, 0, Math.sin(q)]))
      lipV.push(add3(add3(c0, mul3(dir, R0)), mul3(n, LIP)))
      lipN.push(n)
    }
  }
  for (let i = 0; i < U; i++) for (let j = 0; j < V; j++) {
    const a = i * (V + 1) + j, b = a + V + 1
    lipT.push([a, b, a + 1], [a + 1, b, b + 1])
  }

  // girar para a pose do caranguejo: ponta para cima, para trás e para a esquerda da tela; boca
  // virada para baixo e para a frente (é dali que sai o corpo). A origem do nó vira o centro da boca.
  const axis = norm3([-0.78, 0.6, -0.18])
  let front = [0.05, -1, 0.12]
  front = norm3(sub3(front, mul3(axis, dot3(front, axis))))
  const side = cross3(axis, front)
  const place = (v) => sub3(add3(add3(mul3(side, v[0]), mul3(axis, v[1])), mul3(front, v[2])), mouthAt)
  const turn = (n) => add3(add3(mul3(side, n[0]), mul3(axis, n[1])), mul3(front, n[2]))
  const mouthAt = add3(add3(mul3(side, c0[0]), mul3(axis, c0[1])), mul3(front, c0[2]))

  const V3 = verts.map(place), N3 = normals.map(turn)
  shellBottom = Math.min(...V3.map((v) => v[1]))
  for (const m of ['shell', 'shellLight']) p.push(m, V3, N3, tris[m])
  p.push('shellLight', lipV.map(place), lipN.map(turn), lipT)
  const inner = new Parts()
  ellipsoid(inner, 'shellInside', [c0[0], c0[1], c0[2] - 0.05], [R0 * 0.95, R0 * 0.95, 0.03], 20, 6)
  const g = inner.get('shellInside')
  const iv = [], inr = []
  for (let i = 0; i < g.pos.length; i += 3) { iv.push(place([g.pos[i], g.pos[i + 1], g.pos[i + 2]])); inr.push(turn([g.nor[i], g.nor[i + 1], g.nor[i + 2]])) }
  const it = []
  for (let i = 0; i < g.idx.length; i += 3) it.push([g.idx[i], g.idx[i + 1], g.idx[i + 2]])
  p.push('shellInside', iv, inr, it)
  sphere(p, 'shellLight', place(center(sMin)), 0.03, 8, 5)   // pontinha
  return meshNode('concha', p)
}

// ---------------------------------------------------------------------------
// Cenário: prainha com água atrás, pedrinhas e uma estrela-do-mar
// ---------------------------------------------------------------------------
function makeBeach() {
  const p = new Parts()
  ellipsoid(p, 'water', [0, -0.16, -1.05], [3.5, 0.1, 0.95], 36, 8)
  ellipsoid(p, 'foam', [0, -0.11, -0.6], [3.1, 0.06, 0.26], 36, 6)
  ellipsoid(p, 'sand', [0, -0.09, 0.2], [3.2, 0.1, 1.3], 40, 10)
  ellipsoid(p, 'sandDark', [0, -0.17, 0.2], [3.25, 0.08, 1.34], 40, 6)
  for (const [x, z, r] of [[-2.3, 0.75, 0.12], [-2.1, 0.92, 0.08], [2.5, -0.15, 0.1], [1.6, 1.0, 0.07], [-1.5, -0.35, 0.06]]) {
    ellipsoid(p, 'pebble', [x, 0.0, z], [r * 1.3, r * 0.7, r], 14, 8)
  }
  // estrela-do-mar
  const sc = [2.05, 0.03, 0.7]
  sphere(p, 'accent', sc, 0.1, 12, 8)
  for (let k = 0; k < 5; k++) {
    const a = (2 * Math.PI * k) / 5 + 0.3
    tube(p, 'accent', sc, add3(sc, [Math.cos(a) * 0.3, 0, Math.sin(a) * 0.3]), 0.075, 0.03, 10)
  }
  return meshNode('praia', p)
}

const A = makeCrab('laranja')
const B = makeCrab('pequeno', { crab: 'crabB', crabDark: 'crabBDark' })
const SCALE_B = 0.78
const shell = makeShell()
const beach = makeBeach()

const scene = doc.createScene('caranguejo')
scene.addChild(beach).addChild(A.root).addChild(B.root).addChild(shell)
doc.getRoot().setDefaultScene(scene)

// ---------------------------------------------------------------------------
// A história, quadro a quadro (posições em função do tempo)
// ---------------------------------------------------------------------------
const clamp01 = (x) => Math.max(0, Math.min(1, x))
const lerp = (a, b, t) => a + (b - a) * t
const easeOut = (t) => 1 - (1 - t) ** 3
const easeIn = (t) => t ** 2.2
const easeInOut = (t) => (t < 0.5 ? 4 * t ** 3 : 1 - (-2 * t + 2) ** 3 / 2)
const seg = (t, t0, t1) => clamp01((t - t0) / (t1 - t0))
const between = (t, t0, t1) => t >= t0 && t < t1
const OFF_L = -8.2, OFF_R = 8.2
const SPOT = -0.6           // onde a concha fica na areia
const WALK = 2 * Math.PI * 5 // passinhos por segundo

function stateA(t) {
  let x
  if (t < 2.4) x = lerp(OFF_L, SPOT, easeOut(seg(t, 0, 2.4)))
  else if (t < 3.2) x = SPOT
  else if (t < 4.1) x = lerp(SPOT, 0.65, easeInOut(seg(t, 3.2, 4.1)))
  else if (t < 5.7) x = 0.65
  else if (t < 7.7) x = lerp(0.65, OFF_R, easeIn(seg(t, 5.7, 7.7)))
  else x = OFF_R
  const walking = t < 2.3 || between(t, 3.2, 4.1) || between(t, 5.7, 7.7)
  const wiggle = between(t, 3.2, 4.1) ? 0.2 * Math.sin(2 * Math.PI * 5 * (t - 3.2)) * (1 - seg(t, 3.2, 4.1)) : 0
  const wave = between(t, 4.2, 5.6) ? 1 : 0
  const blink = [2.8, 5.1].some((b) => between(t, b, b + 0.14))
  return { x, walking, wiggle, wave, waveBoth: false, blink, hop: 0 }
}

function stateB(t) {
  let x, hop = 0
  if (t < 7.6) x = OFF_L
  else if (t < 9.4) x = lerp(OFF_L, -1.75, easeOut(seg(t, 7.6, 9.4)))
  else if (t < 9.9) x = -1.75
  else if (t < 10.4) { const p = seg(t, 9.9, 10.4); x = lerp(-1.75, SPOT, easeInOut(p)); hop = 0.5 * Math.sin(Math.PI * p) }
  else if (t < 11.6) { x = SPOT; hop = 0.12 * Math.abs(Math.sin(2 * Math.PI * 2 * (t - 10.4))) }
  else x = lerp(SPOT, OFF_R, easeIn(seg(t, 11.6, DURATION)))
  const walking = between(t, 7.6, 9.3) || t >= 11.6
  const blink = [9.55, 9.75].some((b) => between(t, b, b + 0.12))
  return { x, walking, wiggle: 0, wave: 0, waveBoth: between(t, 10.4, 11.6), blink, hop }
}

const SHELL_ON_A = [0, 0.86, -0.42]
const SHELL_ON_B = SHELL_ON_A.map((v) => v * SCALE_B)
const SHELL_REST = [SPOT - 0.1, -shellBottom - 0.02, -0.4]   // pousada na areia, boca para baixo
function stateShell(t, a, b) {
  const onA = add3([a.x, a.y, 0], SHELL_ON_A)
  const onB = add3([b.x, b.y, 0], SHELL_ON_B)
  if (t < 3.2) return { pos: onA, rz: a.wiggle * 0.6 }
  if (t < 4.0) { const p = easeOut(seg(t, 3.2, 4.0)); return { pos: [lerp(onA[0], SHELL_REST[0], p), lerp(onA[1], SHELL_REST[1], p), lerp(onA[2], SHELL_REST[2], p)], rz: lerp(0, 0.2, p) } }
  if (t < 10.0) return { pos: SHELL_REST, rz: 0.2 }
  if (t < 10.4) { const p = easeInOut(seg(t, 10.0, 10.4)); return { pos: [lerp(SHELL_REST[0], onB[0], p), lerp(SHELL_REST[1], onB[1], p), lerp(SHELL_REST[2], onB[2], p)], rz: lerp(0.2, 0, p) } }
  return { pos: onB, rz: 0 }
}

// quaternion a partir de ângulos (x, depois y, depois z)
function quat(x = 0, y = 0, z = 0) {
  const cx = Math.cos(x / 2), sx = Math.sin(x / 2), cy = Math.cos(y / 2), sy = Math.sin(y / 2), cz = Math.cos(z / 2), sz = Math.sin(z / 2)
  return [sx * cy * cz + cx * sy * sz, cx * sy * cz - sx * cy * sz, cx * cy * sz + sx * sy * cz, cx * cy * cz - sx * sy * sz]
}

const frames = Math.round(DURATION * FPS) + 1
const times = Float32Array.from({ length: frames }, (_, i) => Math.min(DURATION, i / FPS))
const timeAcc = acc('SCALAR', times)
const anim = doc.createAnimation('cena')
function channel(node, path, values, type) {
  const sampler = doc.createAnimationSampler().setInput(timeAcc).setOutput(acc(type, new Float32Array(values))).setInterpolation('LINEAR')
  anim.addSampler(sampler).addChannel(doc.createAnimationChannel().setTargetNode(node).setTargetPath(path).setSampler(sampler))
}

function animateCrab(crab, stateFn, scale) {
  const tr = [], rot = [], legs = crab.legs.map(() => []), claws = { '-1': [], '1': [] }, eyes = crab.eyes.map(() => [])
  for (const t of times) {
    const s = stateFn(t)
    const bob = s.walking ? 0.05 * Math.abs(Math.sin(WALK * t)) : 0.012 * Math.sin(2 * Math.PI * 0.8 * t)
    s.y = (bob + s.hop) * scale
    tr.push(s.x, s.y, 0)
    rot.push(...quat(0, 0, s.wiggle))
    crab.legs.forEach((leg, i) => {
      const ph = WALK * t + leg.phase
      const amp = s.walking ? 1 : 0.15
      legs[i].push(...quat(0.22 * amp * Math.cos(ph), 0, leg.side * 0.3 * amp * Math.sin(ph)))
    })
    for (const side of [-1, 1]) {
      let rz = side * 0.08 * Math.sin(2 * Math.PI * 0.8 * t)
      if (s.wave && side === 1) rz = 0.9 + 0.35 * Math.sin(2 * Math.PI * 2.5 * t)
      if (s.waveBoth) rz = side * (0.9 + 0.3 * Math.sin(2 * Math.PI * 3 * t))
      claws[side].push(...quat(0, 0, rz))
    }
    crab.eyes.forEach((_, i) => eyes[i].push(1, s.blink ? 0.12 : 1, 1))
  }
  channel(crab.root, 'translation', tr, 'VEC3')
  channel(crab.root, 'rotation', rot, 'VEC4')
  // escala animada (constante): a pose de repouso do pequeno é "encolhido no meio" (ver no fim)
  channel(crab.root, 'scale', Array.from(times, () => [scale, scale, scale]).flat(), 'VEC3')
  crab.legs.forEach((leg, i) => channel(leg.node, 'rotation', legs[i], 'VEC4'))
  for (const side of [-1, 1]) channel(crab.claws[side], 'rotation', claws[side], 'VEC4')
  crab.eyes.forEach((node, i) => channel(node, 'scale', eyes[i], 'VEC3'))
}

animateCrab(A, stateA, 1)
animateCrab(B, stateB, SCALE_B)
{
  const tr = [], rot = []
  for (const t of times) {
    const a = stateA(t), b = stateB(t)
    a.y = 0; b.y = (b.hop) * SCALE_B
    const s = stateShell(t, a, b)
    tr.push(...s.pos)
    rot.push(...quat(0, 0, s.rz))
  }
  channel(shell, 'translation', tr, 'VEC3')
  channel(shell, 'rotation', rot, 'VEC4')
}

// pose de repouso (antes de a animação começar): caranguejo laranja com a concha no meio da praia.
// É o que o model-viewer usa para enquadrar a câmera.
A.root.setTranslation([SPOT, 0, 0])
// o pequeno fica encolhido no meio da praia em repouso: fora da cena ele faria o enquadramento
// automático do model-viewer abrir até -8 e a praia ficaria minúscula
B.root.setTranslation([SPOT, 0, -0.3]).setScale([0.001, 0.001, 0.001])
shell.setTranslation(add3([SPOT, 0, 0], SHELL_ON_A))

const glb = await new NodeIO().writeBinary(doc)
await writeFile(new URL('caranguejo.glb', OUT), glb)
console.log(`  caranguejo.glb  ${(glb.byteLength / 1024).toFixed(1)} KB  (${DURATION}s, ${frames} quadros)`)
