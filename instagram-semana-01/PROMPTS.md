# Prompts · Instagram RachaAi · Semana 1

Como usar: abra uma sessão nova do Claude Code nesta pasta do projeto. Cole o
**Prompt 0 (base)** primeiro. Depois cole um prompt de peça por vez, na ordem, e
aprove cada resultado antes de mandar o próximo.

Total: avatar + bio, 4 feeds, 7 stories e 3 reels.

Equilíbrio entre os dois públicos na semana:

| Público | Peças |
|---|---|
| Os dois lados | feed-01, story-01, feed-02, story-03, feed-03, story-05, reel-03, story-07 |
| Quem procura vaga | reel-01, story-02, story-04 |
| Quem anuncia vaga | reel-02, story-06, feed-04 |

---

## Prompt 0 · Base (cole uma vez, no começo da sessão)

```
Vamos produzir as peças do Instagram do RachaAi, uma de cada vez. Nesta mensagem é só
contexto. Leia, me confirme em 5 linhas o que entendeu e espere a primeira peça.

PRODUTO
- Leia README.md e .agents/product-marketing.md.
- Ignore a pasta marketing/: não abra, não reaproveite e não altere nada dela.
- O RachaAi é um marketplace de dois lados em Maringá. Toda peça fala com um dos dois
  públicos abaixo, ou com os dois. O prompt de cada peça diz qual.

  QUEM PROCURA VAGA
  - Quem é: universitário de outra cidade, de 18 a 25 anos, sem conhecer ninguém em
    Maringá e com orçamento apertado.
  - Dor: garimpar grupo de WhatsApp com 800 pessoas e só descobrir depois da mudança
    que a pessoa não combina (fuma, barulho, visita toda hora).
  - O que o RachaAi entrega: um perfil com hábitos e a % de compatibilidade em cada
    anúncio, antes de chamar. Filtro por bairro, mapa e orçamento, e chat direto.
  - Preço: procurar é grátis, sempre.
  - CTA: "crie seu perfil grátis" ou "quero uma vaga".

  QUEM ANUNCIA VAGA
  - Quem é: quem mora num apê ou república e tem um quarto sobrando, ou o proprietário
    de um imóvel inteiro para estudantes.
  - Dor: o post no grupo some em minutos, chegam 50 mensagens de "ainda tem?", não dá
    pra saber quem é a pessoa e o aluguel fica pesado enquanto o quarto está vazio.
  - O que o RachaAi entrega: um anúncio com fotos que aparece pra quem busca no
    bairro, e cada interessado chega com perfil, hábitos e a % de compatibilidade com
    quem já mora lá. Dá pra escolher antes de responder.
  - Preço: até 3 anúncios grátis.
  - CTA: "anuncie grátis" ou "tenho vaga".

- Código de cor dos públicos, o mesmo da landing: brand (#1e5f7a) é quem procura e
  coral (#c04e2b) é quem anuncia. Use nos botões, chips e cartões quando os dois lados
  aparecem juntos.

MARCA
- Logo atual (não crie outra): frontend/src/components/Logo.tsx e public/favicon.svg.
- Cores (só estas):
  paper #faf7f2, surface #ffffff, surface-sunk #f1ece3, line #e3dccf,
  ink #1b2b33, ink-2 #46565e, brand #1e5f7a, brand-strong #174c62,
  brand-tint #dcebf1, coral #c04e2b, coral-bright #e8704a (nunca em texto),
  coral-tint #fbe3d9, leaf #257a58, star #c2860f.
  Fundo escuro: #1b2b33 ou #174c62. Texto sobre ele: #faf7f2. Cor de apoio sobre
  fundo escuro: #f08c6a (coral) ou #5fb3d1 (azul claro).
- Fonte: só Schibsted Grotesk (Google Fonts), pesos 400 a 800, em tudo. Proibido usar
  serifada, itálico ou qualquer outra família.

ESTILO (referências: @nora.app_ e @kontto.off)
- Título curto e grande, em Schibsted 800, numa cor só (ink no claro, paper no
  escuro). Nada de palavra destacada em outra cor ou fonte dentro do título.
- No feed, os posts alternam entre fundo claro (paper, com no máximo um brilho suave
  de brand-tint ou coral-tint num canto) e fundo escuro (#174c62). O grid fica xadrez.
- Quando a arte precisar de uma linha de contexto acima do título, ela é curta, em
  caixa normal, peso 600 e cor ink-2. Nada de kicker em caixa alta com espaçamento
  largo nem traço decorativo antes.
- Rodapé: logo pequena à esquerda e "@rachaai" (ou "arrasta", no carrossel) à
  direita, em ink-3.
- A ousadia fica num lugar só por arte, em geral a prova de UI: celular, cartões de
  anúncio, selos de %. O resto fica quieto.
- Prova de UI: cartões e telas do app desenhados em HTML a partir das telas reais
  (frontend/src/pages). Dados fictícios e plausíveis: nomes inventados, bairros reais
  de Maringá (Zona 7, Zona 1, Jardim Universitário, Vila Esperança) e preços de
  R$ 450 a R$ 900.
- Muito respiro, no máximo 25 palavras por arte e nenhum ícone genérico de banco de
  imagem.

TEXTO
- Tom de universitário para universitário: direto, leve e sem ser infantil.
- Use: dividir aluguel, rachar, apê, vaga, colega de casa, quarto sobrando, combina
  com você, compatibilidade, perto da faculdade, grátis.
- Nunca use: match, curtida, algoritmo, IA, inquilino ou "verificado". Para falar de
  segurança, escreva "cadastro com CPF".
- Para não soar como texto de IA (vale para arte e legenda):
  - nada de "não é X, é Y" nem "não X, mas Y": diga Y direto, com o motivo;
  - nada de lista de negações ("sem X, sem Y, sem Z");
  - nada de pergunta respondida por você mesmo ("O resultado? ...");
  - nada de travessão (—), de "A · B" com ponto no meio nem de "→" no fim de texto;
  - nada de emoji abrindo cada linha nem uma frase por linha na legenda inteira;
  - nada de isca vazia ("Concorda?", "Leia de novo"). Pergunta no fim só se a gente
    quer mesmo ler a resposta.

LEGENDAS (LEGENDAS.md)
- As primeiras ~125 letras aparecem antes do "mais": elas são um gancho próprio e não
  repetem o título da arte.
- Escreva em parágrafos curtos, como uma pessoa falando, com as palavras que alguém
  buscaria: dividir apê, Maringá, colega de casa, vaga perto da UEM, quarto pra alugar.
- No máximo 5 hashtags (limite do Instagram), todas locais ou do nicho.
- Uma CTA só por legenda, a do público da peça. Nas peças dos dois lados, a CTA é
  "link na bio" e o texto cita os dois caminhos.
- Legenda, hashtags e texto alternativo de cada peça vão em
  instagram-semana-01/LEGENDAS.md, com o público da peça anotado no título.

PRODUÇÃO
- Cada peça é um HTML em instagram-semana-01/src/, renderizado com Playwright para
  instagram-semana-01/saida/.
- Tamanhos: feed 1080x1350 PNG; story 1080x1920 PNG.
- Zonas seguras: no story, nada importante nos 250 px de cima nem nos 340 px de baixo.
  No reel, nada nos 20% de baixo nem nos 140 px da direita.
- Nada de enquete, caixa de perguntas ou outro sticker interativo nos stories: o perfil
  ainda é novo e tem pouca gente. O único sticker é o de link. Quando a peça pedir,
  deixe a área dele livre e marque-a só num arquivo extra *-guia.png.
- Ao terminar cada peça, me mostre a imagem (ou a capa e 3 frames do vídeo) e espere
  a aprovação.

REELS: FORMATO DE PROPAGANDA (referência: os reels da @nora.app_)
- Os reels são propagandas feitas só com tipografia, UI e movimento. Não tem
  narrador, não tem legenda de fala e o texto não entra palavra por palavra.
- 1080x1920, MP4 H.264, 60 fps, de 22 a 26 s. Faça com as skills hyperframes
  (composição e render) e media-use (música e efeitos sonoros).
- Estrutura em 5 atos, igual à dos reels da nora:
  1. O jeito antigo (0 a ~5 s): uma linha fixa no topo ("pra achar com quem morar:")
     e, embaixo, uma lista que rola devagar com as gambiarras de hoje. O item do
     centro fica nítido em ink e os de cima e de baixo vão sumindo em ink-3 com
     desfoque. Depois a lista se desfaz em ícones ou balões espalhados pela tela.
     Isso já é o gancho dos 3 primeiros segundos, então começa em movimento.
  2. A virada (~1,5 s): tela vazia, só "(apresentando)…" pequeno no centro, em
     ink-2. Corte na batida da música.
  3. Como funciona (2 ou 3 cenas de 3 a 4 s): uma frase narrativa curta no topo vai
     se construindo de cena em cena ("você conta seus hábitos." / "e vê quanto cada
     vaga combina." / "e chama direto."). Embaixo, a prova: celular inclinado em 3D
     que gira devagar até ficar de frente, mostrando telas reais do app, cartões de
     anúncio, selos de % e chips de hábitos ligados por linhas finas.
  4. O detalhe (~3 s): um close de UI que dá vontade de pausar (o selo contando
     até 92%, os chips iguais se ligando, a conversa sendo respondida).
  5. Assinatura final (ver abaixo), com tagline e CTA.
- Tipografia em cena: a frase do topo vai em Schibsted 700, cerca de 56 px, numa cor
  só, em minúsculas e com ponto final, como na nora. Entra com fade e subida de 16 px
  em 0,5 s. No máximo 8 palavras na tela por vez.
- Ritmo calmo e limpo: fundo paper com um brilho suave de brand-tint ou coral-tint,
  muito respiro, easing suave (ease-in-out), nada de tremida, flash, zoom brusco ou
  whoosh exagerado.
- Áudio: música instrumental calma e bonita (piano, guitarra limpa ou lo-fi suave,
  de 80 a 100 BPM), no estilo da que a nora usa (Linaire, "Flowers (Instrumental)").
  A música entra pelo próprio Instagram, com um áudio em alta escolhido na hora de
  postar. Por isso, cada reel sai em 2 versões:
  1. reel-XX.mp4 (é a que vai pro ar): só efeitos sonoros sutis (tap, pop baixo,
     tique do contador) e o clique da assinatura, sem música;
  2. reel-XX-com-musica.mp4 (reserva): os mesmos efeitos mais uma trilha
     instrumental livre de direitos, baixa (cerca de -18 LUFS), com fade antes do
     clique da assinatura.
  A origem e a licença da trilha e dos efeitos ficam em instagram-semana-01/AUDIO.md.
  Para cada reel, sugira 3 tipos de áudio em alta que combinam (estilo e BPM).
- Os cortes de cena caem nas batidas do BPM indicado em cada peça.

ASSINATURA FINAL (obrigatória no fim de todo reel, 3,5 s)
- Reproduza o mesmo movimento da chamada final da landing, sem inventar outro.
  Fonte: frontend/src/pages/landing/CtaSplit.tsx (paths do SVG) e
  frontend/src/pages/home.css, linhas 405-413 (keyframes half-left e half-right).
- Fundo paper. A casa do logo fica no centro, com cerca de 300 px de altura. As duas
  metades começam afastadas e inclinadas (translateX ±30%, rotate ±14°, opacity 0),
  passam por ±12% / ±8° aos 45% e se encaixam em 1,6 s, com ease-out e
  transform-origin no canto de baixo de cada metade, exatamente como no CSS.
- No frame exato em que as metades se encostam, toca um som de clique curto e seco
  (encaixe de peça, nada de sino ou whoosh), sincronizado ao frame.
- Depois do clique, entram em sequência (fade + subida de 12 px, 0,4 s cada):
  "RachaAi" embaixo da casa, a tagline em ink-2 e a pílula escura de CTA indicada na
  peça. O frame segura até o fim.
```

