# Poses 3D do mascote

As poses saem do mesmo modelo da landing (`frontend/public/landing/caranguejo.glb`, gerado por
`frontend/scripts/generate-landing-crab.mjs`). Cada pose parte de um quadro da animação e muda a posição
do caranguejo, das garras, dos olhos, da concha e da câmera (`poses.py`).

Para gerar de novo, rode dentro desta pasta `fonte/`:

    npm install three@0.170.0
    cp ../../../../frontend/public/landing/caranguejo.glb .
    python poses.py                  # escreve poses.json
    python render.py poses.json      # renderiza cada pose (PNG transparente) em out/
    python compor.py ..              # recorta e monta os ícones nos 5 fundos em ../icones e ../transparente

Para criar uma pose nova, acrescente uma entrada em `P` dentro de `poses.py`.

## Eremita caprichado (eremita2.html)

Caranguejo feito do zero (carapaça com barriga clara, garras com pinça, pernas em 3 segmentos, antenas)
saindo da concha deitada, com a ponta para a direita. A concha é a mesma espiral do gerador da landing,
em resolução 4× maior. As poses ficam em `caprichado_poses.py`.

    python caprichado_poses.py
    python render.py caprichado_poses.json --pagina=eremita2.html
    python compor.py .. caprichado_poses.json
