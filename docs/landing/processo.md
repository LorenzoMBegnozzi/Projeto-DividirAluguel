# Celular 3D da landing: processo

Registro de como o "Como funciona" virou um celular 3D que viaja pela página guiado pela
rolagem. Inclui o que deu errado no caminho. Capturas em [capturas/](capturas/).

## 1. O pedido

O celular antigo ficava quase parado, de frente, só trocava de tela. O pedido foi:

- viajar pela página, mudando de posição a cada ato (no 390 px: subir, descer e mudar de tamanho);
- girar de verdade: pelo menos uma volta inteira em Y e rotação nos três eixos;
- profundidade: aproximar e afastar da câmera, perspectiva forte, sombra no chão que acompanha;
- parecer um objeto: espessura com cantos arredondados, botões laterais, reflexo no vidro e luz de contorno, sem copiar o iPhone e sem logo;
- cartões saindo da tela em 3D, um por vez, orbitando, e voltando para dentro no ato seguinte;
- vibrar de leve quando a notificação chega;
- transições ligadas à rolagem, sem saltos, e flutuar leve quando a rolagem para;
- manter conteúdo, 60 fps, JS inicial pequeno e as versões leve e estática.

## 2. Coreografia, ato por ato

`p` é o progresso da rolagem: 0 = o topo do "Como funciona" encostando no pé da tela (antes disso, no topo da página, o celular não aparece), 1 = ato 1 no meio da tela, e assim por diante.
x e y estão em % da tela, a partir do centro; z em px (positivo = mais perto da câmera).

| p | Ato | 1440: posição / profundidade / escala | Rotação (X, Y, Z) | Tela e efeitos | 390 |
|---|---|---|---|---|---|
| 0 | Entrada (a seção chegando) | abaixo da tela, à direita (x +16, y +62), longe (z −260), 0,55 | 34°, −40°, −16°: deitado para trás | aparece com fade enquanto sobe; tela inicial (busca, bairros, destaque) | escondido embaixo (y +62), sobe |
| 0→1 | — | vai ao centro e se aproxima | **Y −34° → 326° (volta inteira)** | tela troca para "Seu jeito de morar" | idem |
| 1 | Conte como você vive | centro, no vão entre o título e o texto do passo, com o maior tamanho que couber (até 0,7), z +60. **Em janela baixa (< 760 px de altura):** texto à esquerda, celular à direita | 6°, 326°, 0° | hábitos são marcados um a um, conforme rola | centro, no vão entre os textos |
| 2 | Veja quem combina | x −22 (texto à direita), z +20, 0,92 | 10°, 384°, 5° | os 3 cartões saem da tela um por vez, em profundidade, e **orbitam** o celular (órbita ligada à rolagem) | sobe (y −14), 0,58, texto embaixo |
| 2→3 | — | cruza para a direita | balança de volta em Y, inclina para trás, rola em Z | cartões **voltam para dentro**, um por vez; a tela vira chat | — |
| 3 | Chame direto | x +22 (texto à esquerda), z +80, 0,95 | −8°, 334°, −6° | chega a notificação e o celular **vibra** (~0,5 s); as mensagens aparecem em sequência | desce (y +16), 0,6, texto em cima |
| 4 | Saída | x 0, y +18, z −320, 0,7 | 64°, 360°, −18°: deita como se fosse posto na mesa | some suave antes do "Experimente" | igual, menor |

Sempre ligado:

- **Amortecimento:** o `p` mostrado persegue o `p` da rolagem com decaimento exponencial (fator 7/s), então a roda do mouse em degraus vira movimento contínuo.
- **Entrada sem tela vazia:** a legenda do ato 1 sobe junto com a página logo depois do topo, e o celular vem preso logo abaixo dela, girando. A subida acompanha a rolagem real, sem amortecer, para não encostar na legenda ao rolar rápido.
- **Revezamento texto/celular:** as legendas não rolam. Elas ficam presas na tela (sticky) e o motor troca uma pela outra com fade. Perto de cada ato o celular fica parado na pose e a legenda aparece. No terço central do caminho entre dois atos a legenda some e o celular viaja, com *smootherstep*. Cada ato ocupa 75% de uma tela de rolagem.
- **Pose ajustada à legenda:** o CSS diz onde a legenda está (`--cap: top | bottom | left | right`) e o motor encaixa o celular no espaço que sobra, no maior tamanho que couber (`fitAct`), em qualquer tamanho de tela.
- **Flutuar:** quando a rolagem para, entra um balanço leve em y, X, Y e Z, que some suave quando volta a rolar.
- **Sombra no chão:** segue a projeção do celular (mesma perspectiva de 900 px). Cresce e clareia quando ele se afasta e fica mais redonda quando ele deita.
- **Reflexo no vidro:** a faixa de luz desliza conforme o ângulo Y.
- **Pulos (link do menu ou rolagem rápida demais):** o celular e as legendas somem na hora e o progresso vai direto para o destino. Ao parar, reaparecem já na pose certa, em vez de passar correndo por todos os atos. O clique num link `#...` esconde antes mesmo de a rolagem começar; o evento `scrollend` libera. A rolagem rápida é detectada pela velocidade média de ~150 ms (acima de 6 atos/s).
- **Troca procurar/anunciar:** o conteúdo das telas troca. Se o celular estiver visível, ele dá uma volta extra de 1,1 s. No topo, onde fica o seletor, ele ainda não aparece, então só a casa gira.

## 3. Como foi feito

| Arquivo | Papel |
|---|---|
| `frontend/src/pages/landing/phone/Phone3D.tsx` | o objeto: frente com tela, verso com câmeras, 4 laterais retas, *fatias* arredondadas na espessura, botões, reflexo e cartões |
| `frontend/src/pages/landing/phone/phone.css` | medidas (270 × 540, cantos de 44, 14 px de espessura), cores, tema escuro, layout dos atos, versão estática |
| `frontend/src/pages/landing/phone/engine.ts` | a coreografia: âncoras dos atos, progresso, poses, telas, cartões, notificação, vibração, sombra. **Carregado depois** |
| `frontend/src/pages/landing/phone/PhoneStory.tsx` | a seção: escolhe a versão, monta os atos e carrega o motor quando o navegador está ocioso |