---

## Perfil · Avatar, bio e destaques

```
Peça: avatar e bio do perfil. Público: os dois lados.

1. Avatar 1080x1080 PNG: a casa da LogoMark centralizada, ocupando cerca de 55% do
   lado, sobre fundo paper (#faf7f2). Precisa ficar legível no recorte circular a
   110 px. Gere também uma versão com fundo brand (#1e5f7a) e a casa em paper/coral,
   para eu comparar.
2. Bio com no máximo 150 caracteres, em 3 linhas: o que é, uma linha que fala com os
   dois lados ("procurando vaga ou com quarto sobrando em Maringá") e a chamada para
   o link. Mande 3 opções.
3. Capas de destaque 1080x1920, com ícone simples em linha sobre paper:
   "Quero vaga" (ícone brand), "Tenho vaga" (ícone coral) e "Segurança" (ícone ink).
```

---

## D1 · Segunda

### Feed 1 · Apresentação (fundo claro) · os dois lados

```
Peça: feed-01, apresentação da marca. Público: os dois lados. Fundo claro.

Composição (inspirada no primeiro post da @nora.app_):
- Fundo paper com brilho suave de brand-tint vindo de baixo.
- No centro alto, um ícone de app arredondado (cantos de 22%, sombra leve) com a
  LogoMark dentro.
- Abaixo, "RachaAi" grande em Schibsted 800, cor ink.
- Linha seguinte, em ink-2: "Pra quem procura vaga e pra quem tem quarto sobrando em
  Maringá."
- Dois botões lado a lado, iguais aos da landing: "Quero uma vaga" (brand, texto
  branco) e "Tenho vaga" (coral, texto branco).
- Rodapé: "Maringá, PR" à esquerda e "@rachaai" à direita.

Legenda: apresente o RachaAi falando com os dois lados (quem procura vê quanto combina
com cada vaga; quem anuncia vê quanto cada interessado combina com a casa) e termine
com "link na bio". Até 5 hashtags locais.
```

