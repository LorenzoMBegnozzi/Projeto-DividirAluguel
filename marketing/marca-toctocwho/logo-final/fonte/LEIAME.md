# Logo Toc Toc Who? (concha estrela)

Duas versões da mesma concha (a do caranguejo da landing, `frontend/scripts/generate-landing-crab.mjs`):

- **3D** (`../3d/`): ícone do app, avatar e redes.
- **Minimalista** (`../*.svg`): site, favicon, documentos. A silhueta sai da mesma conta do 3D.

Gerar o vetor:

    python gerar_svg.py

Gerar o 3D (precisa de `npm install three@0.170.0` e do `caranguejo.glb` da landing nesta pasta, para as cores):

    python render_3d.py logo_3d.json --pagina=concha-3d.html   # sai em out/logo-3d.png