Decisões:

- **CSS 3D em vez de WebGL.** As telas são HTML de verdade (texto nítido, tema claro/escuro, conteúdo do React), e o navegador compõe tudo na GPU. Um segundo canvas WebGL competiria com a casa 3D do topo.
- **Volume dos cantos.** Cantos arredondados com espessura não existem em CSS. A solução são 9 retângulos arredondados empilhados ao longo de Z (as fatias), mais 4 laterais retas giradas 90°. As fatias do meio são mais claras e formam a faixa de luz de contorno. A borda da frente tem um degradê aplicado só na moldura (máscara).
- **Por quadro, só `transform` e `opacity`.** Nada de React no loop: o motor escreve direto nos elementos marcados com `data-*` e só escreve quando o valor muda.
- **O loop desliga sozinho** quando o celular sai de cena e para, e religa no próximo evento de rolagem.

## 4. As três versões

| Versão | Quando | O que muda |
|---|---|---|
| completa | padrão | 9 fatias, órbita dos cartões, reflexo |
| leve | `saveData`, ≤ 4 GB de memória ou ≤ 4 núcleos | 3 fatias, cartões saem para posições fixas (sem órbita), sem reflexo |
| estática | `prefers-reduced-motion` | nada viaja: um celular parado ao lado de cada passo, com a tela daquele passo |

Para forçar uma versão: `?celular=completo`, `?celular=leve` ou `?celular=estatico`.

## 5. Medições

- **Motor da coreografia:** chunk separado, `engine-*.js` = **4,4 kB (2,1 kB gzip)**, carregado com `requestIdleCallback` depois do primeiro desenho. O palco começa invisível e só aparece quando o motor já posicionou o celular.
- **Quadros**, rolando com a roda do mouse do topo até a saída (Chrome headless, script com Playwright):

  | Tela | Média | fps | quadros > 20 ms | quadros > 34 ms |
  |---|---|---|---|---|
  | 1440 × 900 | 18,4 ms | 54,5 | 15 | 8 |
  | 390 × 844 | 17,4 ms | 57,5 | 10 | 3 |

  (Última medição, depois da mudança de entrada. Na rodada anterior, o 1440 deu 57,8 fps. A variação é do headless, não do código, porque o trabalho por quadro é o mesmo.)

  O headless renderiza em software e a casa 3D (WebGL) roda ao mesmo tempo, então o número real num aparelho com GPU tende a ser melhor. **Ainda falta medir num celular de verdade** (ver seção 7).
- **Vibração:** confirmada por amostragem do `translateX` durante a chegada da notificação (8 trocas de direção em ~0,5 s).
- **Volta extra na troca de modo:** medida quando o celular ainda aparecia no topo: rotateY −37° → −14° → 56° → 207° → 292° → …, sem salto. Hoje o celular só aparece na seção, então essa volta só se vê quando o modo é trocado com ele visível.
- **Ato 1 sem sobrepor o texto:** a caixa do celular foi conferida contra as caixas dos dois textos em 1104 × 575, 1280 × 720, 1440 × 900 e 390 × 844, sem sobreposição em nenhuma.

## 6. Capturas

Em [capturas/](capturas/), nomeadas `<largura>-<versão>-p<progresso>.png`:

- `1440-completo-p0` … `p3_6` e `390-completo-p0` … `p3_6`: o percurso completo (topo, meio da volta, atos 1, 2 e 3, cartões saindo e voltando, notificação, saída);
- `*-leve-*`: a versão leve, nos mesmos pontos;
- `*-completo-anunciar-p0`: o topo no modo "Tenho vaga";
- `1900x910-completo-entrada-0` … `5`: a entrada, do fim do topo até o ato 2, no tamanho do último relato;
- `1890x900-completo-p1_0`, `p2_0` e `p3_0`: atos no tamanho do relato anterior (antes do item 14);
- `1104x575-completo-p1_0`, `p2_0` e `p3_0`: janela baixa (ato 1 lado a lado);
- `1440-estatico-secao` e `390-estatico-secao`: a versão estática inteira;
- `1440-completo-escuro-*`: tema escuro.

Para gerar de novo, com o front rodando em `localhost:5180`, use os scripts com Playwright (`playwright-core` de `marketing/node_modules`). Eles rolam até a âncora de cada ato e fotografam.

## 7. O que deu errado (e como ficou)

1. **O "sticky" do celular antigo nunca funcionou.**
   - Causa: `overflow-x: hidden` no `html` e no `body` (`index.css`) transforma o body num contêiner de rolagem, e aí `position: sticky` deixa de funcionar no site inteiro.
   - Correção: trocado por `overflow-x: clip`, mantendo `hidden` como reserva para navegadores antigos.
2. **`top-[calc(50vh-260px)]` do Tailwind** gerou um `calc` sem espaços, que é inválido. Troquei por CSS normal.
3. **Chips e balões não apareciam.**
   - Causa: a animação `pop-up` só tinha o `from`. Elementos com `opacity: 0` de base animavam de 0 para 0.
   - Correção: `to { opacity: 1 }` explícito.
4. **Cartão girando de lado ao voltar para a tela.**
   - Causa: o ângulo "de frente para a câmera" usava a rotação Y acumulada (384°), não o ângulo de verdade.
   - Correção: `wrap()` para −180…180.
5. **Cartão cortado na borda esquerda** no ato 2. A órbita caiu de 300 para 240 px.
6. **No ato 1 o celular cobria o número e o título do passo.** A escala caiu de 1 para 0,7 e o celular ficou mais longe (z 120 → 60), porque a perspectiva também aumenta o tamanho.
7. **No tema escuro o celular sumia** (grafite escuro sobre fundo escuro). Agora tem corpo mais claro e luz de contorno mais forte no tema escuro.
8. **A volta extra "pulava" de 325° para −35° ao trocar de modo.**
   - Causa: o deslocamento do giro ficava em 360° fixo depois da primeira vez.
   - Não aparecia na tela (360° ≡ 0°), mas sujava o cálculo. Agora ele só soma enquanto o giro acontece.