### Story 1 · Chegamos · os dois lados

```
Peça: story-01, "chegamos". Público: os dois lados. 1080x1920 PNG, fundo escuro
#174c62.

- Linha de contexto: "Novo em Maringá".
- Título: "Chegou o jeito de dividir apê sem grupo de WhatsApp."
- Abaixo, dois cartões claros empilhados, um pra cada lado:
  - borda brand: "Procurando vaga?" e uma mini lista de anúncios com selos de 92%,
    81% e 67%;
  - borda coral: "Tem quarto sobrando?" e uma mini lista de interessados com selos de
    94%, 85% e 71%.
- Área do sticker de link no terço de baixo, dentro da zona segura (guia separado).
```

### Reel 1 · Propaganda: achar com quem morar · quem procura

```
Peça: reel-01, propaganda. Público: quem procura vaga. 1080x1920, 24 s, 60 fps, mais
uma capa PNG. Siga o FORMATO DE PROPAGANDA do Prompt 0.

0,0–3,0 s  Linha fixa no topo: "pra achar com quem morar em maringá:". Embaixo, a lista
           rolando: "grupo de whatsapp", "grupo do facebook", "amigo de um amigo",
           "story pedindo indicação", "mural da faculdade", "torcer pra dar certo".
3,0–5,0 s  A lista se desfaz em balões de chat e ícones de notificação espalhados,
           com um contador discreto "+847 mensagens" num canto.
5,0–6,5 s  Tela vazia: "(apresentando)…"
6,5–10,0 s Topo: "você conta seus hábitos." Embaixo, um cartão de perfil em que os
           chips "não fuma", "tem gato" e "dorme cedo" são marcados em brand.
10,0–14,0 s Topo: "e vê quanto cada vaga combina." Celular inclinado girando até ficar
           de frente, com a lista de anúncios da Zona 7 e os selos 92%, 81% e 67%.
14,0–17,0 s Detalhe: o cartão da vaga de 92% em close. Linhas finas ligam os hábitos
           iguais seus e da Júlia, e o selo conta de 0 a 92%.
17,0–20,5 s Topo: "e chama direto." Um balão é enviado ("oi! vi que a gente combina
           92%, a vaga ainda tá aberta?") e a resposta chega ("tá sim! quer ver
           amanhã?").
20,5–24,0 s Assinatura final. Tagline: "você mostra seus hábitos, a gente mostra quem
           combina." Pílula: "grátis pra quem procura".

Ritmo: 90 BPM. Efeitos: pop baixo quando cada chip é marcado, tique suave no contador
e som de mensagem enviada e recebida.
Capa: o frame dos 15 s (o close do 92%) com o título "achar com quem morar, do jeito
certo." no topo.
```

