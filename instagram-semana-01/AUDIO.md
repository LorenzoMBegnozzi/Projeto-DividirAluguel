# Instagram, semana 01: origem e licença dos áudios

## reel-01

### Efeitos sonoros (nas duas versões)
Todos vêm da biblioteca que acompanha a skill media-use (`~/.claude/skills/media-use/audio/assets/sfx/`).
Lá eles têm origem no [Pixabay](https://pixabay.com/sound-effects/) e seguem a
[Pixabay Content License](https://pixabay.com/service/license-summary/), que permite uso comercial,
edição e redistribuição dentro de vídeos, sem exigir atribuição.

| Arquivo no projeto | Original | Tratamento (ffmpeg) | Onde toca |
|---|---|---|---|
| `reel-01/assets/sfx/plim-a.wav` | `notification.mp3` | trecho de 0,07 s a 0,57 s, fade-out de 0,25 s | balões do grupo |
| `reel-01/assets/sfx/plim-b.wav` | `ping.mp3` | trecho de 0,31 s a 0,71 s, fade-out de 0,22 s | balões do grupo (alterna com o plim-a) |
| `reel-01/assets/sfx/batida.wav` | `impact-bass-1.mp3` | sem corte | corte dos 7,8 s |
| `reel-01/assets/sfx/tique.wav` | `key-press.mp3` | trecho de 0,12 s com fade | contador de 0% a 92% |
| `reel-01/assets/sfx/clique.wav` | `click.mp3` | trecho de 0,2 s com fade | encaixe da assinatura (16,433 s, frame 986) |

### Trilha (só em reel-01-com-musica.mp4)
`reel-01/assets/music/trilha.wav` é uma trilha original, sintetizada do zero por `reel-01/trilha.py`
(numpy: piano elétrico, baixo, bateria e chiado de vinil). Não usa samples nem gravações de
terceiros, então não há licença de terceiros envolvida e ela pode ser usada livremente pelo RachaAi.
Tem 100 BPM e vai de 0 a 15 s, com fade de 14 a 15 s, antes da assinatura. Foi normalizada a -18 LUFS.

A trilha não veio do catálogo HeyGen da media-use porque o CLI da HeyGen não está instalado
nesta máquina. Para usar o catálogo nos próximos reels: instalar o CLI e rodar `heygen auth login --oauth`.