9. **Título do modo "Tenho vaga" em 4 linhas.** A palavra que troca ocupava uma linha sozinha. O "com" agora faz parte dela (ex.: "com a casa."), e o título ficou em 3 linhas.
10. **Celular "em cima da casa" em janelas menores** (relatado pelo usuário, numa janela de ~1124 × 580).
    - Causa: a pose do topo era uma porcentagem fixa da tela, mas a casa segue o layout da página.
    - Correção: a pose do topo agora é calculada a partir da casa de verdade (`heroPose` no `engine.ts`): o celular fica no canto inferior direito dela, tem tamanho proporcional à altura da casa, desfaz a projeção da perspectiva para cair no ponto certo, nunca sai da janela e sobe junto com a página enquanto ainda está no topo.
    - O palco também começa invisível e só aparece, com fade, depois de o motor posicionar o celular, para ele não piscar no lugar errado durante o carregamento.
    - Conferido em 1124 × 580, 1280 × 720, 1440 × 900 e 1920 × 1080 (`capturas/1124x580-completo-p0.png`).
11. **"É para iniciar a rolagem nessa parte"** (relatado pelo usuário). O celular começava no topo, ao lado da casa, mas o pedido era que ele começasse no "Como funciona".
    - Agora o progresso 0 é o momento em que a seção encosta no pé da tela. O celular entra por baixo, girando e com fade, e o topo volta a ser só da casa.
    - A pose "ao lado da casa" (`heroPose`) foi removida.
12. **Na janela baixa (~1104 × 575), o título do ato 1 caía em cima do celular.** Foi o primeiro remendo; o item 13 resolveu de vez.
    - Causa: pose fixa em % da tela num ato que empilha título, celular e texto.
    - Correção: o motor mede o vão real entre o título e o texto do passo (`fitAct1`) e põe o celular ali, com o maior tamanho que couber.
    - Abaixo de 760 px de altura, o CSS muda o ato 1 para lado a lado (`--act-layout: side`) e o motor segue.
13. **"As escritas tão ficando na frente"** (relatado pelo usuário, em 1890 × 900, com 3 capturas).
    - Causa: o celular ficava fixo enquanto o texto rolava pela mesma área. Na entrada e entre o título e o passo, o texto passava por cima do celular. Mexer em posição não resolve isso: num ato centralizado, o texto que rola sempre cruza o celular.
    - Correção (mudança de mecânica): as legendas foram para uma faixa presa na tela (`.story-pin`, sticky), e a rolagem só alimenta o progresso, sobre marcos vazios de 100vh (`.story-mark`).
    - Legenda e celular se revezam: a legenda só aparece com o celular parado no ato e some antes de ele viajar.
    - A pose de cada ato é calculada a partir da legenda real (`fitAct`).
    - **Bug no caminho:** as legendas sumiram de vez porque o CSS começa com `visibility: hidden` e o motor "limpava" a propriedade (`''`) em vez de pôr `visible`. Corrigido.
    - **Outro ajuste:** a legenda do ato 1 entrava enquanto a faixa ainda subia (ela só trava no topo em p = 1) e encostava no celular. Agora ela só entra entre p 0,95 e 1.
    - **Verificação automática:** varredura de p 0 a 3,6, de 0,05 em 0,05, medindo a caixa da tela do celular contra cada texto visível (h2, h3, p, número). Resultado: **zero sobreposições** em 1890 × 900, 1440 × 900, 1280 × 720, 1104 × 575 e 390 × 844.
    - A versão estática não mudou de comportamento (um celular parado ao lado de cada passo). Agora a captura dela é a seção inteira (`*-estatico-secao.png`).
14. **"Fica muito tempo sem nada"** (relatado pelo usuário, em 1900 × 910).
    - Causa: com o item 13, a legenda do ato 1 só aparecia quando a faixa travava no topo, e quase uma tela inteira passava vazia depois do topo da página. Além disso, cada ato ocupava uma tela de rolagem, com 40% dela sem texto.
    - Correção:
      - a legenda do ato 1 agora entra rolando junto com a página, e o celular vem preso abaixo dela;
      - os marcos caíram de 100vh para 75vh, e a saída de 70vh para 50vh;
      - a viagem entre atos encolheu de 40% para 30% do trecho.
    - **Medida automática:** rolagem do fim do topo até o "Experimente", de 40 em 40 px. Para cada posição, verifica se há algo na tela (topo, legenda ou celular). O maior trecho vazio caiu para **80 px (9% de uma tela)** em 1900 × 910, 1440 × 900 e 390 × 844, e **40 px** em 1104 × 575. Sobreposições na mesma varredura: **0**.
15. **"Se eu mudo de seção usando os botões de cima, o celular meio que aparece na tela rapidão e fica feio"** (relatado pelo usuário).
    - Causa: o link do menu faz uma rolagem suave que atravessa o "Como funciona". O motor seguia a rolagem e o celular passava por todos os atos em meio segundo.
    - Correção: modo "pulo" (`jumpUntil` / `jumpVis` no `engine.ts`), descrito na seção 2.
    - **Erro no caminho:** a primeira versão media a velocidade de um quadro para o outro. No Chrome automatizado, cada "dente" da roda do mouse pula 100 px num quadro só, e isso parecia um pulo: o celular sumia durante a rolagem normal (97 de 97 quadros). A decisão passou a usar a velocidade média de ~150 ms.
    - **Medida automática, por quadro, clicando nos botões do menu:**

      | Clique | Celular durante a viagem (máx) | No fim |
      |---|---|---|
      | Preços, do topo | 0,00 | some (fora da seção) |
      | Experimente, do topo | 0,00 | some |
      | Como funciona, de Preços | 0,00 | aparece (1,00), já na pose |
      | Dúvidas, de dentro da seção | 0,02 | some |
      | Como funciona, do topo | 0,00 | aparece (1,00) |

      Na rolagem normal com a roda (100 px a cada 45 ms), o celular ficou escondido em 1 de 112 quadros (o começo do fade de entrada). A varredura de tela vazia e de sobreposição continuou igual: no máximo 80 px vazios e 0 sobreposições.
    - A legenda do ato 1 continua visível passando durante o pulo, porque ali ela é conteúdo normal da página, rolando como o resto.
