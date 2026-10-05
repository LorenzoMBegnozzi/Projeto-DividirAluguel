// Coreografia do celular 3D ligada à rolagem. Carregado sob demanda (import dinâmico) pelo
// PhoneStory: nada disto entra no JS inicial da landing.
//
// Como funciona:
//  1. Cada ato tem um marco de rolagem (data-act, 100vh cada). A rolagem vira um progresso
//     contínuo p (0 = a seção começando a aparecer embaixo da tela, 1 = ato 1 com a legenda
//     presa na tela, ... 4 = saída). Antes disso, no topo da página, o celular não aparece.
//  2. O p mostrado persegue o p da rolagem com amortecimento exponencial: sem saltos, mesmo
//     com roda do mouse "em degraus".
//  3. Entrada (p 0 → 1): a legenda do ato 1 sobe junto com a página, logo depois do topo, e
//     o celular vem preso logo abaixo dela, girando (volta inteira em Y): mesma relação do
//     ato 1, então não se sobrepõem e a tela nunca fica vazia.
//     Revezamento nos demais: perto de cada ato o celular fica parado e a legenda aparece; no
//     terço central do caminho a legenda some e o celular viaja.
//     Assim texto e celular nunca disputam o mesmo lugar. A pose de cada ato é ajustada ao
//     espaço que a legenda deixa livre (fitAct), em qualquer tamanho de tela.
//  4. Tudo o que acontece na tela (hábitos marcando, cartões orbitando, notificação) também é
//     função de p, então rolar para trás desfaz na mesma ordem.
//  5. Parado, entra um flutuar leve. Por quadro só se escreve transform/opacity.
//  6. "Pulo": clique num link do menu (rolagem suave atravessando a seção) ou rolagem rápida
//     demais. O celular e as legendas somem na hora e o progresso vai direto para o destino
//     (sem perseguir). Ao parar, reaparecem já na pose certa, sem ele passar correndo por todos
//     os atos.

type Pose = [x: number, y: number, z: number, s: number, rx: number, ry: number, rz: number]

// x/y em vw/vh a partir do centro da tela, z em px (positivo = mais perto da câmera)
const DESKTOP: Pose[] = [
  [16, 62, -260, 0.55, 34, -40, -16],  // 0 entrada: abaixo da tela, deitado para trás, sobe girando
  [0, 4, 60, 1, 6, 326, 0],            // 1 centro, abaixo da legenda (ajustado por fitAct); volta inteira em Y
  [-22, 0, 20, 1, 10, 384, 5],         // 2 esquerda (texto à direita), cartões orbitando
  [22, 2, 80, 1.02, -8, 334, -6],      // 3 direita (texto à esquerda), chat + notificação
  [0, 18, -320, 0.7, 64, 360, -18],    // 4 saída: longe, deitado como se fosse posto na mesa
]
// no celular não há "lados": ele sobe, desce e muda de tamanho
const MOBILE: Pose[] = [
  [0, 62, -160, 0.45, 20, -30, -8],    // 0 entrada: escondido embaixo, sobe quando a seção chega
  [0, 6, 60, 0.6, 6, 330, 0],          // 1 meio (texto em cima e embaixo)
  [0, -14, 0, 0.58, 12, 384, 4],       // 2 sobe (texto embaixo)
  [0, 16, 40, 0.6, -8, 334, -5],       // 3 desce (texto em cima)
  [0, 30, -300, 0.5, 64, 360, -18],
]

const PERSPECTIVE = 900
const ORIGIN_Y = 0.45                  // perspective-origin do palco (phone.css)
const ORBIT_BASE = [200, 320, 80]       // ângulo inicial de cada cartão na órbita (graus)
const ORBIT_Y = [-120, 0, 120]          // altura de cada cartão na órbita (px do celular)
const ROW_Y = (i: number) => -164 + 52 * i  // centro da linha i na tela da lista

const clamp01 = (t: number) => (t < 0 ? 0 : t > 1 ? 1 : t)
const smooth = (t: number) => t * t * (3 - 2 * t)
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)
/** 0 antes de a, 1 depois de b, suave no meio */
const win = (p: number, a: number, b: number) => smooth(clamp01((p - a) / (b - a)))
const rad = (d: number) => (d * Math.PI) / 180
/** ângulo em -180..180 (a rotação acumula voltas inteiras) */
const wrap = (d: number) => ((((d + 180) % 360) + 360) % 360) - 180