---

## D2 · Terça

### Story 2 · Os hábitos que importam · quem procura

```
Peça: story-02, hábitos. Público: quem procura vaga. 1080x1920 PNG, fundo paper.

- Linha de contexto: "Antes de morar junto".
- Título: "Fuma? Tem pet? Dorme cedo?"
- Uma nuvem de 7 chips de hábito (surface com borda line), levemente desalinhados,
  como se tivessem sido jogados na tela: "não fuma", "tem gato", "dorme cedo",
  "estuda em casa", "visita no fim de semana", "vegetariana", "música baixa".
  Três deles ficam destacados em brand com texto branco.
- Embaixo, em ink-2: "No RachaAi isso aparece antes da primeira mensagem."
```

---

## D3 · Quarta

### Feed 2 · Compatibilidade, carrossel de 5 (fundo escuro) · os dois lados

```
Peça: feed-02, carrossel "como a compatibilidade funciona". Público: os dois lados.
5 lâminas de 1080x1350, fundo #174c62, no estilo dos posts escuros da @kontto.off.

Lâmina 1 (capa, precisa parar o scroll sozinha no feed): título "Os 6 hábitos que a
          gente compara antes de alguém chamar." Um selo "92%" grande ao lado.
          Rodapé com "arrasta".
Lâmina 2: um cartão claro (surface) com 6 hábitos lado a lado, comparando "você" e
          "Júlia": fuma, bebe, pet, rotina, barulho, visitas. Os itens iguais ganham
          um check leaf e os diferentes um traço coral.
Lâmina 3: um número enorme, "92%", em paper, com o texto "de compatibilidade com a
          Júlia, calculada pelos hábitos que vocês marcaram."
Lâmina 4: os dois lados da mesma conta, em duas metades:
          - em cima, com detalhe brand: "Procurando vaga? Cada anúncio mostra quanto
            combina com você.";
          - embaixo, com detalhe coral: "Tem vaga? Cada interessado chega mostrando
            quanto combina com a casa."
Lâmina 5: "A decisão continua sua. A gente só tira a loteria." Dois botões claros:
          "quero uma vaga" e "tenho vaga". Rodapé com "link na bio".

Fundo, linha de contexto e rodapé iguais nas 5 lâminas, e cada lâmina se entende
sozinha.
Legenda: o gancho é a pergunta "qual hábito de colega de casa você não aguenta?".
Depois explique a conta em linguagem simples, diga que ela vale pros dois lados e
termine pedindo pra salvar o post.
```