16. **Ferramenta:** o painel do navegador do app parava de desenhar quando a janela ficava escondida, e as capturas expiravam. Todas as capturas foram feitas com Chrome headless + Playwright.

**Ainda em aberto:**

- **Celular passando por trás do título** entre o topo e o ato 1: o celular cruza a área do título "Do perfil à mudança" no meio da volta. O texto fica acima dele, mas texto escuro sobre o verso escuro some por um instante. É só na transição; nos atos não há sobreposição.
- **Faltam testes em aparelho real** (Android médio e iPhone): fps, aquecimento e a escolha automática da versão leve.
- **JS principal grande (217 kB gzip).** O app logado vai junto com a landing, e isso já era assim antes. O motor novo não pesa nisso, mas separar o app da landing por rota ajudaria o primeiro carregamento.


## Atos mais cheios em telas largas (pedido: "tem muito pouca informação, parece vazio")

Em 1890 × 900, o celular e o texto ficavam cada um numa ponta da tela, com pouco texto e um vazio grande no meio.

- **Bloco único no centro:**
  - as legendas laterais agora encostam no centro (48 px do meio), em vez de ficarem na borda do contêiner;
  - o celular fica no meio da metade livre, limitado a 600 px do centro (`sideX` em `fitAct`).

  Em telas largas os dois formam uma composição só, e os cartões que orbitam ocupam o espaço entre eles.
- **Mais conteúdo, todo verdadeiro (`steps[].details` em `content.ts`):** cada passo ganhou 3 detalhes com ✓, tirados do que o produto já faz (hábitos do perfil, filtro por bairro/mapa/orçamento, vagas por sexo, chat sem curtida, bloqueio/denúncia, avaliações de convívio, 3 anúncios grátis, destaque). Nada de número inventado.
- **Fundo:** o número do passo em tamanho gigante ("02", "03"), só contorno e clarinho, atrás do texto.
- **Barra de passos** embaixo ("1 Perfil · 2 Compatibilidade · 3 Conversa"; no modo anunciar, "Anúncio · Interessados · Conversa"). O motor marca o passo atual (`data-step` na faixa) e só a mostra depois de o celular assentar no ato 1.
- **Celular maior:**
  - atos 2 e 3 vão até a escala 1 (antes 0,92 e 0,95);
  - o ato 1 em tela de até 1100 px de altura (quase toda janela de desktop) fica lado a lado, com texto à esquerda e celular grande à direita;
  - o layout empilhado (texto em cima, celular embaixo) ficou só para telas bem altas, onde o celular também pode chegar à escala 1.
- **No celular (390), sem mudança:** os detalhes, o número gigante e a barra ficam escondidos, porque ali a tela já é estreita e eles apertariam o celular.

**O que deu errado no caminho:**

1. **A barra de passos encostava no celular durante a entrada.** Ele chega inclinado para a câmera e a borda de baixo projeta mais baixo que no ato. Correção: a barra só aparece a partir de p 0,9.
2. **No ato 1 lado a lado, o celular saiu menor que nos outros atos.** O teto de escala era o da versão empilhada (0,7). No lado a lado ele passou a usar o teto dos atos laterais (1).
3. **Em tela muito alta (1440 × 1200), o celular maior do ato 1 encostava na barra:**
   - primeiro por causa da inclinação: a folga de altura no layout empilhado subiu de 1,06 para 1,14;
   - depois por causa do "flutuar" (sobe e desce ~1,1vh): o limite de baixo ficou 40 px acima da barra.

**Verificação:**
- **Sobreposição (varredura p 0 → 3,6 de 0,05 em 0,05, agora contando também os detalhes e a barra):** zero em 1890 × 900, 1920 × 1080, 1440 × 1200, 1440 × 900, 1280 × 720, 1104 × 575 e 390 × 844.
- **Tela vazia:** continua com no máximo 80 px de rolagem.
- **Capturas:** `capturas/preenchido-<tamanho>-p1_0 / p2_0 / p3_0.png`.

---

# Seção "Experimente": demonstração automática

Pedido: a lista só se reorganizava quando a pessoa clicava nos hábitos. Agora ela se
demonstra sozinha: um cursor falso marca e desmarca hábitos, e a pessoa pode assumir a
qualquer momento.

## Roteiro

Calculado com a regra real (`demoScore`). Estado inicial: **Tenho pet** + **Durmo cedo** marcados.

| Passo | Ação | Ordem depois (pontos) |
|---|---|---|
| início | — | Zona 7 100 · Centro 75 · República 75 · UEM 50 |
| 1 | desmarca **Durmo cedo** | **República 100** ↑ · Zona 7 75 · UEM 75 · Centro 50 ↓ |
| 2 | marca **Eu fumo** | República 100 · **Centro 50** ↑ · Zona 7 45 · UEM 45 |
| 3 | marca **Durmo cedo** | **Centro 75** ↑ · República 75 · Zona 7 70 · UEM 20 |
| 4 | marca **Recebo visitas** | **República 75** ↑ · Centro 55 · Zona 7 50 · UEM 20 |
| 5 | desmarca **Eu fumo** | **Zona 7 80** ↑ · República 75 · Centro 55 · UEM 50 |
| 6 | desmarca **Recebo visitas** | Zona 7 100 · Centro 75 ↑ · República 75 · UEM 50 (= início) |

São 6 passos de 2,5 s, em loop, e todo passo muda o 1º ou o 2º lugar. Se a pessoa mexeu nos
hábitos, no fim do roteiro a demo desfaz as diferenças, uma por passo, até voltar ao estado
inicial.

## Como foi feito

| Arquivo | Papel |
|---|---|
| `frontend/src/pages/landing/compatDemoText.ts` | roteiro (`DEMO_SCRIPT`), estado inicial, próximo passo (`nextDemoHabit`), quem subiu/desceu (`moves`) e a frase de cada passo (`describe`) |
| `frontend/src/pages/landing/CompatDemo.tsx` | o componente: cursor falso, temporização, FLIP, quem está no controle, botão, `aria-live` |
| `frontend/src/pages/home.css` | cursor e pulso de clique, brilho de quem subiu, setas ↑/↓, legenda com altura reservada |

