"""Gera index.html do reel-01 (legendas, sons e tempos num lugar só): python build_index.py
Os tempos seguem 100 BPM (batida = 0,6 s). Mude aqui e rode de novo; as cenas em
compositions/ leem os mesmos tempos de window.RACHA_TIMES."""
import json, pathlib, random

raiz = pathlib.Path(__file__).parent
BEAT = 0.6
DUR = 17.5
FPS = 60

# cenas (cortes na batida: 4, 9, 13, 20 e 25)
CHAT, CARD, GRATIS, SIG = (0.0, 7.8), (7.8, 12.0), (12.0, 15.0), (15.0, 17.5)

N1, N2 = 14, 52
t1 = [round(0.04 + i * (2.3 / N1) * (1 - i / (N1 * 2.6)), 3) for i in range(N1)]
t2 = [round(2.4 + 2.8 * (i / N2) ** 0.75, 3) for i in range(N2)]

count_start, count_dur = 8.0, 0.9
chips = [8.4, 8.6, 8.8]
# um tique a cada dezena do selo (o número segue 1 - (1 - p)^3, como no app)
ticks = [round(count_start + count_dur * (1 - (1 - k / 92) ** (1 / 3)), 3) for k in (10, 20, 30, 40, 50, 60, 70, 80, 90, 92)]

# assinatura: metades começam 0,2 s depois do corte; encostam (resto < 1 px) 74 frames depois
sig_delay = 0.2
click = round(SIG[0] + sig_delay + 74 / FPS, 4)  # 16,4333 s = frame 986

times = dict(t1=t1, t2=t2, cardStart=CARD[0], countStart=count_start, countDur=count_dur,
             chips=chips, sigStart=SIG[0], sigDelay=sig_delay, click=click)

captions = [
    (0.0, 1.2, "Mudou pra Maringá", [0.05, 0.3, 0.55]),
    (1.2, 2.4, "e não conhece ninguém?", [1.2, 1.45, 1.65, 1.85]),
    (2.4, 3.9, "Aí vai pro grupo", [2.45, 2.7, 2.9, 3.1]),
    (3.9, 5.4, "de 800 pessoas…", [3.95, 4.2, 4.5]),
    (5.4, 6.6, "…e descobre que ela", [5.45, 5.7, 6.0, 6.2]),
    (6.6, 7.8, "fuma depois da mudança.", [6.65, 6.9, 7.1, 7.25]),
    (7.9, 9.2, "No RachaAi você vê", [7.95, 8.15, 8.4, 8.6]),
    (9.2, 10.4, "quanto combina", [9.25, 9.55]),
    (10.4, 12.0, "antes de chamar.", [10.45, 10.7, 10.95]),
]

# ---------- sons ----------
rng = random.Random(7)
audio = []
def snd(src, at, vol, dur):
    audio.append((src, round(at, 4), round(vol, 3), dur))

for i, t in enumerate(t1):  # um plim por balão, volume baixo e variado
    snd("plim-a" if i % 3 else "plim-b", t, rng.uniform(0.10, 0.24), 0.5 if i % 3 else 0.4)
for i, t in enumerate(t2):  # na pilha, um plim a cada dois balões, mais baixo
    if i % 2 == 0:
        snd("plim-a" if i % 4 else "plim-b", t, rng.uniform(0.05, 0.14), 0.5 if i % 4 else 0.4)
snd("batida", CARD[0] - 0.05, 0.5, 2.1)            # pico no corte dos 7,8 s
for k, t in enumerate(ticks):
    snd("tique", t - 0.02, 0.32 - k * 0.012, 0.12)
snd("clique", click - 0.010, 0.95, 0.2)             # transiente no frame do encaixe

def caption_html(i, c):
    start, end, text, _ = c
    words = "".join(f'<span class="w">{w}</span>' for w in text.split())
    return (f'      <div id="cap-{i}" class="clip cap" data-start="{start}" data-duration="{round(end - start, 3)}" '
            f'data-track-index="10"><span class="cap-line">{words}</span></div>')

