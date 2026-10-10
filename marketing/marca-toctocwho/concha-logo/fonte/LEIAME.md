# Logo só com a concha (3D)

A mesma espiral logarítmica da concha do mascote (`frontend/scripts/generate-landing-crab.mjs`), com os
números soltos para criar formatos: caracol, turbante, torre, amonite, búzio e bolinha. A faixa clara
acompanha a espiral e, vista de cima, vira anéis alternados. Cores do `caranguejo.glb`.

    npm install three@0.170.0
    cp ../../../../frontend/public/landing/caranguejo.glb .
    python concha_poses.py
    python render.py concha_poses.json --pagina=concha.html
    python compor.py .. concha_poses.json

Formato novo: uma entrada em `F` (voltas, crescimento, ponta, enrola, boca, achata, faixa) e uma em `P`.