### Story 3 · Clássicos da convivência · os dois lados

```
Peça: story-03, identificação. Público: os dois lados (quem divide apê, procurando ou
anunciando). 1080x1920 PNG, fundo coral-tint (#fbe3d9).

- Linha de contexto: "Quem nunca".
- Título: "Os clássicos de dividir apê com quem não combina:"
- Lista de 3 itens em cartões surface com borda line, cada um com um pequeno desenho
  em linha brand (prato, alto-falante, porta) no lugar de emoji: "a louça que mora na
  pia", "a música às 2h da manhã" e "a visita que virou morador".
- Fechamento: "Dá pra ver isso antes. Tanto pra quem procura quanto pra quem escolhe
  quem entra." Área do sticker de link com guia separado.
```

---

## D4 · Quinta

### Reel 2 · Propaganda: alugar o quarto que sobrou · quem anuncia

```
Peça: reel-02, propaganda. Público: quem anuncia vaga. 1080x1920, 24 s, 60 fps, mais
uma capa PNG. Siga o FORMATO DE PROPAGANDA do Prompt 0, com o brilho de fundo em
coral-tint (a cor de quem anuncia).

0,0–3,0 s  Linha fixa no topo: "pra alugar o quarto que sobrou:". Embaixo, a lista
           rolando: "post no grupo", "repost no grupo", "story pedindo compartilhar",
           "plaquinha na janela", "50 mensagens de 'ainda tem?'", "pagar o aluguel
           sozinho".
3,0–5,0 s  A lista vira uma pilha de balões "ainda tem?" sem foto nem nome, se
           espalhando pela tela.
5,0–6,5 s  Tela vazia: "(apresentando)…"
6,5–10,0 s Topo: "você anuncia o quarto." Embaixo, o anúncio sendo montado: 3 fotos
           de quarto entram, depois "Zona 7" e "R$ 650", e um pin cai no mapa.
10,0–14,0 s Topo: "cada interessado chega com perfil." Celular inclinado girando até
           ficar de frente, com 3 interessados com foto, curso e hábitos.
14,0–17,0 s Topo: "e você vê quem combina com a casa." Detalhe: os 3 cartões se
           reordenam por compatibilidade (94%, 85%, 71%) e linhas finas ligam os
           hábitos da casa aos do primeiro.
17,0–20,5 s Topo: "os 3 primeiros anúncios são grátis." Um cartão de anúncio publicado
           com o selo "no ar".
20,5–24,0 s Assinatura final. Tagline: "o quarto vago, com quem combina com a casa."
           Pílula: "anuncie grátis".

Ritmo: 90 BPM. Efeitos: obturador suave em cada foto que entra, pop baixo no pin e em
cada interessado, tique leve quando os cartões se reordenam.
Capa: o frame dos 15 s com o título "quarto sobrando em maringá?" no topo.
```