lanes = []
def lane_for(at, dur):
    for k, end in enumerate(lanes):
        if end <= at:
            lanes[k] = at + dur; return 20 + k
    lanes.append(at + dur); return 20 + len(lanes) - 1

def audio_html(i, a):
    src, at, vol, dur = a
    return (f'      <audio id="sfx-{i}" src="assets/sfx/{src}.wav" data-start="{at}" data-duration="{dur}" '
            f'data-track-index="{lane_for(at, dur)}" data-volume="{vol}"></audio>')

def scene(cid, rng_):
    a, b = rng_
    return (f'      <div id="{cid}" data-composition-id="{cid}" data-composition-src="compositions/{cid}.html" '
            f'data-start="{a}" data-duration="{round(b - a, 3)}" data-track-index="1" data-width="1080" data-height="1920"></div>')

word_tweens = []
for i, c in enumerate(captions):
    for j, at in enumerate(c[3]):
        word_tweens.append(f'      tl.set("#cap-{i} .w:nth-child({j + 1})", {{ display: "inline-block" }}, {at});')
        word_tweens.append(f'      tl.fromTo("#cap-{i} .w:nth-child({j + 1})", {{ opacity: 0, y: 14 }}, {{ opacity: 1, y: 0, duration: 0.16, ease: "power3.out" }}, {at});')

FONT_FACE = """        /* Schibsted Grotesk (Google Fonts, OFL 1.1), variável 400 a 800, servida do projeto */
        @font-face { font-family: "Schibsted Grotesk"; font-weight: 400 800; font-display: block; src: url("assets/fonts/schibsted-latin-ext.woff2") format("woff2"); unicode-range: U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF; }
        @font-face { font-family: "Schibsted Grotesk"; font-weight: 400 800; font-display: block; src: url("assets/fonts/schibsted-latin.woff2") format("woff2"); unicode-range: U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD; }
"""

html = f"""<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=1080, height=1920" />
    <title>RachaAi reel-01</title>
    <script src="https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js"></script>
    <script>
      // gerado por build_index.py: tempos compartilhados com as cenas
      window.RACHA_TIMES = {json.dumps(times)};
    </script>
    <style>
{FONT_FACE}      * {{ margin: 0; padding: 0; box-sizing: border-box; }}
      html, body {{ width: 1080px; height: 1920px; overflow: hidden; background: #faf7f2; }}
      #root {{ position: relative; width: 100%; height: 100%; overflow: hidden; font-family: "Schibsted Grotesk", sans-serif; }}
      /* legenda: 64 px, uma cor, até 2 linhas; fora dos 20% de baixo e dos 140 px da direita */
      .cap {{ position: absolute; left: 140px; right: 140px; bottom: 440px; z-index: 50; display: flex; justify-content: center; text-align: center; }}
      /* a caixa cresce com as palavras: cada palavra entra no fluxo só quando aparece */
      .cap-line {{
        display: inline; padding: 8px 28px 14px; border-radius: 22px;
        -webkit-box-decoration-break: clone; box-decoration-break: clone;
        background: #1b2b33; color: #faf7f2; font-size: 64px; font-weight: 800; line-height: 1.42; letter-spacing: -0.02em;
      }}
      .cap .w {{ display: none; }}
      .cap .w + .w {{ margin-left: 0.24em; }}
    </style>
  </head>
  <body>
    <div id="root" data-composition-id="main" data-start="0" data-width="1080" data-height="1920" data-duration="{DUR}">
{scene("chat", CHAT)}
{scene("card", CARD)}
{scene("gratis", GRATIS)}
{scene("assinatura", SIG)}
{chr(10).join(caption_html(i, c) for i, c in enumerate(captions))}
{chr(10).join(audio_html(i, a) for i, a in enumerate(audio))}
    </div>
    <script>
      const tl = gsap.timeline({{ paused: true }});
{chr(10).join(word_tweens)}
      window.__timelines["main"] = tl;
    </script>
  </body>
</html>
"""
(raiz / "index.html").write_text(html, "utf-8")
print("index.html:", len(audio), "sons, clique em", click, "s")