**Cursor falso (`aria-hidden`):**
- Em cada passo ele surge perto do hábito (embaixo à direita), desliza até o canto do chip, faz um pulso de clique (anel + o chip afunda 5%), o hábito muda e o cursor some.
- Ele não atravessa os outros chips: some entre um passo e outro e reaparece já perto do próximo.

**Lista:**
- A reordenação usa o FLIP que já existia.
- A % conta até o valor novo com o `AnimatedNumber` e a barra acompanha.
- Quem subiu ganha um contorno que acende e apaga (`::after`, só opacidade e escala) e uma ↑. Quem desceu ganha uma ↓ discreta.
- Para a animação recomeçar a cada passo sem remontar o cartão (o que zeraria a contagem da %), o atributo `data-flash` alterna entre 0 e 1, e cada valor tem keyframes de nome próprio.

**Legenda:**
- É montada pelo `describe()` a partir da ordem real, antes e depois. Exemplos: "Demonstração: desmarcou **Durmo cedo** → República no Jd. Universitário subiu para o topo." ou "Você marcou…".
- Quando o topo não muda, ela fala da maior subida. Se ninguém subiu, fala da maior queda. Se nada mudou, diz "a ordem não mudou, só as porcentagens".

**Controle:**
- Passar o mouse, focar pelo teclado (`:focus-visible`) ou tocar em qualquer chip para a demo na hora e esconde o cursor.
- A demo volta 8 s depois da última interação, a partir do estado atual.
- O botão "Pausar demo / Continuar demo" fica ao lado da legenda (embaixo dela no celular).
- A demo só roda com a seção visível (IntersectionObserver, 35%) e a aba ativa (`visibilitychange`).

**Acessibilidade:**
- O `aria-live` da lista fica `off` durante a demo e vira `polite` só quando a pessoa muda algo.
- Com `prefers-reduced-motion` não há demo, cursor nem botão: a seção fica como antes.

**Sem dependência nova e sem GSAP:** o GSAP mora no chunk do 3D, e importá-lo aqui o puxaria para o JS principal. A seção usa o FLIP (WAAPI), o `AnimatedNumber`, `motion.ts` e transições CSS. O JS principal foi de ~217,0 para 217,3 kB gzip e continua sem GSAP (conferido no build).

**Sem mudança de layout:**
- O selo "combina mais" e as setas viraram elementos absolutos, então trocar de cartão não muda a altura de nada.
- A legenda tem 3 linhas reservadas.
- O botão tem largura fixa, para "Pausar" e "Continuar" não empurrarem a legenda.

## Verificação (Chrome headless + Playwright, 1440 × 900 e 390 × 844)

Gravação no próprio navegador: cada passo (mudança da legenda) e, quadro a quadro, a altura da seção, a posição dos chips e se o cursor visível encosta no texto de algum chip.

| Checagem | 1440 | 390 |
|---|---|---|
| Ordem de cada passo igual à tabela | 6/6 | 6/6 |
| Intervalo entre passos | 2,50–2,51 s | 2,50–2,52 s |
| Quadros com o cursor sobre o texto de um chip | 0 de 797 | 0 de 823 |
| Alturas da seção vistas | 1 (758 px) | 1 (1228 px) |
| Arranjos dos chips (quebra de linha) | 1 | 1 |
| `aria-live` da lista durante a demo / depois do clique da pessoa | off / polite | off / polite |
| Mouse num chip | cursor some na hora | idem |
| Volta depois de tirar o mouse | 9,2 s (8 s + início do passo) | 9,2 s |
| Botão Pausar → passos em 6 s | 0 | 0 |
| Botão Continuar → passos em 3,2 s | 1 | 1 |
| `prefers-reduced-motion` | sem botão, sem cursor, ordem parada | — |
| Aba escondida → passos em 6 s | 0 | — |

Capturas: `capturas/experimente-1440-passo1..3.png`, `experimente-390-passo1..3.png` e `experimente-1440-pessoa.png` (depois de a pessoa assumir). Nos passos a % aparece no meio da contagem.

## O que deu errado

1. **O teste perdia passos.** A primeira versão esperava tempos fixos entre as leituras, os atrasos se somavam e ela pulava passos ("passo 4 ERRADO"). Não era erro do roteiro: onde os tempos bateram, a ordem conferia. O teste passou a gravar cada passo no momento em que acontece (MutationObserver na legenda).
2. **Erro de contagem no próprio teste:** a troca de "Toque nos hábitos…" para "Assistindo à demonstração…" foi contada como passo, e tudo saiu deslocado em um. Agora ela é ignorada.
3. **O cursor passava sobre o texto dos chips** ao deslizar de um hábito para outro do outro lado (o caminho reto cruzava os chips). Agora ele some entre passos e reaparece perto do próximo hábito, deslizando só alguns pixels.
4. **Ainda encostava em 2 quadros de ~650:** a ponta, no canto do chip de cima, descia 3 px sobre o texto do chip da linha de baixo enquanto sumia. A ponta subiu 3 px e o cursor diminuiu de 20 × 24 para 16 × 19. Resultado: 0 quadros.
5. **A demo nunca voltava depois de um clique com o mouse.** Clicar foca o botão, e o foco contava como "pessoa mexendo pelo teclado". Agora só conta o foco de teclado (`:focus-visible`).

**Ainda em aberto:**
- Depois de a pessoa mexer, o passo que desfaz uma diferença pode não mudar a ordem. A legenda diz isso ("a ordem não mudou, só as porcentagens"). É honesto, mas menos vistoso que os passos do roteiro.
- Falta testar com leitor de tela de verdade (NVDA/VoiceOver). O `aria-live` foi conferido só pelo atributo.

## Ajuste depois do pedido: sem legenda e sem botão

O usuário pediu para remover a legenda ("Demonstração: desmarcou…") e o botão "Pausar demo", porque não há necessidade de pausar a simulação.

