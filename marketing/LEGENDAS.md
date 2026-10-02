# Legendas do Instagram · RachaAi

Arquivos em `saida/`. Antes de postar, troque **@rachaai** pelo @ real da conta e
coloque o link do site na bio.

---

## 1. Feed · Lançamento: `feed-01-lancamento.png`

> Dividir apê não precisa começar num grupo de WhatsApp com 800 pessoas. 😅
>
> No RachaAi você monta um perfil com seus hábitos (fuma? tem pet? qual sua rotina?) e vê o quanto combina com cada pessoa **antes** de chamar.
>
> 🏠 Feito para Maringá
> 💸 Procurar vaga é grátis, sempre
>
> Link na bio. Marca aqui quem tá procurando com quem morar 👇
>
> #Maringá #DividirAluguel #MoradiaEstudantil #UEM #RepúblicaMaringá #ApêCompartilhado #UniversitáriosMaringá

**Texto alternativo:** Ilustração 3D de um apartamento dividido em dois quartos, com casinhas azuis em volta e o texto "Ache com quem dividir o aluguel, sem grupo de WhatsApp."

---

## 2. Feed · Compatibilidade: `feed-02-compatibilidade.png`

> 92% compatível. Dá pra chamar sem medo. ✅
>
> Cada vaga no RachaAi mostra a compatibilidade com você, calculada pelos hábitos que importam para a convivência: fumo, bebida, alimentação, pets, rotina, barulho…
>
> Menos surpresa depois da mudança, mais chance de dar certo.
>
> Crie seu perfil grátis, link na bio.
>
> #Maringá #DividirAluguel #MoradiaEstudantil #ColegaDeQuarto #ApêCompartilhado

**Texto alternativo:** Cartão de anúncio de um quarto na Zona 7, R$ 650 por mês, com 92% de compatibilidade e hábitos em comum: não fuma, tem um gato, rotina de dia, silêncio à noite, divide as compras.

> ⚠️ O card é um **exemplo ilustrativo** (está escrito na arte). Não use como se fosse um anúncio real.

---

## 3. Feed · Carrossel "Como funciona": `feed-03-como-funciona-1.png` a `-4.png`

Poste os 4 na ordem, como **um único carrossel**.

> Achar com quem morar em 3 passos 👉
>
> 1️⃣ Monte seu perfil com seus hábitos
> 2️⃣ Veja a % de compatibilidade de cada vaga (com filtro por bairro, mapa e orçamento)
> 3️⃣ Chame direto no chat, sem curtida e sem espera
>
> Salva esse post pra quando for procurar apê. 📌
>
> #Maringá #DividirAluguel #MoradiaEstudantil #UEM #DicasDeMoradia #ApêCompartilhado

---

## 4. Feed · Para anunciantes: `feed-04-anunciante.png`

> Tem um quarto sobrando? Anuncie grátis. 🟢
>
> Os 3 primeiros anúncios no RachaAi são grátis, e você vê a compatibilidade de cada interessado antes de responder. Sem filtrar 50 mensagens no grupo.
>
> Vaga para dividir ou imóvel inteiro, com fotos. Link na bio.
>
> #Maringá #AluguelMaringá #VagaEmRepública #QuartoParaAlugar #DividirAluguel

---

## 5. Story: `story-01-lancamento.png`

Poste e adicione por cima, no próprio Instagram:
- o **sticker de link** apontando para o site, na área vazia acima de "link na bio";
- opcionalmente, uma **enquete**: "Você já dividiu apê com alguém que não combinava? 🙋 Sim / 😇 Nunca".

---

## 6. Reels · "O racha": `reel-01-racha.mp4` (10 s)

**Capa:** `reel-01-racha-capa.jpg`

> Dividir apê não precisa ser uma loteria. 🎲🏠
>
> Veja quanto vocês combinam antes de chamar, no RachaAi. Feito para Maringá. Link na bio.
>
> #Maringá #DividirAluguel #MoradiaEstudantil #UEM #Reels

**Áudio:** o vídeo é **mudo** de propósito. Escolha uma música em alta direto no app do Instagram (as músicas do app são licenciadas para uso lá).

---

## 7. Reels · "Compatibilidade": `reel-02-compatibilidade.mp4` (8,5 s)

**Capa:** `reel-02-compatibilidade-capa.jpg`

> Quanto vocês combinam? 🤔
>
> No RachaAi, cada vaga mostra a compatibilidade com você pelos hábitos de vocês dois. Crie seu perfil grátis, link na bio.
>
> #Maringá #DividirAluguel #ColegaDeQuarto #MoradiaEstudantil #Reels

---

## Sugestão de ordem (2 semanas)

| Dia | Post |
|---|---|
| Seg (sem. 1) | Feed 1 · Lançamento + Story |
| Qua | Reels · O racha |
| Sex | Carrossel · Como funciona |
| Seg (sem. 2) | Feed 2 · Compatibilidade |
| Qua | Reels · Compatibilidade |
| Sex | Feed 4 · Para anunciantes |

Picos de busca por moradia estudantil: **janeiro/fevereiro** e **julho**, antes dos semestres.

## Formatos

| Tipo | Tamanho | Arquivo |
|---|---|---|
| Feed (4:5) | 1080 × 1350 | PNG |
| Story | 1080 × 1920 | PNG |
| Reels | 1080 × 1920, 30 fps, H.264 | MP4 |

## Gerar de novo / editar

Os textos e o layout ficam em `templates/*.html`. Para regerar:

```bash
cd marketing
npm install          # só na primeira vez
node render.mjs      # todas as artes
node render.mjs reel-01   # só uma
```

Usa o Chrome já instalado no computador (modo invisível, perfil temporário).
