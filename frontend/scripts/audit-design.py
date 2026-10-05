"""Auditoria do design system (Etapa 1). Só lê o código; não muda nada.

Uso:  python scripts/audit-design.py > ../docs/design-audit-raw.txt
Gera um relatório em texto com contagens e arquivo:linha de cada achado.
"""
import collections
import os
import re
import sys

ROOT = os.path.join(os.path.dirname(__file__), '..', 'src')
sys.stdout.reconfigure(encoding='utf-8')


def files(exts):
    for d, _, fs in os.walk(ROOT):
        for f in fs:
            if f.endswith(exts):
                yield os.path.join(d, f)


def rel(p):
    return os.path.relpath(p, ROOT).replace('\\', '/')


src = {rel(p): open(p, encoding='utf-8').read() for p in files(('.tsx', '.ts', '.css'))}
tsx = {k: v for k, v in src.items() if k.endswith('.tsx')}
css = {k: v for k, v in src.items() if k.endswith('.css')}
landing = lambda k: k.startswith('pages/landing') or k in ('pages/HomePage.tsx', 'pages/home.css') or k.startswith('landing3d')


def lines_with(pattern, where, flags=0):
    rx = re.compile(pattern, flags)
    out = []
    for k, v in where.items():
        for i, line in enumerate(v.splitlines(), 1):
            for m in rx.finditer(line):
                out.append((k, i, m.group(0), line.strip()))
    return out


def section(t):
    print('\n' + '=' * 100 + '\n' + t + '\n' + '=' * 100)


# ---------------------------------------------------------------- tokens do @theme
section('1. TOKENS DO @theme (index.css) E USO')
idx = src['index.css']
theme = idx[idx.index('@theme'):idx.index(':root[data-theme')]
dark = idx[idx.index(':root[data-theme'):]
tokens = re.findall(r'--([a-z0-9-]+):\s*([^;]+);', theme)
dark_tokens = dict(re.findall(r'--([a-z0-9-]+):\s*([^;]+);', dark))
allcode = '\n'.join(src.values())
for name, val in tokens:
    short = re.sub(r'^(color|font|radius|shadow)-', '', name)
    kind = name.split('-')[0]
    if kind == 'color':
        uses = len(re.findall(r'(?<![\w-])(?:bg|text|border|ring|fill|stroke|from|to|via|outline|decoration|divide|accent|caret|placeholder|shadow)-' + re.escape(short) + r'(?![\w-])', allcode))
    elif kind == 'radius':
        uses = len(re.findall(r'rounded(?:-[trbl]{1,2})?-' + re.escape(short) + r'(?![\w-])', allcode))
    elif kind == 'shadow':
        uses = len(re.findall(r'shadow-' + re.escape(short) + r'(?![\w-])', allcode))
    elif kind == 'font':
        uses = len(re.findall(r'font-' + re.escape(short) + r'(?![\w-])', allcode))
    else:
        uses = 0
    uses += len(re.findall(r'var\(--' + re.escape(name) + r'\)', allcode))
    print(f'  --{name:<22} {val.strip()[:34]:<36} dark={dark_tokens.get(name, "—")[:24]:<26} usos={uses}')
vals = collections.defaultdict(list)
for n, v in tokens:
    vals[v.strip().lower()].append(n)
dups = {v: ns for v, ns in vals.items() if len(ns) > 1}
print('\n  Valores duplicados no @theme:', dups or 'nenhum')
print('  Tokens sem par no tema escuro:', [n for n, _ in tokens if n.startswith('color') and n not in dark_tokens])

# ---------------------------------------------------------------- valores soltos
section('2. VALORES SOLTOS')
hexes = [h for h in lines_with(r'#[0-9a-fA-F]{3,8}\b', src) if h[0] != 'index.css' and not h[3].startswith('//')]
print(f'\n2.1 Cores hex fora do index.css: {len(hexes)}')
for k, c in collections.Counter(h[0] for h in hexes).most_common():
    print(f'    {c:>4}  {k}')