- **Saíram:**
  - a linha de legenda e o botão;
  - a função `describe()` em `compatDemoText.ts`;
  - o estilo `.demo-caption*` / `.demo-toggle`.
- **Ficaram:**
  - o cursor falso, as setas ↑/↓ e o brilho de quem subiu;
  - a pausa automática quando a pessoa passa o mouse, foca pelo teclado ou toca num hábito (volta 8 s depois);
  - a regra de rodar só com a seção visível e a aba ativa.
- **O aviso "Anúncios fictícios…" ficou:** ele avisa que os anúncios da demo não são reais.
- **Conferido em 1440 e 390:** a demo segue sozinha (3 reordenações em 8 s, na ordem do roteiro), sem legenda nem botão na tela, e a seção continua com uma altura só. A seção ficou mais baixa (1440: 758 → 692 px), porque a legenda reservava 3 linhas.
- **Captura:** `capturas/experimente-1440-sem-legenda.png` e `experimente-390-sem-legenda.png`.

---

# Seções "Feito para a convivência dar certo" (Recursos) e "Preços"

Pedido:
- melhorar as duas seções vizinhas para parecerem feitas juntas (mesmo hover, sombras, raios e entrada);
- consertar um bug do bento e dar um micro-loop a cada arte;
- nos preços: alinhar os cartões, explicar "anúncio ativo", criar um simulador e dar destaque à faixa de pagamento/reembolso.

Referências: kontto.com.br e getnora.com.br.

## Referências: o que foi aproveitado e o que não combina

**Aproveitado (inspiração, sem copiar texto, layout ou marca):**
1. **Mesma anatomia em todos os cartões** (Kontto): arte num painel embutido com fundo próprio e altura fixa por linha, e título + texto embaixo. Isso alinha a altura dos cartões de uma linha.
2. **Mini-dados concretos na arte**, no lugar de ícones decorativos: CPF mascarado, lista de vagas filtrando, estrelas + trecho, perfis com hábitos em comum.
3. **Cartões de preço com a mesma estrutura** e destaque só por decisão (Nora). Aqui não há "plano em destaque": cada público tem a sua cor na barra do topo.
4. **Aviso de pagamento/reembolso colado nos cartões, na hora da decisão** (Nora), mas com mais peso: ícones, 14 px, contraste AA.

**Não combina com o RachaAi:**
- **Depoimentos de "usuários"** (Kontto): o produto ainda não tem usuários, e inventar depoimentos seria enganoso. O trecho de avaliação da arte é marcado como "exemplo".
- **Seletor mensal/anual e "preço de lançamento, pode aumentar"** (Nora): não há assinatura, e essa urgência seria manipuladora.

## Bug do bento: bolhas e chips invisíveis

**Causa:**
- as bolhas do "Conversa direta" e os chips do "Compatibilidade" começavam em `opacity: 0` e dependiam da animação `pop-up` para aparecer;
- os `@keyframes pop-up` ficavam dentro do bloco CSS do celular antigo do "Como funciona", apagado quando o celular virou 3D;
- animação com keyframes inexistentes não roda, então os elementos ficavam em `opacity: 0` para sempre.

Não era o observer nem o reduced-motion.

**Correção (para não depender mais disso):**
- O CSS de base de cada arte agora é o estado FINAL, com tudo visível. As animações só acrescentam o ponto de partida.
- O estado escondido da entrada (`.reveal`) só vale quando o JS arma o contêiner (`.reveal-armed`, em `motion.ts`). Sem JS, com movimento reduzido ou sem IntersectionObserver, nada fica invisível.
- O `@keyframes pop-up` foi restaurado, porque o FAQ e o título do "Como funciona" também o usam.

**Conferido:** bolhas e chips com opacidade 1 nos modos normal, movimento reduzido e sem IntersectionObserver.

## Recursos (bento)

**Layout:**
- **1440:** compatibilidade e mapa, os protagonistas, lado a lado na 1ª linha (arte de 236 px); os 4 pequenos na 2ª linha (arte de 168 px).
- **768:** os dois grandes em largura total e os pequenos 2 × 2.
- **390:** uma coluna, na mesma ordem.
- **Medido:** alturas por linha iguais (1440: 376/376 e 353 × 4), nenhuma arte cortada e sem rolagem lateral em 1440, 768 e 390.

**Artes (micro-loops de 4–5 s):**
- Cada uma só roda com o cartão na tela: o observer liga e desliga `is-playing`, e fora da tela a arte volta ao estado final.
- No hover, o painel cresce 1,5% e o detalhe principal fica mais intenso.

| Cartão | Loop | Hover |
|---|---|---|
| **Compatibilidade** | dois perfis genéricos ("Você" e "Marina") com 4 hábitos cada. Os 3 em comum deslizam para o centro e ganham contorno, enquanto o medidor desenha e conta até 92% (`@property --n` + `counter()`, sem JS). | medidor cresce 5% |
| **Perto da faculdade** | raio pulsa (com eco); 3 pins caem dentro do raio e 1 cai fora, apagado; marca "faculdade" no centro | eco pulsa 2 × mais rápido |
| **Conversa direta** | bolha da outra pessoa → sua resposta → "digitando…" → vira a resposta → recomeça | — |
| **Avaliações** | 5 estrelas se preenchem uma a uma, depois aparece um trecho curto com a etiqueta "exemplo" | — |
| **Um CPF por conta** | o check do escudo se desenha (`stroke-dashoffset`) e aparece `•••.•••.•••-12` | escudo cresce |
| **Vagas por sexo** | a pílula desliza entre Qualquer / Mulheres / Homens, e a mini-lista de 3 vagas apaga a que não aparece para aquele perfil | — |

**Desempenho:**
- Só `transform`/`opacity`/`stroke-dashoffset`. A exceção é a contagem do 92%, que repinta só esse texto.
- Com os 6 loops rodando: **60,0 fps** de média e 0 quadros acima de 20 ms (Chrome headless, 4 s).
- Com a seção fora da tela: 0 animações rodando.

## Preços

