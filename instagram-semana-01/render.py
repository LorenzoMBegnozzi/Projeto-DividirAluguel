"""Renderiza cada HTML de src/ (ou os passados como argumento) para PNG em saida/.
O tamanho vem de <meta name="size" content="LxA">.
Se a página tiver <meta name="guia" content="nome">, também gera saida/nome.png
com as marcações de guia (a página recebe #guia na URL)."""
import re, sys, pathlib
from playwright.sync_api import sync_playwright

raiz = pathlib.Path(__file__).parent
arquivos = [raiz / 'src' / f for f in sys.argv[1:]] or sorted((raiz / 'src').glob('*.html'))


def foto(pag, url, saida):
    pag.goto(url, wait_until='networkidle')
    pag.evaluate('document.fonts.ready')
    pag.screenshot(path=str(saida))
    print('ok', saida.name)


with sync_playwright() as p:
    nav = p.chromium.launch()
    for html in arquivos:
        fonte = html.read_text('utf-8')
        if 'name="video"' in fonte:
            print('pulado (vídeo, use record_reel.py)', html.name); continue
        w, h = map(int, re.search(r'name="size" content="(\d+)x(\d+)"', fonte).groups())
        pag = nav.new_page(viewport={'width': w, 'height': h})
        foto(pag, html.as_uri(), raiz / 'saida' / (html.stem + '.png'))
        guia = re.search(r'name="guia" content="([\w-]+)"', fonte)
        if guia:
            pag.close()
            pag = nav.new_page(viewport={'width': w, 'height': h})
            foto(pag, html.as_uri() + '#guia', raiz / 'saida' / (guia.group(1) + '.png'))
        pag.close()
    nav.close()