rgbs = [h for h in lines_with(r'rgba?\([^)]*\)', src) if h[0] != 'index.css']
print(f'\n2.2 rgb()/rgba() fora do index.css: {len(rgbs)}')
for k, c in collections.Counter(h[0] for h in rgbs).most_common():
    print(f'    {c:>4}  {k}')
styles = lines_with(r'style=\{\{[^}]*\}\}', tsx) + lines_with(r'style=\{[a-zA-Z(][^}]*\}', tsx)
print(f'\n2.3 style={{...}} em .tsx: {len(styles)} ocorrências em {len(set(s[0] for s in styles))} arquivos')
for s in styles:
    print(f'    {s[0]}:{s[1]}  {s[2][:90]}')
arb = lines_with(r'(?<![\w-])(?:text|leading|tracking|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|gap|w|h|min-w|min-h|max-w|max-h|rounded|top|left|right|bottom|inset|z|duration|shadow|size|translate-y|space-y|space-x)-\[[^\]]+\]', tsx)
print(f'\n2.4 Valores arbitrários do Tailwind (classe-[valor]) em .tsx: {len(arb)}')
by_kind = collections.Counter(re.match(r'([a-z-]+)-\[', a[2]).group(1) + '-[' + a[2].split('[')[1] for a in arb)
for k, c in by_kind.most_common(45):
    print(f'    {c:>4}  {k}')
print('\n  por arquivo:')
for k, c in collections.Counter(a[0] for a in arb).most_common():
    print(f'    {c:>4}  {k}{"  (landing)" if landing(k) else ""}')
raw = lines_with(r'(?<![\w-])(?:bg|text|border|ring|from|to|fill|stroke)-(?:gray|slate|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{2,3})?(?:/\d+)?(?![\w-])', tsx)
print(f'\n2.5 Classes de paleta crua do Tailwind (bg-gray-*, text-white…): {len(raw)}')
for r in raw:
    print(f'    {r[0]}:{r[1]}  {r[2]}')
cssfont = lines_with(r'font-size:\s*[^;]+', css)
print(f'\n2.6 font-size em CSS: {len(cssfont)} ({collections.Counter(c[0] for c in cssfont)})')
print('    valores:', collections.Counter(re.sub(r'font-size:\s*', '', c[2]).strip() for c in cssfont).most_common(30))
cssrad = lines_with(r'border-radius:\s*[^;]+', css)
print(f'\n2.7 border-radius em CSS: {len(cssrad)}; valores:', collections.Counter(re.sub(r'border-radius:\s*', '', c[2]).strip() for c in cssrad).most_common(20))
cssshadow = lines_with(r'box-shadow:\s*[^;]+', css)
print(f'\n2.8 box-shadow em CSS: {len(cssshadow)} declarações diferentes: {len(set(c[2] for c in cssshadow))}')
dur = lines_with(r'(?:duration-\d+|\d+(?:\.\d+)?m?s(?=[\s,;)]))', src)
durs = collections.Counter(d[2] for d in dur)
print(f'\n2.9 Durações (duration-N e Nms/Ns): {len(dur)}; valores distintos: {len(durs)}')
print('    ', durs.most_common(30))
zs = lines_with(r'(?:z-\d+|z-\[\d+\]|z-index:\s*-?\d+)', src)
print(f'\n2.10 z-index: {len(zs)}; valores:', collections.Counter(z[2] for z in zs).most_common())
for z in zs:
    print(f'    {z[0]}:{z[1]}  {z[2]}')