**Cartões:**
- Os dois têm a mesma estrutura: público → preço → explicação → itens → CTA.
- Por subgrid, público, preço e CTA ficam na mesma altura nos dois (1440: topos 377/377, preço 444/444, CTA 1042/1042). Explicação e itens fluem abaixo do preço.
- Mesma sombra e mesma altura. Antes só um tinha sombra, por estar com hover na hora do print.
- O "3 px mais baixo" vinha da entrada escalonada do 2º cartão. Hoje os dois param exatamente alinhados.

**"Anúncio ativo":** uma linha num quadrinho logo abaixo de "3 grátis", conferida no código (`ListingService`):
> Ativo é o anúncio publicado. Removeu um, a vaga grátis volta. Do 4º em diante, cada anúncio extra é pago e fica no ar por 30 dias.

**Simulador (no cartão de quem anuncia):**
- **Controles:** seletor de 1 a 10 anúncios (botões de 44 px, desabilitados nos limites) e a opção "Destacar um anúncio no topo".
- **Total em tempo real:** por exemplo, "5 anúncios → 3 grátis + 2 × R$ 1,00 = R$ 2,00 · por 30 dias".
- **Origem dos valores:** `GET /billing/precos`. A conta está em `priceSim.ts`.
- **Enquanto carrega:** aparecem os padrões do backend (`DEFAULT_PRICES`, espelho do `application.yml`) esmaecidos, com `aria-busy`. Sem pulo de layout: 744 px antes e depois de a resposta chegar.
- **Se a API falhar:** as linhas mostram "ao publicar" e o simulador avisa.

Testado com os preços de teste (R$ 1,00):

| Anúncios | Sem destaque | Com destaque |
|---|---|---|
| 1 | 1 grátis = R$ 0,00 · sem prazo para vencer | + destaque R$ 1,00 = R$ 1,00 · por 30 dias |
| 3 | 3 grátis = R$ 0,00 · sem prazo para vencer | + destaque R$ 1,00 = R$ 1,00 · por 30 dias |
| 4 | 3 grátis + 1 × R$ 1,00 = R$ 1,00 · por 30 dias | … + destaque R$ 1,00 = R$ 2,00 · por 30 dias |
| 10 | 3 grátis + 7 × R$ 1,00 = R$ 7,00 · por 30 dias | … + destaque R$ 1,00 = R$ 8,00 · por 30 dias |

O botão "−" fica desabilitado em 1 e o "+" em 10.

**Faixa de confiança:**
- Fica abaixo dos cartões, com 3 ícones e o mesmo texto de antes, só separado em itens:
  - "Pagamento único pelo Mercado Pago (Pix, crédito ou débito)";
  - "Sem renovação automática";
  - "Você tem 7 dias para desistir… (CDC, art. 49)".
- Texto de 14 px, com contraste de 7,6:1 no tema claro e 9,4:1 no escuro.

**Alvos de toque:** pelo menos 44 px em todos (seletor, opção de destaque e botões).

**Base comum das duas seções:**
- `.lp-card` com o mesmo raio (22 px), borda e sombra em repouso;
- mesmo hover: sobe 4 px, sombra maior, borda mais forte;
- mesma entrada (`.reveal`) e sombras próprias no tema escuro;
- com "reduzir movimento": sem loops, sem entrada e sem o levantar do hover.

## O que deu errado

1. **O teste "sem IntersectionObserver" derrubou a página inteira.** O problema não estava no bento: a demo do "Experimente" e o palco 3D criavam o observer sem checar se ele existe, e o erro desmontava o React. Os dois agora têm guarda: a demo automática não liga, e o 3D roda sempre que a aba está ativa.
2. **Na arte de compatibilidade, as colunas saíram trocadas.** No HTML o medidor vem por último, então a coluna da Marina caiu no meio, colada na sua. Agora a posição de cada uma é fixa no grid.
3. **Em 390 a arte de compatibilidade não cabia** e cortava o medidor. A regra de celular (medidor de 84 px, chips de 10,5 px) estava antes da regra base no CSS e era sobrescrita; foi movida para o fim do bloco.
4. **O total do simulador saía "R$ 2 , 00"**, com espaços na vírgula, por causa dos números tabulares. Tirei os tabulares do total.
5. **Primeira tentativa de alinhar os preços:** as 5 linhas por subgrid, com explicação e itens também, deixavam um buraco enorme no cartão de quem procura. Centralizar a lista ficou pior ainda. Ficou subgrid em 4 linhas: público, preço, corpo e CTA.
6. **As capturas mostravam as artes no começo do loop** (0%, chat vazio). Ao fotografar, o cartão reentra na tela e o loop recomeça.
   - As capturas finais desligam as animações por estilo, para mostrar o estado final.
   - O teste de 390 também precisou rolar a seção antes, porque os cartões de baixo ainda não tinham "entrado".
7. **O teste de "arte cortada" dava falso positivo no mapa**, cujas ruas saem da borda de propósito. Ele foi refeito para medir cada elemento da arte contra o painel, ignorando as ruas.

## Pendente

- **Padrão durante o carregamento:** se os preços de produção forem diferentes dos padrões do backend (`EXTRA_LISTING_PRICE` etc.), o padrão aparece esmaecido por um instante antes do valor real. Foi o pedido (mostrar o padrão sem pulo de layout), mas vale saber.
- **Contagem do 92%:** usa `@property`. Em navegador sem suporte (Firefox anterior à versão 128), o número aparece direto, sem contar.
- **Espaço sobrando no cartão de quem procura:** em telas largas sobra espaço entre os itens e o botão, porque o cartão vizinho tem o simulador. É o comportamento normal de cartões de preço lado a lado.
- **Faltam testes em aparelho real e com leitor de tela.**

## Capturas

- **Recursos:** `capturas/bp-recursos-{1440, 1440-escuro, 768, 390}.png`.
- **Preços:** `capturas/bp-precos-{1440, 1440-escuro, 768, 390}.png` e `bp-precos-1440-simulador.png`.

---

# Design system (Etapas 1–3)