export interface PhoneEngine { refresh(): void; spin(): void; destroy(): void }

export function startPhone({ section, stage, quality }: { section: HTMLElement; stage: HTMLElement; quality: 'full' | 'light' }): PhoneEngine {
  const mq = matchMedia('(max-width: 767px)')
  let keys = mq.matches ? MOBILE : DESKTOP
  let radius = mq.matches ? 250 : 240

  // ---------- elementos (refeito quando o React troca o conteúdo do modo) ----------
  let root!: HTMLElement, floor!: HTMLElement, glare: HTMLElement | null
  let screens: Record<string, HTMLElement> = {}
  let checks: HTMLElement[] = [], rows: HTMLElement[] = [], bubbles: HTMLElement[] = [], cards: HTMLElement[] = []
  let notif: HTMLElement | null
  let caps: HTMLElement[] = []
  let rail: HTMLElement | null = null
  let pin: HTMLElement | null = null
  function refresh() {
    root = stage.querySelector<HTMLElement>('[data-phone]')!
    floor = stage.querySelector<HTMLElement>('[data-floor]')!
    glare = root.querySelector<HTMLElement>('[data-glare]')
    screens = Object.fromEntries([...root.querySelectorAll<HTMLElement>('[data-screen]')].map((el) => [el.dataset.screen!, el]))
    checks = [...root.querySelectorAll<HTMLElement>('[data-check]')]
    rows = [...root.querySelectorAll<HTMLElement>('[data-row]')]
    bubbles = [...root.querySelectorAll<HTMLElement>('[data-bubble]')]
    cards = [...root.querySelectorAll<HTMLElement>('[data-card]')]
    notif = root.querySelector<HTMLElement>('[data-notif]')
    caps = [...section.querySelectorAll<HTMLElement>('[data-cap]')].sort((a, b) => Number(a.dataset.cap) - Number(b.dataset.cap))
    rail = section.querySelector<HTMLElement>('[data-rail]')
    pin = section.querySelector<HTMLElement>('.story-pin')
    last.clear()
    measure()
  }

  // escreve só quando muda (evita invalidar estilo à toa)
  const last = new Map<HTMLElement, string>()
  const set = (el: HTMLElement | null | undefined, transform: string | null, opacity?: number) => {
    if (!el) return
    const key = `${transform}|${opacity === undefined ? '' : opacity.toFixed(3)}`
    if (last.get(el) === key) return
    last.set(el, key)
    if (transform !== null) el.style.transform = transform
    if (opacity !== undefined) el.style.opacity = opacity.toFixed(3)
  }

  // ---------- rolagem → progresso ----------
  let anchors: number[] = [0]
  let vw = innerWidth, vh = innerHeight
  // pose de cada ato ajustada ao espaço que a legenda deixa livre (índice = ato)
  let fitted: Array<Pose | null> = []
  let sectionTop = 0
  let railTop = 0
  function measure() {
    vw = innerWidth; vh = innerHeight
    const marks = [...section.querySelectorAll<HTMLElement>('[data-act]')].sort((a, b) => Number(a.dataset.act) - Number(b.dataset.act))
    // p = 0 quando o topo da seção encosta no pé da tela; ato k = topo do marco k no topo da
    // tela (é quando a legenda fica presa)
    const top = (el: Element) => el.getBoundingClientRect().top + scrollY
    sectionTop = top(section)
    anchors = [Math.max(0, sectionTop - vh), ...marks.map(top)]
    const pinTop = pin ? pin.getBoundingClientRect().top : 0
    // a barra de passos fica embaixo: o celular não pode descer até ela
    railTop = rail && getComputedStyle(rail).display !== 'none' ? rail.getBoundingClientRect().top - pinTop : vh
    fitted = [null, ...caps.map((c, i) => fitAct(i + 1, c, pinTop))]
    wake()
  }
  function progressFromScroll() {
    const s = scrollY
    for (let k = 0; k < anchors.length - 1; k++) {
      if (s < anchors[k + 1]) return k + Math.max(0, s - anchors[k]) / Math.max(1, anchors[k + 1] - anchors[k])
    }
    return anchors.length - 1 + (s - anchors[anchors.length - 1]) / vh
  }

  // ---------- estado animado ----------
  let p = progressFromScroll()
  let prevP = p
  let idle = 1
  let spinStart = -1e9
  let shakeStart = -1e9
  let raf = 0, lastT = performance.now()
  // pulo (ver item 6 do topo): até quando esconder, e a visibilidade atual (0..1)
  let jumpUntil = 0, jumpVis = 1, lastTarget = NaN, speed = 0
  const JUMP_SPEED = 6                    // atos por segundo (média de ~150 ms); rolagem normal fica bem abaixo
  const born = performance.now()

  /**
   * Pose do ato k ajustada à legenda. O CSS diz onde a legenda fica (--cap: top | bottom |
   * left | right) e o celular ocupa o espaço que sobra, com o maior tamanho que couber (até a
   * escala do ato). Desfaz a projeção da perspectiva para o celular cair no ponto calculado.
   * `pinTop`: onde a faixa das legendas está agora; no ato ela está presa no topo (0).
   */
  function fitAct(k: number, cap: HTMLElement, pinTop: number): Pose | null {
    const base = keys[k]
    if (!base) return null
    const side = getComputedStyle(cap).getPropertyValue('--cap').trim()
    const r = cap.getBoundingClientRect()
    const capTop = r.top - pinTop, capBot = r.bottom - pinTop
    const z = base[2], d = PERSPECTIVE / (PERSPECTIVE - z), oy = vh * ORIGIN_Y
    const unY = (yc: number) => ((yc - oy) / d + oy - vh / 2) / vh * 100
    // lado a lado tem a altura toda para o celular: usa o tamanho dos atos laterais (até 1)
    const maxS = side === 'left' || side === 'right' ? Math.max(base[3], 1) : base[3]
    // folga para a inclinação (o celular inclinado projeta mais alto que 540 px × escala)
    const tilt = side === 'top' || side === 'bottom' ? 1.14 : 1.06
    const fitS = (h: number) => Math.min(maxS, Math.max(0.28, h / (540 * d * tilt)))
    const head = 80                                             // cabeçalho fixo
    // 40 px acima da barra: cobre o "flutuar" (sobe e desce ~1,1vh) sem encostar nela
    let x = base[0], y0 = head, y1 = Math.min(vh - 24, railTop - 40)
    // lado a lado: a legenda encosta no centro (CSS: 48 px do meio) e o celular fica no meio da
    // metade livre, limitada a 600 px; assim os dois formam um bloco só em telas largas
    const sideX = ((48 + (Math.min(vw / 2, 600) - 48) / 2) / vw) * 100
    if (side === 'top') y0 = capBot + 36
    else if (side === 'bottom') y1 = capTop - 20
    else if (side === 'left') x = sideX                         // legenda à esquerda → celular à direita
    else if (side === 'right') x = -sideX
    const s = fitS(y1 - y0)
    return [x / d, unY((y0 + y1) / 2), z, s, base[4], base[5], base[6]]
  }

  function pose(pp: number): Pose {
    const k = Math.min(keys.length - 2, Math.max(0, Math.floor(pp)))
    const f = clamp01(pp - k)
    const key = (i: number) => fitted[i] ?? keys[i]
    if (k === 0) {
      // entrada: preso à faixa das legendas, que ainda está subindo. O deslocamento vem da
      // rolagem de verdade (sem amortecer), senão ao rolar rápido o celular atrasa e encosta na
      // legenda; mesma profundidade do ato 1, então o deslocamento na tela é exato.
      // A rotação usa o p amortecido: gira (volta inteira em Y) enquanto sobe.
      const a1 = key(1), a0 = keys[0], e = smoother(f)
      const d = PERSPECTIVE / (PERSPECTIVE - a1[2])
      const shift = Math.max(0, sectionTop - scrollY)            // px que a faixa ainda está abaixo do topo
      return [a1[0], a1[1] + ((shift / vh) * 100) / d, a1[2], a1[3] * (0.82 + 0.18 * e),
        a0[4] + (a1[4] - a0[4]) * e, a0[5] + (a1[5] - a0[5]) * e, a0[6] + (a1[6] - a0[6]) * e]
    }
    const e = smoother(clamp01((f - 0.35) / 0.3))   // parado perto dos atos, viaja no terço central
    const a = key(k), b = key(k + 1)
    return a.map((v, i) => v + (b[i] - v) * e) as Pose
  }

  function frame(now: number) {
    const dt = Math.min(0.05, (now - lastT) / 1000)
    lastT = now
    const target = progressFromScroll()
    // velocidade média (~150 ms): um "dente" da roda que pula 100 px num quadro não conta;
    // a rolagem suave de um link do menu ou um arremesso forte, sim
    if (!Number.isNaN(lastTarget) && dt > 0) speed += (Math.abs(target - lastTarget) / dt - speed) * (1 - Math.exp(-dt / 0.15))
    if (speed > JUMP_SPEED) jumpUntil = Math.max(jumpUntil, now + 220)
    lastTarget = target
    const jumping = now < jumpUntil
    if (jumping) { p = target; prevP = target } else p += (target - p) * (1 - Math.exp(-dt * 7))
    // some rápido no pulo, volta suave depois
    jumpVis += ((jumping ? 0 : 1) - jumpVis) * (1 - Math.exp(-dt * (jumping ? 45 : 5)))
    const moving = Math.abs(target - p) > 0.0015 || jumping || jumpVis < 0.99
    idle += ((moving ? 0 : 1) - idle) * (1 - Math.exp(-dt * (moving ? 6 : 1.8)))

    let [x, y, z, s, rx, ry, rz] = pose(Math.min(p, keys.length - 1))
    const t = now / 1000
    // flutuar quando a rolagem para
    y += Math.sin(t * 1.2) * 1.1 * idle
    rx += Math.sin(t * 0.8) * 2 * idle
    ry += Math.sin(t * 0.6) * 3 * idle
    rz += Math.sin(t * 1.0 + 1) * 1.4 * idle
    // volta extra ao trocar procurar/anunciar
    const sp = clamp01((now - spinStart) / 1100)
    if (sp < 1) ry += 360 * (sp < 0.5 ? 4 * sp ** 3 : 1 - (-2 * sp + 2) ** 3 / 2)
    // vibração quando a notificação chega (só rolando para baixo)
    if (prevP < 2.8 && p >= 2.8) shakeStart = now
    prevP = p
    const sk = (now - shakeStart) / 480
    let shakeX = 0
    if (sk >= 0 && sk < 1) {
      const decay = 1 - sk
      shakeX = Math.sin(sk * 70) * 4 * decay
      rz += Math.sin(sk * 90) * 2.2 * decay
    }

    const xPx = (x * vw) / 100 + shakeX, yPx = (y * vh) / 100
    set(root, `translate3d(${xPx.toFixed(1)}px, ${yPx.toFixed(1)}px, ${z.toFixed(1)}px) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg) rotateZ(${rz.toFixed(2)}deg) scale(${s.toFixed(4)})`)

    // sombra no chão: segue a projeção do celular, cresce e clareia quando ele se afasta do chão
    const d = PERSPECTIVE / (PERSPECTIVE - z)
    const lift = Math.cos(rad(rx)) * 285 * s + 30 * s
    // aparece quando a seção chega (p 0 → 0,4) e some na saída; fade curto ao carregar
    const out = win(p, 0, 0.18) * (1 - win(p, 3.45, 3.85)) * clamp01((now - born) / 450) * jumpVis
    set(floor, `translate3d(${(xPx * d).toFixed(1)}px, ${((yPx + lift) * d).toFixed(1)}px, 0) scale(${(s * d * 1.05).toFixed(3)}, ${(s * d * (0.22 + Math.sin(rad(rx)) * 0.5)).toFixed(3)})`,
      Math.min(0.6, Math.max(0.15, 0.48 - z / 1600)) * out)
    set(stage, null, out)
    stage.style.visibility = out < 0.01 ? 'hidden' : ''

    if (glare) set(glare, `translateX(${(Math.sin(rad(ry)) * 140).toFixed(1)}px) rotate(18deg)`, 0.35 + 0.25 * Math.cos(rad(rx)))

    // barra de passos: acompanha o celular e marca o ato mais próximo
    if (rail) {
      set(rail, null, out * win(p, 0.9, 1))                   // só depois que o celular assentou no ato 1
      const stepNow = String(Math.min(3, Math.max(1, Math.round(p))))
      if (pin && pin.dataset.step !== stepNow) pin.dataset.step = stepNow
    }

    // legendas: aparecem só com o celular parado no ato (p ± 0,22) e somem antes de ele viajar
    caps.forEach((el, i) => {
      const k = i + 1
      // a 1ª já vem visível, subindo com a página; as outras entram quando o celular para
      // a legenda 1 sobe com a página como conteúdo normal; depois de presa (p > 1) some no pulo
      const o = (k === 1 ? (p <= 1 ? 1 : jumpVis) : win(p, k - 0.34, k - 0.24) * jumpVis) * (1 - win(p, k + 0.24, k + 0.34))
      const dir = p < k ? 1 : -1                                // entra subindo, sai subindo
      set(el, `translateY(${((1 - o) * 18 * dir).toFixed(1)}px)`, o)
      el.style.visibility = o < 0.01 ? 'hidden' : 'visible'
    })

    // telas (crossfade ligado à rolagem)
    const op: Record<string, number> = {
      home: 1 - win(p, 0.35, 0.55),
      habits: win(p, 0.35, 0.55) * (1 - win(p, 1.4, 1.6)),
      list: win(p, 1.4, 1.6) * (1 - win(p, 2.62, 2.78)),
      chat: win(p, 2.62, 2.78),
    }
    for (const [k, el] of Object.entries(screens)) set(el, `translateY(${((1 - op[k]) * 10).toFixed(1)}px)`, op[k])
    checks.forEach((el, i) => { const c = win(p, 0.62 + i * 0.1, 0.72 + i * 0.1); set(el, `scale(${(0.4 + 0.6 * c).toFixed(3)})`, c) })
    bubbles.forEach((el, i) => { const b = win(p, 2.84 + i * 0.08, 2.92 + i * 0.08); set(el, `translateY(${((1 - b) * 12).toFixed(1)}px)`, b) })
    if (notif) { const n = win(p, 2.74, 2.84) * (1 - win(p, 3.25, 3.4)); set(notif, `translateY(${((n - 1) * 70).toFixed(1)}px)`, n) }

    // cartões: saem da tela um por vez, orbitam, e voltam um por vez no ato seguinte
    cards.forEach((el, i) => {
      const e = win(p, 1.55 + i * 0.13, 1.8 + i * 0.13) * (1 - win(p, 2.25 + i * 0.12, 2.5 + i * 0.12))
      if (rows[i]) set(rows[i], null, 1 - e)
      if (e < 0.005) { set(el, 'translate3d(0,0,0)', 0); return }
      const theta = rad(ORBIT_BASE[i] + (quality === 'full' ? (p - 1.5) * 160 : 0))
      const ox = Math.sin(theta) * radius, oz = Math.cos(theta) * radius
      const cx = ox * e, cy = ROW_Y(i) + (ORBIT_Y[i] - ROW_Y(i)) * e, cz = 10 + (oz - 10) * e + Math.sin(Math.PI * e) * 150
      set(el, `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, ${cz.toFixed(1)}px) rotateY(${(-wrap(ry) * e).toFixed(1)}deg) scale(${(1 + 0.12 * e).toFixed(3)})`, Math.min(1, e * 4))
    })

    // parado e fora da seção: desliga o loop até a próxima rolagem
    if (!moving && out < 0.01 && idle > 0.99 && now - born > 600) { raf = 0; return }
    raf = requestAnimationFrame(frame)
  }

  function wake() {
    if (!raf) { lastT = performance.now(); raf = requestAnimationFrame(frame) }
  }

  const onMq = () => { keys = mq.matches ? MOBILE : DESKTOP; radius = mq.matches ? 250 : 240; measure() }
  const ro = new ResizeObserver(measure)
  ro.observe(document.body)
  addEventListener('scroll', wake, { passive: true })
  // link do menu: esconde já no clique (antes de a rolagem suave começar) e libera quando ela acaba
  const onClick = (e: MouseEvent) => {
    const a = (e.target as Element | null)?.closest?.('a[href^="#"]')
    if (!a) return
    jumpUntil = performance.now() + 1500
    wake()
  }
  const onScrollEnd = () => { jumpUntil = Math.min(jumpUntil, performance.now() + 120) }
  document.addEventListener('click', onClick, true)
  addEventListener('scrollend', onScrollEnd)
  addEventListener('resize', measure)
  mq.addEventListener('change', onMq)
  refresh()                     // também mede
  p = prevP = progressFromScroll()

  return {
    refresh,
    spin() { spinStart = performance.now(); wake() },
    destroy() {
      cancelAnimationFrame(raf); raf = 0
      ro.disconnect()
      removeEventListener('scroll', wake)
      document.removeEventListener('click', onClick, true)
      removeEventListener('scrollend', onScrollEnd)
      removeEventListener('resize', measure)
      mq.removeEventListener('change', onMq)
    },
  }
}