radius_tw = lines_with(r'(?<![\w-])rounded(?:-[trbl]{1,2})?(?:-(?:none|sm|md|lg|xl|2xl|3xl|full|\[[^\]]+\]))?(?![\w-])', tsx)
print(f'\n2.11 Raios no TSX: {len(radius_tw)}')
print('    ', collections.Counter(r[2] for r in radius_tw).most_common())
shadow_tw = lines_with(r'(?<![\w-])shadow(?:-[a-z0-9]+|-\[[^\]]+\])?(?![\w-])', tsx)
print(f'\n2.12 Sombras no TSX: {len(shadow_tw)}', collections.Counter(r[2] for r in shadow_tw).most_common())
fs_tw = lines_with(r'(?<![\w-])text-(?:xs|sm|base|lg|xl|2xl|3xl|4xl|5xl|\[\d+(?:\.\d+)?px\])(?![\w-])', tsx)
print(f'\n2.13 Tamanhos de fonte no TSX: {len(fs_tw)}')
print('    ', collections.Counter(r[2] for r in fs_tw).most_common())

# ---------------------------------------------------------------- componentes
section('3. VARIAÇÕES DE COMPONENTES (por assinatura de classe)')


def sig(cls, keep):
    parts = [c for c in cls.split() if re.match(keep, c)]
    return ' '.join(sorted(set(parts)))


def components(tag_rx, keep, title, where=tsx):
    groups = collections.defaultdict(list)
    for k, v in where.items():
        for m in re.finditer(tag_rx, v, re.S):
            cls = m.group(1)
            line = v[:m.start()].count('\n') + 1
            groups[sig(cls, keep)].append(f'{k}:{line}')
    print(f'\n{title}: {sum(len(g) for g in groups.values())} ocorrências, {len(groups)} variações')
    for s, locs in sorted(groups.items(), key=lambda x: -len(x[1])):
        print(f'   [{len(locs):>3}] {s or "(sem classes de aparência)"}')
        print('         ' + ', '.join(locs[:6]) + (' …' if len(locs) > 6 else ''))
    return groups


KEEP_BTN = r'^(?:h-|px-|py-|rounded|bg-|text-(?:sm|xs|base|on-|ink|brand|coral|danger|leaf|\[)|font-|border|shadow|w-full|leading-)'
btn = components(r'<button[^>]*?className=[{"`]+([^"`}]*)', KEEP_BTN, '3.1 <button>')
lnk = components(r'<Link[^>]*?className=[{"`]+([^"`}]*(?:bg-brand|bg-coral|bg-danger|border-line-strong)[^"`}]*)', KEEP_BTN, '3.2 <Link> com cara de botão')
inp = components(r'<(?:input|textarea|select)[^>]*?className=[{"`]+([^"`}]*)', r'^(?:h-|px-|py-|rounded|bg-|text-|border|focus|ring|outline|w-)', '3.3 <input>/<textarea>/<select>')
for k, v in tsx.items():
    for m in re.finditer(r'(?:const|let)\s+(\w*(?:[Cc]lass|Style)\w*)\s*=\s*[\'"`]', v):
        print(f'   classe compartilhada: {k}: {m.group(1)}')
card = components(r'className=[{"`]+([^"`}]*rounded-(?:lg|xl|2xl|md)[^"`}]*border[^"`}]*bg-surface[^"`}]*|[^"`}]*bg-surface[^"`}]*rounded-(?:lg|xl|2xl|md)[^"`}]*border[^"`}]*)', r'^(?:p-|px-|py-|rounded|bg-|border|shadow)', '3.4 Cartões (bg-surface + border + rounded)')
modal = lines_with(r'fixed inset-0', tsx)
print(f'\n3.5 Modais (fixed inset-0): {len(modal)}')
for m in modal:
    print(f'    {m[0]}:{m[1]}  {m[3][:110]}')
chips = lines_with(r'rounded-full[^"`]*(?:px-2|px-3)[^"`]*(?:text-xs|text-\[1[123]px\]|text-sm)', tsx)
print(f'\n3.6 Chips/badges (rounded-full + px + texto pequeno): {len(chips)}')
for c in collections.Counter(c[0] for c in chips).most_common():
    print(f'    {c[1]:>3}  {c[0]}')
banners = lines_with(r'bg-(?:danger|leaf|mel|brand|coral)-tint[^"`]*(?:px-|p-)', tsx)
print(f'\n3.7 Avisos/banners (fundo -tint + padding): {len(banners)}')
for b in banners:
    print(f'    {b[0]}:{b[1]}  {b[2][:60]}')