Guia em vigor: [10-DESIGN-SYSTEM.md](../10-DESIGN-SYSTEM.md), Parte A. Antes e depois de 18 telas (390/1440, claro/escuro) em `capturas/design-system/{antes,depois,comparativos}/`.

## O que mudou

- **Etapa 1 (auditoria):** 24 variações de botão, 7 `inputClass`, 17 cartões, modal copiado 6 vezes, 106 `text-[13px]`, serifa em 15 arquivos, 5 cores reprovadas no AA. Tudo registrado na Parte B do guia.
- **Etapa 2 (base):**
  - Escalas no `@theme`: tipografia nomeada, raio, sombra, curvas; camadas e durações em `:root`.
  - Cores corrigidas para o AA, `--color-field` para borda de campo.
  - 12 primitivos em `components/ui`, galeria `/dev/ui` (só em dev).
  - `scripts/check-design.mjs` ligado ao `npm run lint`.
- **Etapa 2b (tipografia):**
  - Uma família só (Schibsted 400–800, sem Fraunces e sem o 900).
  - Fallback com métricas ajustadas para não pular o layout.
  - `--font-mono`.
- **Etapa 2c (marca):**
  - `Logo` com tamanho/variante/tom fixos e `LogoLink` para a home certa, no topo de todas as telas de autenticação e de fluxo isolado.
  - Favicon, PWA e apple-touch-icon regenerados da geometria da `LogoMark` (`scripts/gen-icons.mjs`); o favicon tem versão escura.
  - `theme-color` por tema (metas com `media` + `ThemeContext`); `public/icons.svg`, sobra do Vite, removido.
- **Etapa 3 (migração), na ordem pedida, um commit por grupo:** componentes compartilhados → autenticação/onboarding (+ marca) → busca/anúncios → conversas → perfil/pagamentos → admin → landing e páginas legais.
  - As telas foram migradas em paralelo por agentes, cada um com arquivos exclusivos e o mesmo guia "de → para" ([design-system-migracao.md](../design-system-migracao.md)); a revisão e os commits foram feitos aqui.
  - **Landing:** `home.css` e `phone.css` consomem só tokens.
    - Texto de interface → escala nomeada (ganhou `text-lead` e `text-price`).
    - Arte decorativa → tokens de ilustração `--art-*`/`--device-*`, para não deformar desenhos feitos em 10,5/11,5/12,5 px. O tema escuro do aparelho virou variável (sumiram 6 regras `:root[data-theme='dark'] .p3-*`).
- **Resultado:** checagem de 236 violações → 0. Bundle total (JS+CSS gzip) +0,6%; CSS sozinho +9,5% (2,1 kB) — detalhe no guia, A5.

## O que foi pulado (mudaria comportamento)

- **`aria-pressed` não foi acrescentado** onde não existia (filtros do admin, "Busco vaga/imóvel", "Tenho interesse", ChipPicker do onboarding/perfil). Por isso esses usam `chipClass()`/`Button` e não `<Chip>`. Fica como melhoria de acessibilidade separada.
- **`aria-label` que faltava não foi criado:** setas de voltar/abrir conversa, campo de mensagem do chat, campos do login/cadastro só com placeholder, Denunciar/Bloquear só com `title`.
- **Altura do chat (`h-[calc(100vh-124px)]`)** ficou; trocar por `dvh` muda layout.
- **"voltar" do detalhe de anúncio** continua indo para `/conversas` (parece errado, mas é rota).
- **Lixeira das fotos** continua aparecendo só no hover (agora também no foco de teclado); em toque segue pequena.
- **`PaymentReturnPage`** e Confirmar e-mail logado não ganharam logo grande: a NavBar já está lá.
- **Manifest do PWA** continua com `theme_color` claro: o formato não aceita cor por tema.

## Mudanças visuais que valem conferir

- Seleção de chip/quantidade/garagem: de escuro (`inverse`) para azul-claro da marca (`brand-tint`), em todo o app.
- Carro/Moto no anúncio viraram pílulas com ícone ao lado (antes, blocos 64×88).
- Status "Cancelado" em pagamentos agora é vermelho (era cinza).
- Bolha do próprio usuário no chat: de escuro para `brand`, igual à arte da landing.
- No Login, Cadastro e Onboarding o logo saiu de dentro do cartão e foi para cima dele, como link (o nome acessível do h1 do login passou a ser "RachaAi, página inicial").
- Campos de texto de avaliação seguem a altura mínima do sistema (96 px), um pouco mais altos.

## O que deu errado

1. **A própria checagem tinha um bug:** `font-size:\s*(?!var\()` deixava o `\s*` casar com zero espaços, e aí `font-size: var(--x)` era apontado. Toda regra de CSS dava falso positivo depois da troca por tokens. O espaço passou para dentro do lookahead (`font-size:(?!\s*var\()`).
2. **O oxlint não roda no Node do host (20.11) e não roda no Docker com o `node_modules` montado** (binário nativo do Windows). Os agentes e a bateria final usaram `npm ci` dentro de um `node:22-alpine` numa cópia do projeto.
3. **O heredoc do bash quebrou** com aspas simples dentro de seletores (`[data-theme='dark']`) em scripts Python longos. Os scripts de troca foram gravados como arquivo e executados.
4. **O primeiro script do `home.css` parou no meio** (`KeyError: '999'`): o mapa de raios não tinha a pílula de 999 px. Parou antes de gravar, então nada ficou pela metade.
5. **`--radius-xs` não existia de verdade:** a bolha do TypingIndicator usava o padrão do Tailwind (2 px), que só é emitido se usado. Foi declarado no `@theme` (4 px, o valor que a arte já usava).
6. **Comparação de bundle justa:** a medida "antes" da auditoria era de outra ferramenta. O "antes" foi refeito buildando o commit `84f5b97` no mesmo contêiner, com o mesmo `gzip`, e os números ficaram ~0,4% acima dos da auditoria.
7. **O ambiente em :8082 servia o build antigo.** Foi preciso reconstruir o contêiner do frontend antes das capturas "depois".
8. **O ImageMagick do alpine não tinha fonte**, então as montagens antes/depois falharam no rótulo. Resolvido com `font-dejavu` + `fontconfig`.