### Story 4 · Bastidor do app · quem procura

```
Peça: story-04, tela do app. Público: quem procura vaga. 1080x1920 PNG, fundo paper.

- Linha de contexto: "Por dentro do app".
- Mockup grande de celular, levemente inclinado (-4°), mostrando a busca com o mapa de
  Maringá e os pins dos anúncios.
- Texto: "Filtra por bairro, mapa e orçamento. Perto da sua faculdade."
- Seta discreta apontando para a área do sticker de link, com guia separado.
```

---

## D5 · Sexta

### Feed 3 · Quanto custa, carrossel de 2 (fundo claro, número grande) · os dois lados

```
Peça: feed-03, número grande. Público: os dois lados. 2 lâminas de 1080x1350, fundo
paper, no estilo do post "R$ 1.000" da @kontto.off.

Lâmina 1 (quem procura): em cima, pequeno: "Pra quem procura vaga, o RachaAi custa".
          No centro, enorme, em Schibsted 800 cor brand: "R$ 0". Embaixo: "Hoje,
          amanhã e sempre." Rodapé com "arrasta".
Lâmina 2 (quem anuncia): em cima, pequeno: "Pra quem tem vaga, os primeiros".
          No centro, enorme, em Schibsted 800 cor coral: "3 anúncios". Embaixo: "são
          grátis." Linha de apoio em ink-2: "Do 4º em diante, ou pra aparecer no topo
          da busca, aí tem um valor pequeno."

As duas lâminas usam a mesma grade, para o número cair no mesmo lugar ao arrastar.
```

### Story 5 · Segurança · os dois lados

```
Peça: story-05, segurança. Público: os dois lados. 1080x1920 PNG, fundo escuro
#1b2b33.

- Linha de contexto: "Segurança".
- Título: "Falar com desconhecido com mais tranquilidade."
- Lista vertical de 4 itens com ícone em linha #5fb3d1: "cadastro com CPF",
  "avaliações de quem já morou junto", "bloqueio e denúncia" e "vagas só para
  mulheres".
- Linha final em ink-3 claro: "Vale pra quem procura e pra quem abre a porta de casa."
- Não use a palavra "verificado".
```

---

## D6 · Sábado

### Reel 3 · Propaganda: os dois lados da casa · os dois lados

```
Peça: reel-03, propaganda. Público: os dois lados. 1080x1920, 25 s, 60 fps, mais uma
capa PNG. Siga o FORMATO DE PROPAGANDA do Prompt 0.

Ideia: as duas metades do logo são os dois públicos. A metade brand é quem procura e
a metade coral é quem anuncia. O reel termina com elas se encaixando.

0,0–3,5 s  Tela dividida na vertical por uma linha fina. À esquerda, com detalhe
           brand, a linha "procurando vaga:" e uma lista rolando ("grupo de
           whatsapp", "amigo de um amigo", "mural da faculdade"). À direita, com
           detalhe coral, "com quarto sobrando:" e outra lista ("post no grupo",
           "plaquinha na janela", "50 'ainda tem?'").
3,5–5,5 s  As duas listas se desfazem em balões que se misturam no meio da tela.
           Topo: "os dois no mesmo grupo de 800 pessoas."
5,5–7,0 s  Tela vazia: "(apresentando)…"
7,0–11,0 s A tela se divide de novo. Esquerda: o perfil da Júlia com hábitos marcados
           em brand. Direita: o anúncio do Pedro (Zona 7, R$ 650) com os hábitos da
           casa em coral. Topo: "ela conta os hábitos dela. ele, os da casa."
11,0–15,0 s Os chips dos dois lados deslizam para o centro e os iguais se ligam por
           linhas finas. Um selo de 92% surge no meio. Topo: "o rachaai mostra
           quanto eles combinam."
15,0–18,5 s Um chat no centro: Júlia pergunta "a vaga ainda tá aberta?" e Pedro
           responde "tá sim! quer ver amanhã?". Topo: "e os dois se acham."
18,5–21,5 s Transição para a assinatura: o bloco brand da esquerda e o bloco coral da
           direita encolhem e viram as duas metades da casa, já afastadas e
           inclinadas na posição inicial da animação da landing.
21,5–25,0 s Assinatura final, começando dessas metades. Tagline: "quem procura e quem
           anuncia, no mesmo lugar." Em vez de uma pílula, dois botões lado a lado:
           "quero uma vaga" (brand) e "tenho vaga" (coral).

Ritmo: 85 BPM. Efeitos: pop baixo em cada chip que se liga, tique no selo de 92%, som
de mensagem enviada e recebida, e o clique da assinatura.
Capa: o frame dos 13 s com o título "os dois lados da mesma casa." no topo.
```

