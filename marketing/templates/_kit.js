// Kit das artes. Cada template define window.SCENE:
//   { width, height,
//     duration   segundos (0 = imagem estática)
//     slides     nº de slides (carrossel; render(i) para cada um)
//     cover      instante usado como capa do vídeo
//     setup()    async: carrega fontes e modelos 3D
//     render(t)  async: desenha o instante t (s) — ou o slide t no carrossel }
// A animação é uma FUNÇÃO DO TEMPO (nada de CSS transition/rAF solto), então o
// renderizador pode capturar quadro a quadro, sem depender da velocidade da máquina.
(() => {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
  const lerp = (a, b, t) => a + (b - a) * t
  // progresso de t entre a e b (0..1). Sem fim definido (Infinity) = nunca começa,
  // em vez de NaN — opacity/transform NaN são ignorados pelo navegador.
  const prog = (t, a, b) => (Number.isFinite(a) ? clamp((t - a) / (b - a || 1e-6)) : 0)
  const ease = {
    out3: (t) => 1 - Math.pow(1 - t, 3),
    inOut3: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    outExpo: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    backOut: (t, s = 1.7) => 1 + (s + 1) * Math.pow(t - 1, 3) + s * Math.pow(t - 1, 2),
  }
  /** entrada padrão: sobe e aparece entre a e b */
  const enter = (el, t, a, b, dy = 60) => {
    const p = ease.out3(prog(t, a, b))
    el.style.opacity = p
    el.style.transform = `translateY(${(1 - p) * dy}px)`
    return p
  }
  /** saída padrão: sobe e some entre a e b */
  const leave = (el, t, a, b, dy = -40) => {
    const p = ease.inOut3(prog(t, a, b))
    if (p > 0) { el.style.opacity = 1 - p; el.style.transform = `translateY(${p * dy}px)` }
    return p
  }
  /** entra em [inA, inB] e sai em [outA, outB] (sobe e some) */
  const show = (el, t, inA, inB, outA = Infinity, outB = Infinity, dy = 60) => {
    const pin = ease.out3(prog(t, inA, inB))
    const pout = ease.inOut3(prog(t, outA, outB))
    el.style.opacity = pin * (1 - pout)
    el.style.transform = `translateY(${(1 - pin) * dy - pout * 40}px)`
    return pin * (1 - pout)
  }
  /** linhas de texto que sobem de trás de uma máscara (.line > span), em cascata */
  const lines = (els, t, start, step = 0.18, dur = 0.6, outA = Infinity, outB = Infinity) => {
    els.forEach((line, i) => {
      const span = line.firstElementChild
      const pin = ease.outExpo(prog(t, start + i * step, start + i * step + dur))
      const pout = ease.inOut3(prog(t, outA + i * 0.06, outB + i * 0.06))
      span.style.transform = `translateY(${(1 - pin) * 110 - pout * 110}%)`
    })
  }
  const frames = (n = 3) => new Promise((r) => { const f = () => (--n ? requestAnimationFrame(f) : r()); requestAnimationFrame(f) })

  let mvLoading
  const loadMV = () => (mvLoading ??= import('/frontend/node_modules/@google/model-viewer/dist/model-viewer.min.js'))

  /** Cria um <model-viewer>, espera carregar e devolve o elemento. */
  async function model(parent, src, attrs = {}) {
    await loadMV()
    const mv = document.createElement('model-viewer')
    const base = {
      src, 'environment-image': 'neutral', 'interaction-prompt': 'none',
      'disable-zoom': '', 'disable-pan': '', 'disable-tap': '', loading: 'eager',
    }
    for (const [k, v] of Object.entries({ ...base, ...attrs })) mv.setAttribute(k, v)
    // slot vazio no lugar da barra de carregamento padrão (aparecia como um risco)
    const noBar = document.createElement('div')
    noBar.slot = 'progress-bar'
    mv.append(noBar)
    parent.append(mv)
    await new Promise((res, rej) => { mv.addEventListener('load', res, { once: true }); mv.addEventListener('error', rej, { once: true }) })
    mv.pause?.()
    return mv
  }

  /** Posiciona câmera / quadro da animação "split" (0 colado … 1 rachado). */
  function pose(mv, { yaw = 20, pitch = 62, split = null } = {}) {
    mv.cameraOrbit = `${yaw}deg ${pitch}deg auto`
    mv.jumpCameraToGoal()
    if (split !== null) mv.currentTime = split
  }

  function tint(mv, materialName, color) {
    mv.model?.getMaterialByName(materialName)?.pbrMetallicRoughness.setBaseColorFactor(color)
  }

  async function ready() {
    await document.fonts.ready
    await frames(2)
  }

  window.kit = { clamp, lerp, prog, ease, enter, leave, show, lines, frames, model, pose, tint, ready }

  // ícones (traço no estilo lucide)
  const path = {
    check: '<path d="M20 6 9 17l-5-5"/>',
    home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.6 5.6l2.8 2.8M15.6 15.6l2.8 2.8M5.6 18.4l2.8-2.8M15.6 8.4l2.8-2.8"/>',
    chat: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
    pin: '<path d="M12 21s-7-6.1-7-11a7 7 0 0 1 14 0c0 4.9-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    shield: '<path d="M12 3 4 6v6c0 5 3.4 8.6 8 9 4.6-.4 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    gauge: '<path d="M4 18a8 8 0 1 1 16 0"/><path d="m12 18 4.5-5.5"/><circle cx="12" cy="18" r="1.3"/>',
  }
  window.icon = (name, size = 28) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">${path[name]}</svg>`
})()
