"""Monta os ícones das poses: recorta o mascote (PNG transparente), centraliza num quadrado de cantos
arredondados (22%) com o fundo da marca e uma sombra suave, e gera a folha de exemplos."""
import sys, json, pathlib
from PIL import Image, ImageDraw, ImageFilter
S = pathlib.Path(__file__).parent
D = pathlib.Path(sys.argv[1])
T = 1024

def lin(c1, c2, k): return tuple(int(a + (b - a) * k) for a, b in zip(c1, c2))
def hexc(h): return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))

def radial(c_in, c_out, cx=0.3, cy=0.25):
    im = Image.new('RGB', (T, T)); px = im.load()
    a, b = hexc(c_in), hexc(c_out)
    for y in range(T):
        for x in range(T):
            d = min(1, (((x / T - cx) ** 2 + (y / T - cy) ** 2) ** 0.5) / 1.05)
            px[x, y] = lin(a, b, d)
    return im

def praia():
    im = Image.new('RGB', (T, T)); dr = ImageDraw.Draw(im)
    ceu, ceu2, areia, areia2 = hexc('#c7e6f3'), hexc('#e3f2f8'), hexc('#f0dcb8'), hexc('#e6cc9f')
    h = int(T * 0.56)
    for y in range(T):
        dr.line([(0, y), (T, y)], fill=lin(ceu, ceu2, y / h) if y < h else lin(areia, areia2, (y - h) / (T - h)))
    return im

FUNDOS = {
    'azul': lambda: radial('#2f86a8', '#174c62'),
    'creme': lambda: radial('#ffffff', '#f1e8da'),
    'coral': lambda: radial('#f7a585', '#c94f2c'),
    'praia': praia,
    'escuro': lambda: radial('#34474f', '#16232a'),
}
cache = {}

def mascote(nome, caixa=0.76):
    im = Image.open(S / 'out' / f'{nome}.png').convert('RGBA')
    im = im.crop(im.getbbox())
    k = caixa * T / max(im.size)
    return im.resize((round(im.width * k), round(im.height * k)), Image.LANCZOS)

def icone(nome, fundo):
    bg = cache.setdefault(fundo, FUNDOS[fundo]()).convert('RGBA').copy()
    m = mascote(nome)
    x, y = (T - m.width) // 2, (T - m.height) // 2 + int(T * 0.02)
    sombra = Image.new('RGBA', (T, T), (0, 0, 0, 0))
    a = m.getchannel('A').point(lambda v: int(v * 0.32))
    sombra.paste(Image.new('RGBA', m.size, (10, 30, 40, 255)), (x, y + 26), a)
    bg.alpha_composite(sombra.filter(ImageFilter.GaussianBlur(28)))
    bg.alpha_composite(m, (x, y))
    mask = Image.new('L', (T * 4, T * 4), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, T * 4 - 1, T * 4 - 1], radius=int(T * 4 * 0.22), fill=255)
    bg.putalpha(mask.resize((T, T), Image.LANCZOS))
    return bg

POSES = json.loads((S / (sys.argv[2] if len(sys.argv) > 2 else 'poses.json')).read_text('utf-8'))
ESCOLHA = {  # fundo de cada pose na folha (todas saem nos 5 fundos)
    'acenando': 'azul', 'comemorando': 'coral', 'piscando': 'creme', 'andando': 'praia', 'de-perfil': 'escuro',
    'visto-de-cima': 'creme', 'jogando-a-concha': 'azul', 'casa-nova': 'praia', 'espiando': 'coral', 'cochilando': 'escuro'}
for nome in POSES:
    t = Image.open(S / 'out' / f'{nome}.png').convert('RGBA'); t.crop(t.getbbox()).save(D / 'transparente' / f'{nome}.png')
    for f in FUNDOS:
        icone(nome, f).save(D / 'icones' / f'{nome}-{f}.png')
    print('ok', nome)
ESCOLHA.update({'eremita': 'creme', 'eremita-espelhado': 'azul', 'eremita-acenando': 'coral', 'eremita-andando': 'praia',
    'eremita-espiando': 'escuro', 'eremita-timido': 'creme', 'eremita-piscando': 'azul', 'eremita-visto-de-cima': 'coral'})
ciclo = ['creme', 'azul', 'coral', 'praia', 'escuro']
anterior = json.load(open(D / 'icones' / '_escolha.json')) if (D / 'icones' / '_escolha.json').exists() else {}
for i, nome in enumerate(n for n in POSES if n not in ESCOLHA):
    ESCOLHA[nome] = ciclo[i % len(ciclo)]
json.dump({**anterior, **ESCOLHA}, open(D / 'icones' / '_escolha.json', 'w'))