### Story 6 · Como anunciar em 3 passos · quem anuncia

```
Peça: story-06, passo a passo do anúncio. Público: quem anuncia vaga. 1080x1920 PNG,
fundo coral-tint (#fbe3d9).

- Linha de contexto: "Tem quarto sobrando?"
- Título: "Seu anúncio no ar em 3 passos."
- Três mini telas do app em sequência vertical, cada uma com o número do passo em
  coral:
  1. "Fotos, bairro e valor": o formulário de anúncio com 3 fotos de quarto.
  2. "Os hábitos da casa": chips como "não fuma", "tem gato" e "silêncio depois das
     23h".
  3. "Veja quem combina": lista de interessados com selos de 94%, 85% e 71%.
- Fechamento: "Os 3 primeiros anúncios são grátis." Área do sticker de link com guia
  separado.
```

---

## D7 · Domingo

### Feed 4 · Para quem tem quarto sobrando (fundo escuro) · quem anuncia

```
Peça: feed-04, lado de quem anuncia. Público: quem anuncia vaga. 1080x1350 PNG, fundo
#174c62.

- Linha de contexto: "Tem vaga?"
- Título: "Quarto sobrando? Anuncia grátis."
- No centro, um cartão de anúncio claro com foto ilustrada de quarto, "Vaga na Zona 7,
  R$ 650", 3 interessados com selos de compatibilidade (94%, 85%, 71%) e o texto
  "veja quem combina antes de responder".
- Linha de apoio: "Até 3 anúncios grátis. Cada interessado chega com perfil e
  hábitos."
- Rodapé padrão.

Legenda: fale com quem mora numa república e com o proprietário, e termine com "marca
aquele amigo que tá com quarto vazio".
```

### Story 7 · Fechamento da semana · os dois lados

```
Peça: story-07, resumo e CTA. Público: os dois lados. 1080x1920 PNG, fundo paper com
brilho de brand-tint.

- Linha de contexto: "Resumindo".
- Título: "Dividir apê em Maringá, do jeito certo."
- Dois blocos lado a lado (ou empilhados), iguais aos botões da landing:
  - brand: "Quero uma vaga" e embaixo "veja quanto combina, grátis";
  - coral: "Tenho vaga" e embaixo "3 anúncios grátis".
- Logo centralizada embaixo e área para o sticker de link (guia separado).
```

---

## Checagem final (cole depois da última peça)

```
Confira a semana inteira:
1. Monte instagram-semana-01/saida/grid.png com a simulação dos 4 feeds na ordem do
   perfil (o mais novo em cima à esquerda). O xadrez claro e escuro precisa aparecer.
2. Monte uma tabela com cada peça e o público dela (procura, anuncia ou os dois).
   Confira se bate com o plano e se a CTA de cada peça é a do público certo.
3. Liste as cores usadas em cada arte e aponte qualquer cor fora da paleta,
   coral-bright em texto ou título com palavra em outra cor.
4. Procure nas artes e no LEGENDAS.md as palavras proibidas (match, curtida,
   algoritmo, IA, inquilino, verificado), travessão, " · ", "→" e kicker em caixa alta.
5. Confirme tamanhos, duração dos reels e se as zonas seguras foram respeitadas. Nos
   reels, confira também que não há legenda de fala nem texto entrando palavra por
   palavra, e que todos seguem os 5 atos do formato de propaganda.
6. Com ffprobe, confirme que as 2 versões de cada reel têm 60 fps e faixa de áudio, e
   que a versão principal não tem música. Confira também que o clique da assinatura
   cai no mesmo frame em que as metades se encostam (mostre esse frame de cada reel).
7. Confira se o AUDIO.md tem a origem e a licença de cada trilha e de cada efeito, e
   as 3 sugestões de áudio em alta de cada reel.
Me mostre o grid e a lista de problemas encontrados.
```