toggles = lines_with(r'role="switch"|aria-pressed|type="checkbox"', tsx)
print(f'\n3.8 Toggles/checkbox/aria-pressed: {len(toggles)}')
for t in toggles:
    print(f'    {t[0]}:{t[1]}  {t[3][:100]}')
empty = lines_with(r'(?:Nenhum|Nenhuma|ainda não|Você ainda|Sem (?:resultados|anúncios|conversas|notifica))', tsx)
print(f'\n3.9 Estados vazios (texto "Nenhum…/ainda não…"): {len(empty)}')
for e in empty:
    print(f'    {e[0]}:{e[1]}  {e[3][:100]}')
loading = lines_with(r'Carregando|animate-pulse|animate-spin|Loader2', tsx)
print(f'\n3.10 Carregando (texto/spinner/pulse): {len(loading)}')
for c in collections.Counter(l[0] for l in loading).most_common():
    print(f'    {c[1]:>3}  {c[0]}')

# ---------------------------------------------------------------- tipografia
section('4. TIPOGRAFIA: FONTE E TAMANHO DE CADA TÍTULO, POR TELA')
for k, v in sorted(tsx.items()):
    for m in re.finditer(r'<(h[1-3])([^>]*)>', v):
        line = v[:m.start()].count('\n') + 1
        cls = re.search(r'className=[{"`]+([^"`}]*)', m.group(2))
        c = cls.group(1) if cls else ''
        font = 'serif(Fraunces)' if 'font-serif' in c else ('landing-h2' if 'landing-h2' in c else 'sans')
        size = ' '.join(x for x in c.split() if re.match(r'text-(?:xs|sm|base|lg|xl|\dxl|\[)', x)) or ('(css)' if 'landing' in c or 'hero' in c else '—')
        weight = ' '.join(x for x in c.split() if x.startswith('font-') and x != 'font-serif') or '—'
        print(f'  {k:<44}:{line:<4} {m.group(1)}  {font:<16} {size:<22} {weight}')
serif = lines_with(r'font-serif', tsx)
print(f'\n  font-serif (Fraunces): {len(serif)} usos em {len(set(s[0] for s in serif))} arquivos')
mono = lines_with(r'font-mono|monospace|ui-monospace', src)
print(f'  fonte mono: {[(m[0], m[1]) for m in mono]}')

# ---------------------------------------------------------------- logo
section('5. LOGO')
logo = lines_with(r'<Logo(?:Mark)?[^>]*>', tsx)
for l in logo:
    print(f'  {l[0]}:{l[1]}  {l[2]}')
hand = lines_with(r'Racha<span', tsx)
print('  escrita à mão (Racha<span): ', [(h[0], h[1]) for h in hand])
auth_pages = ['LoginPage', 'RegisterPage', 'ForgotPasswordPage', 'ResetPasswordPage', 'ConfirmEmailPage', 'OnboardingPage', 'PaymentReturnPage']
for pg in auth_pages:
    k = f'pages/{pg}.tsx'
    print(f'  {pg:<20} tem Logo: {"<Logo" in tsx.get(k, "")}')

# ---------------------------------------------------------------- landing x app
section('6. LANDING x APP')
for label, pred in (('landing', landing), ('app', lambda k: not landing(k))):
    sub = {k: v for k, v in tsx.items() if pred(k)}
    rad = collections.Counter(r[2] for r in lines_with(r'(?<![\w-])rounded(?:-[a-z0-9]+|-\[[^\]]+\])?(?![\w-])', sub))
    print(f'  {label}: raios {rad.most_common(6)}')
print('  landing (home.css): raios', collections.Counter(re.sub(r'border-radius:\s*', '', c[2]).strip() for c in lines_with(r'border-radius:\s*[^;]+', {'pages/home.css': css['pages/home.css']})).most_common(8))
