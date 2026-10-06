import pathlib, sys
from playwright.sync_api import sync_playwright
aqui = pathlib.Path(__file__).parent
with sync_playwright() as p:
    b = p.chromium.launch(); pg = b.new_page(viewport={'width': 1600, 'height': 900}, device_scale_factor=1)
    pg.goto((aqui / 'amostra.html').as_uri(), wait_until='networkidle'); pg.evaluate('document.fonts.ready'); pg.wait_for_timeout(300)
    pg.screenshot(path=str(aqui / 'amostra.png'), full_page=True)
    b.close()
print('ok')
