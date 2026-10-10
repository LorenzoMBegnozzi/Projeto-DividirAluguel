"""Logo minimalista do Toc Toc Who?: a concha estrela vista de cima, em vetor.
A silhueta sai da mesma ideia do modelo 3D (espiral que cresce, pontas arredondadas em volta da última
volta, boca lisa) e a espiral clara por cima. O nome vira curvas (Schibsted Grotesk 800), sem depender de fonte.
Rodar: python fonte/gerar_svg.py  (gera os SVG em ./)"""
import math, pathlib
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

AQUI = pathlib.Path(__file__).parent
SAIDA = AQUI.parent
AZUL, AZUL_ESC, CLARO, CORAL, TINTA, CREME = '#1e5f7a', '#174c62', '#dcebf1', '#e8704a', '#1b2b33', '#faf7f2'
AZUL_NOITE, CORAL_NOITE = '#5fb3d1', '#f08c6a'

# ---------------- concha ----------------
def concha_paths(cx=50, cy=50, R=40):
    """A concha estrela vista de cima, com a mesma conta do modelo 3D (generate-landing-crab.mjs):
    espiral logarítmica (crescimento 2,4× por volta, enrolamento 0,5, tubo 0,42) com 10 pontas por volta na borda.
    Silhueta = raio da espiral + raio do tubo com as pontas, na última volta; ela fecha na boca com o degrau
    para a volta anterior. A espiral clara é o centro do tubo, das voltas de dentro até a boca."""
    growth, coil, mouth, n, alt, agudo = 2.4, 0.5, 0.42, 10, 0.75, 4
    k = math.log(growth) / (2 * math.pi)
    girar = math.radians(-20)                          # boca à direita, um pouco para cima
    def spike(s):
        fade = min(1, -s / (math.pi * 0.7))             # a boca é lisa (igual ao 3D)
        return 1 + alt * fade * (0.5 + 0.5 * math.cos(s * n)) ** agudo
    borda = []
    N = 1400
    for i in range(N + 1):
        s = -2 * math.pi + 2 * math.pi * i / N
        g = math.exp(k * s)
        r = g * (coil + mouth * spike(s))
        borda.append((r, -s + girar))                  # sentido anti-horário na tela
    # centraliza pela caixa da silhueta e encaixa num quadrado de lado 2R
    xs = [r * math.cos(a) for r, a in borda]; ys = [r * math.sin(a) for r, a in borda]
    ox, oy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    escala = 2 * R / max(max(xs) - min(xs), max(ys) - min(ys))
    P = lambda r, a: (cx + (r * math.cos(a) - ox) * escala, cy + (r * math.sin(a) - oy) * escala)
    pts = [P(r, a) for r, a in borda]
    # boca: em vez de fechar reto, uma curva para dentro (o lábio da concha)
    (x1, y1), (x0, y0) = pts[-1], pts[0]
    mx, my = (x1 + x0) / 2, (y1 + y0) / 2
    pts.append((mx + (cx - mx) * 0.18, my + (cy - my) * 0.18))
    sil = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in pts) + 'Z'
    esp = []
    for i in range(500):
        s = -2.05 * 2 * math.pi + 2.05 * 2 * math.pi * i / 499 - 0.7   # começa onde as voltas já não se encostam
        esp.append(P(coil * math.exp(k * s), -s + girar))
    espiral = 'M' + ' L'.join(f'{x:.2f} {y:.2f}' for x, y in esp)
    return sil, espiral

def marca_svg(cor=AZUL, linha=CLARO, fundo=None, tam=100, rx=0, pad=0):
    sil, esp = concha_paths()
    s = pad
    view = f'{-s} {-s} {100 + 2 * s} {100 + 2 * s}'
    bg = f'<rect x="{-s}" y="{-s}" width="{100 + 2 * s}" height="{100 + 2 * s}" rx="{rx}" fill="{fundo}"/>' if fundo else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{view}" width="{tam}" height="{tam}" role="img" aria-label="Toc Toc Who?">'
            f'{bg}<path d="{sil}" fill="{cor}" stroke="{cor}" stroke-width="3" stroke-linejoin="round"/>'
            f'<path d="{esp}" fill="none" stroke="{linha}" stroke-width="4.6" stroke-linecap="round" stroke-linejoin="round"/></svg>\n')

