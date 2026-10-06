---
workflow: general-video
flow: automation
storyboard: no
message: "No RachaAi você vê quanto combina antes de chamar"
destination: instagram-reels
aspect: 1080x1920
language: pt-BR
audience: "universitário de outra cidade procurando vaga em Maringá"
length: 17.5s
---

## Intent

reel-01, dor e solução, para quem procura vaga. Abre no caos de um grupo de WhatsApp de
800 pessoas, os balões se amontoam e caem quando a pessoa descobre que a colega fuma.
Corte seco para o cartão de anúncio do RachaAi com o selo de compatibilidade contando
até 92% e os hábitos aparecendo. Fecha com "Procurar vaga é grátis. Link na bio." e a
assinatura da landing (casa se encaixando + clique).

## Customizations

- Cortes em 100 BPM (batida = 0,6 s): 2,4 / 5,4 / 7,8 / 12,0 / 15,0 s (o roteiro pedia
  2,5 / 5,5 / 8,0; ajustado à batida mais próxima).
- Legenda queimada palavra por palavra, Schibsted 800, ~64 px, uma cor, até 2 linhas.
- SFX: plim de notificação por balão (volume baixo e variado), batida grave no corte dos
  7,8 s, tique no contador 0 a 92%, clique seco no encaixe da assinatura.
- Duas saídas: reel-01.mp4 (só sfx) e reel-01-com-musica.mp4 (sfx + trilha lo-fi
  100 BPM a -18 LUFS, fade antes da assinatura).
- Capa: frame dos 9 s com o título "Dividir apê é loteria?".

## Notes

- Paleta e fonte: só os tokens do RachaAi e Schibsted Grotesk (ver ../src/base.css).
- Zona segura do reel: nada nos 20% de baixo (y > 1536) nem nos 140 px da direita.
- Assinatura: mesmos keyframes de frontend/src/pages/home.css (half-left/half-right).
