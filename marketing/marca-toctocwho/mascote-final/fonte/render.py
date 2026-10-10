import base64, json, sys, subprocess, pathlib, time
from playwright.sync_api import sync_playwright
S = pathlib.Path(__file__).parent
srv = subprocess.Popen([sys.executable, '-m', 'http.server', '8765', '--bind', '127.0.0.1'], cwd=S, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1)
poses = json.loads((S / sys.argv[1]).read_text('utf-8'))
try:
    with sync_playwright() as p:
        b = p.chromium.launch(args=['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'])
        pg = b.new_page(viewport={'width': 1024, 'height': 1024})
        pg.on('console', lambda m: print('console:', m.text))
        pg.goto('http://127.0.0.1:8765/' + next((a.split('=')[1] for a in sys.argv if a.startswith('--pagina=')), 'cena.html')); pg.wait_for_function('window.ready === true', timeout=60000)
        if '--nomes' in sys.argv: print(pg.evaluate('window.nodeNames'))
        out = S / 'out'; out.mkdir(exist_ok=True)
        for name, pose in poses.items():
            data = pg.evaluate('(p) => window.renderPose(p)', pose)
            (out / f'{name}.png').write_bytes(base64.b64decode(data.split(',')[1])); print('ok', name)
        b.close()
finally:
    srv.terminate()
