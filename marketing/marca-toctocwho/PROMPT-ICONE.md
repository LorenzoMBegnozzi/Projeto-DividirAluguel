# Prompt · Melhorar o ícone (mascote caranguejo)

Cole numa sessão nova do Claude Code, na pasta do projeto.

```
Vamos melhorar o ícone do Toc Toc Who? usando o mascote caranguejo-eremita 3D.
Primeiro olhe, diagnostique e proponha. Só depois renderize.

CONTEXTO (leia antes)
- Marca: Toc Toc Who? (toctocwho.com.br). Ícone atual em 2D, uma porta dupla:
  marketing/marca-toctocwho/icone-app.svg (e icone-app-escuro.svg, icone.svg).
- Mascote: modelo 3D gerado por frontend/scripts/generate-landing-crab.mjs
  (frontend/public/landing/caranguejo.glb). As poses saem do pipeline em
  marketing/marca-toctocwho/poses-3d/fonte/ (leia o LEIAME.md, o poses.py, o
  render.py e o compor.py).
- Testes atuais (olhe as imagens): marketing/marca-toctocwho/logo-3d-exemplos.png,
  logo-3d-dentro-da-concha.png e logo-3d-poses.png.
- Paleta e fonte: docs/10-DESIGN-SYSTEM.md. Use só as cores da marca: brand #1e5f7a,
  coral-bright #e8704a, paper #faf7f2 e ink #1b2b33.
- Use as skills design:design-critique e frontend-design para o diagnóstico.

PROBLEMAS QUE EU JÁ VEJO NOS TESTES (confirme e acrescente outros)
1. Em 40 a 60 px vira ruído: olhos, 8 patas, garras, listras da concha e o anel
   branco da abertura brigam entre si.
2. O enquadramento muda de um fundo para outro: patas e garras cortadas na borda e
   tamanho do bicho diferente em cada versão.
3. Tem elemento demais ao mesmo tempo: caranguejo, concha, anel, patas e bochecha.
4. O render tem cara de plástico: concha facetada (dá pra ver os polígonos),
   brilho especular duro, luz chapada e sombra fraca.
5. O fundo "praia" é uma cena e não funciona como fundo de ícone.

O QUE O ÍCONE PRECISA
- Uma silhueta só, que dê pra reconhecer em preto chapado a 29 px.
- Ocupar de 70% a 80% da área segura, centralizado no centro óptico, sem nada
  encostando ou cortado na borda.
- No máximo 3 massas de cor (concha brand, caranguejo coral e fundo).
- Funcionar em 3 recortes: quadrado arredondado do iOS, círculo do Android
  "maskable" (zona segura de 80%) e círculo do avatar do Instagram.
- Ligação com o nome: "Toc Toc Who?" é alguém batendo na porta de uma casa nova.
  A concha é a casa do caranguejo.

DIREÇÕES (proponha 3, com 1 render rápido de cada)
A. Espiando: o caranguejo dentro da concha, de frente, mostrando só os olhos e as
   duas garras na borda da abertura. As patas ficam escondidas.
B. Toc toc: o caranguejo de frente, com uma garra levantada "batendo", e a concha
   inteira atrás como fundo.
C. Uma ideia sua que junte a concha e a porta dupla do ícone atual (ex.: a abertura
   da concha desenhada como a porta).
Para cada uma, diga em 2 linhas por que funciona em tamanho pequeno.

MELHORIAS DE RENDER (para a direção escolhida)
- Crie parâmetros próprios para o ícone, num arquivo novo em poses-3d/fonte/. Não
  altere o generate-landing-crab.mjs nem o .glb da landing.
- Mais segmentos e normais suaves na concha (nada de faceta), material com
  roughness em torno de 0,45 e especular suave.
- Luz: principal em cima à esquerda, rim light fria atrás pra separar do fundo,
  oclusão de ambiente leve e sombra de contato suave embaixo.
- Simplifique pro tamanho de ícone: olhos maiores (cerca de 1,3x), listras da concha
  mais largas e em menor número, sem bochecha e sem anel branco.
- Fundos lisos com no máximo um gradiente leve de 2 tons da mesma cor: creme, azul,
  coral e escuro.

ENTREGA DA RODADA 1 (em marketing/marca-toctocwho/icone-v2/, sem apagar nada)
- folha-direcoes.png: as 3 direções nos 4 fundos, em 1024 px.
- folha-tamanhos.png: cada direção em 1024, 180, 60, 40 e 29 px, mais a versão em
  preto chapado e os recortes circular e iOS lado a lado.
- Um parágrafo com o seu diagnóstico e a recomendação.
Pare aqui e espere eu escolher.

ENTREGA FINAL (só depois que eu escolher)
- iOS 1024x1024 sem transparência; Android adaptive (foreground transparente e
  background separados, 432x432); PWA 192 e 512 (normal e maskable); avatar do
  Instagram 1080x1080.
- Favicon de 16 e 32 px: nesses tamanhos o 3D não se lê, então faça uma versão 2D
  chapada em SVG com a mesma silhueta.
- Não mexa em frontend/public nem no gen-icons.mjs até eu aprovar a troca no app.
```
