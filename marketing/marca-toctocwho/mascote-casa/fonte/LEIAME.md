# Mascote "casa nas costas"

A concha fica por cima, como uma casa, e o caranguejo mora na abertura de baixo: o rosto aparece
emoldurado pela borda e só as garras e as perninhas saem para fora. Formas grossas e simples, olhos
grandes pretos e brilhantes. A concha é a mesma espiral do `frontend/scripts/generate-landing-crab.mjs`
(em resolução maior, com a parede de dentro escura); as cores vêm do `caranguejo.glb`.

Gerar de novo (dentro desta pasta):

    npm install three@0.170.0
    cp ../../../../frontend/public/landing/caranguejo.glb .
    python casa_poses.py
    python render.py casa_poses.json --pagina=casa.html
    python compor.py .. casa_poses.json

Pose nova: uma linha em `casa_poses.py`. Os parâmetros estão comentados no topo de `casa.html`.
