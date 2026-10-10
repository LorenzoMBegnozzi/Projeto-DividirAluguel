# Mascote final

A concha na posição "casa nas costas" (por cima, com o caranguejo morando na abertura de baixo), o
caranguejo antigo do `caranguejo.glb` (olhos nas hastes, corpo redondo, sorriso, bochechas, perninhas) e as
garras novas.

Versão atual: "brinquedo de vinil" (`brinquedo: true` em `misto_poses.py`): acabamento fosco com textura
leve, olhos maiores, sorriso em linha, garras gordas de pinça quase fechada, perninhas grossas e luz mais suave.

Gerar de novo (dentro desta pasta):

    npm install three@0.170.0
    cp ../../../../frontend/public/landing/caranguejo.glb .
    python misto_poses.py
    python render.py misto_poses.json --pagina=casa.html
    python compor.py .. misto_poses.json

Pose nova: uma linha em `misto_poses.py`.