# ---------------- nome em curvas ----------------
fonte = TTFont(AQUI / 'schibsted-latin.woff2')
if 'fvar' in fonte: fonte = instantiateVariableFont(fonte, {'wght': 800})
cmap, gs, upm = fonte.getBestCmap(), fonte.getGlyphSet(), fonte['head'].unitsPerEm
hmtx = fonte['hmtx']
def texto(txt, x, y, px, cor, track=-0.03):
    k = px / upm; partes = []; cx = x
    for ch in txt:
        g = cmap.get(ord(ch))
        if g is None: continue
        pen = SVGPathPen(gs)
        gs[g].draw(TransformPen(pen, (k, 0, 0, -k, cx, y)))
        d = pen.getCommands()
        if d: partes.append(d)
        cx += hmtx[g][0] * k + track * px
    return f'<path d="{" ".join(partes)}" fill="{cor}"/>', cx - x

def assinatura(tema='claro'):
    cor, linha, txt, who = (AZUL, CLARO, TINTA, CORAL) if tema == 'claro' else (AZUL_NOITE, AZUL_ESC, CREME, CORAL_NOITE)
    sil, esp = concha_paths(cx=50, cy=50, R=40)
    a, wa = texto('Toc Toc', 118, 48, 44, txt)
    b, wb = texto('who?', 118, 88, 44, who)
    w = 118 + max(wa, wb) + 6
    fundo = '' if tema == 'claro' else f'<rect width="{w:.0f}" height="100" fill="{TINTA}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} 100" role="img" aria-label="Toc Toc Who?">{fundo}'
            f'<path d="{sil}" fill="{cor}"/><path d="{esp}" fill="none" stroke="{linha}" stroke-width="4.6" stroke-linecap="round"/>{a}{b}</svg>\n')

def empilhada():
    sil, esp = concha_paths(cx=100, cy=52, R=44)
    a, wa = texto('Toc Toc who?', 0, 140, 30, TINTA)
    # centraliza o texto
    a, wa = texto('Toc Toc ', 0, 0, 30, TINTA); 
    t1, w1 = texto('Toc Toc ', 0, 0, 30, TINTA); t2, w2 = texto('who?', 0, 0, 30, CORAL)
    x0 = 100 - (w1 + w2) / 2
    t1, _ = texto('Toc Toc ', x0, 140, 30, TINTA); t2, _ = texto('who?', x0 + w1, 140, 30, CORAL)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 152" role="img" aria-label="Toc Toc Who?">'
            f'<path d="{sil}" fill="{AZUL}"/><path d="{esp}" fill="none" stroke="{CLARO}" stroke-width="5" stroke-linecap="round"/>{t1}{t2}</svg>\n')

arquivos = {
    'icone.svg': marca_svg(),
    'icone-escuro.svg': marca_svg(AZUL_NOITE, AZUL_ESC),
    'icone-mono.svg': marca_svg(TINTA, CREME),
    'icone-app.svg': marca_svg(CREME, AZUL, fundo=AZUL, tam=512, rx=26, pad=18),
    'favicon.svg': marca_svg(tam=64).replace('<path', '<style>@media (prefers-color-scheme: dark){path:first-of-type{fill:#5fb3d1;stroke:#5fb3d1}path:last-of-type{stroke:#174c62}}</style><path', 1),
    'assinatura.svg': assinatura('claro'),
    'assinatura-escuro.svg': assinatura('escuro'),
    'assinatura-empilhada.svg': empilhada(),
}
for n, s in arquivos.items(): (SAIDA / n).write_text(s, 'utf-8'); print('ok', n)
