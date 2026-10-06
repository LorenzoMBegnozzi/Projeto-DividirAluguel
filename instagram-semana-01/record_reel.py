"""Grava um reel quadro a quadro: python record_reel.py reel-01 [--acento serif]
Chama window.render(i / 30) na página, tira um PNG por quadro e monta o MP4 (H.264, 30 fps, sem áudio).
Também gera a capa (?capa) e 3 frames de conferência em saida/."""
import pathlib, shutil, subprocess, sys, tempfile
from playwright.sync_api import sync_playwright

FPS = 30
raiz = pathlib.Path(__file__).parent
nome = sys.argv[1]
extra = '&acento=serif' if '--acento' in sys.argv else ''
html = raiz / 'src' / f'{nome}.html'
fonte = html.read_text('utf-8')
dur = float(fonte.split('name="video" content="')[1].split('"')[0])
saida = raiz / 'saida'
quadros = pathlib.Path(tempfile.mkdtemp(prefix=f'{nome}-'))

with sync_playwright() as p:
    nav = p.chromium.launch()
    pag = nav.new_page(viewport={'width': 1080, 'height': 1920})

    def abrir(query):
        pag.goto(html.as_uri() + '?' + query, wait_until='networkidle')
        pag.wait_for_function('window.pronto === true')

    abrir('x=1' + extra)
    total = round(dur * FPS)
    for i in range(total):
        pag.evaluate(f'window.render({i / FPS})')
        pag.screenshot(path=str(quadros / f'{i:04d}.png'))
    for seg in (4.0, 6.4, 10.5):
        shutil.copy(quadros / f'{round(seg * FPS):04d}.png', saida / f'{nome}-frame-{seg:04.1f}s.png')
    abrir('capa' + extra)
    pag.screenshot(path=str(saida / f'{nome}-capa.png'))
    nav.close()

mp4 = saida / f'{nome}.mp4'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', str(quadros / '%04d.png'),
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'slow', '-r', str(FPS),
                '-an', '-movflags', '+faststart', str(mp4)], check=True)
shutil.rmtree(quadros)
print('ok', mp4.name, f'({total} quadros)')
