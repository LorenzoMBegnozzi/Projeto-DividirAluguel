# Product Marketing Context

**Document version:** v1
**Last updated:** 2026-10-04

> Rascunho gerado a partir do código (README, landing, onboarding, docs/06-COBRANCA.md, marketing/LEGENDAS.md).
> Itens marcados com **[confirmar]** são suposições que precisam de validação.

## Product Overview
**One-liner:** Ache com quem dividir o aluguel em Maringá, sem grupo de WhatsApp.
**What it does:** Plataforma onde estudantes e jovens que chegam a Maringá encontram vaga ou alguém para dividir apartamento. Cada pessoa monta um perfil com hábitos de convivência (fumo, bebida, alimentação, pets, rotina, barulho, visitas) e cada anúncio mostra a % de compatibilidade com ela. Dá para filtrar por bairro, mapa e orçamento e chamar direto no chat.
**Product category:** Dividir aluguel / moradia estudantil / colega de quarto (república, "apê compartilhado", "vaga em república").
**Product type:** Marketplace de dois lados (web app + PWA).
**Business model:** Quem procura nunca paga. Quem anuncia tem 3 anúncios ativos grátis; do 4º em diante paga *anúncio extra* (R$ 19,90 / 30 dias, valor de partida) e pode pagar *destaque* para aparecer no topo da busca (R$ 14,90 / 30 dias). Pagamento via Mercado Pago (Pix, crédito, débito). **[confirmar preços finais — hoje estão em R$ 1,00 de teste]**

## Target Audience
**Lado da demanda (procura vaga):** universitários de outras cidades que vão estudar em Maringá (UEM, Unicesumar, UniCesumar, UniFCV etc. **[confirmar instituições-alvo]**), 18–25 anos, orçamento apertado, sem rede de contatos na cidade.
**Lado da oferta (anuncia):**
- Quem já mora num apê/república e tem um quarto sobrando ("Tenho vaga pra dividir").
- Proprietários e imobiliárias com imóvel inteiro ("Tenho um imóvel pra alugar").
**Primary use case:** Encontrar um colega de casa com quem a convivência vai dar certo, perto da faculdade, dentro do orçamento.
**Jobs to be done:**
- "Me ajuda a achar um lugar pra morar perto da faculdade sem conhecer ninguém na cidade."
- "Me ajuda a não cair numa casa com alguém que não combina comigo."
- (anunciante) "Me ajuda a preencher o quarto vago rápido com alguém que eu aguente morar junto."
**Use cases:**
- Calouro de outra cidade procurando vaga antes do início do semestre (picos: jan/fev e julho).
- Morador cuja colega de apê saiu e precisa de alguém para rachar o aluguel.
- Estudante buscando vaga só para mulheres (vagas por sexo).
- Proprietário anunciando imóvel inteiro para grupo de estudantes.

## Personas
B2C de dois lados — sem comitê de compra.
| Persona | Cares about | Challenge | Value we promise |
|---------|-------------|-----------|------------------|
| Calouro(a) de fora | Preço, distância da faculdade, segurança, não morar com gente estranha | Não conhece ninguém em Maringá; grupos são caóticos | Vê quanto combina com cada pessoa antes de chamar; procurar é grátis |
| Morador(a) com quarto vago | Achar alguém rápido e confiável para não pagar o aluguel sozinho | Filtrar 50 mensagens no grupo, gente que some | Anúncio grátis e compatibilidade de cada interessado antes de responder |
| Proprietário / imobiliária | Imóvel ocupado, inquilino que paga | Pouca visibilidade com público universitário | Até 3 anúncios grátis + destaque no topo da busca |

## Problems & Pain Points
**Core problem:** Achar com quem morar numa cidade nova depende de grupos de WhatsApp/Facebook enormes e desorganizados, onde não dá para saber se a pessoa combina com você até já estar morando junto.
**Why alternatives fall short:**
- Grupos de WhatsApp/Facebook: centenas de mensagens, sem filtro, sem perfil, sem histórico da pessoa.
- Portais imobiliários: focados em imóvel inteiro e contrato, não em colega de casa.
- Indicação de conhecido: quem vem de fora não tem rede na cidade.
**What it costs them:** Tempo filtrando mensagens; risco de morar meses com alguém incompatível (fumo, barulho, bagunça, visitas); dinheiro perdido com mudança ou com quarto vazio.
**Emotional tension:** Ansiedade de mudar sozinho(a) para outra cidade; medo de "dividir apê ser uma loteria"; insegurança em falar com desconhecidos (especialmente mulheres).

## Competitive Landscape
**Direct:** Outros sites/apps de colega de quarto e moradia estudantil (ex.: Roomgo, EasyQuarto, Uniplaces **[confirmar quais são usados em Maringá]**) — genéricos/nacionais, pouco anúncio local, sem compatibilidade por hábitos.
**Secondary:** Grupos de WhatsApp e Facebook de "Repúblicas Maringá", OLX, Facebook Marketplace — volume alto mas caótico, sem perfil nem filtro de convivência.
**Indirect:** Imobiliárias, QuintoAndar/Zap/VivaReal, pensionatos, morar sozinho em kitnet, indicação de amigos — mais caro ou não resolve o "com quem".

## Differentiation
**Key differentiators:**
- % de compatibilidade por hábitos de convivência em cada anúncio.
- Feito para Maringá: filtro por bairro e mapa com a faculdade/trabalho como referência.
- Procurar vaga é grátis, sempre.
- Chat direto, "sem curtida, sem espera" (não é app de match).
- Segurança: CPF no cadastro, avaliações de quem já morou junto, bloqueio e denúncia, vagas por sexo.
**How we do it differently:** O perfil de hábitos vem antes da conversa; a busca é ordenada por compatibilidade, não por data de post.
**Why that's better:** Menos surpresa depois da mudança, mais chance de a convivência dar certo, menos tempo filtrando mensagens.
**Why customers choose us:** "Vejo quanto a gente combina antes de chamar" + é local + é grátis para quem procura.

## Objections
| Objection | Response |
|-----------|----------|
| "Já tem os grupos de WhatsApp, é de graça." | Aqui também é grátis para quem procura, e você vê o perfil e a compatibilidade antes de chamar, em vez de garimpar 800 mensagens. |
| "Ainda tem poucos anúncios." | **[ponto fraco real no lançamento]** Anunciar é grátis (3 anúncios), então quem tem vaga não tem motivo para não postar também aqui. |
| "É seguro falar com desconhecido?" | Cadastro com CPF, avaliações de convívio, bloqueio e denúncia, vagas só para mulheres invisíveis para homens. |
| "Compatibilidade de app funciona mesmo?" | A conta usa hábitos concretos (fuma, pet, rotina, barulho), não personalidade; é um filtro, a decisão é sua. |

**Anti-persona:** Quem procura aluguel de longo prazo com família; quem quer contrato e garantia via imobiliária tradicional; quem está fora de Maringá (por enquanto); menores de 18 anos (cadastro exige maioridade).

## Switching Dynamics
**Push:** Caos dos grupos de WhatsApp, experiências ruins com colega incompatível, gente que some no meio da conversa.
**Pull:** Ver a compatibilidade antes de chamar, mapa perto da faculdade, grátis, local.
**Habit:** "Todo mundo acha vaga no grupo"; indicação de veterano; já estar em vários grupos.
**Anxiety:** Plataforma nova com poucos anúncios; dar dados (CPF) para um site desconhecido; golpe de aluguel.

## Customer Language
**How they describe the problem:**
- "grupo de WhatsApp com 800 pessoas" **[frase nossa, não verbatim — coletar falas reais]**
- "dividir apê é uma loteria"
- "procurando com quem morar"
**How they describe us:**
- **[coletar após primeiros usuários]**
**Words to use:** dividir aluguel, rachar, apê, vaga, república, colega de casa, quem combina com você, compatibilidade, hábitos, rotina, perto da faculdade, Maringá, grátis, chamar direto.
**Words to avoid:** "match"/"curtida" (não é app de namoro), "algoritmo"/"IA", "inquilino" (para o lado do estudante), jargão imobiliário, "verificado" sem qualificar (ver Proof Points).
**Glossary:**
| Term | Meaning |
|------|---------|
| Racha / rachar | Dividir o aluguel (origem do nome RachaAi) |
| Vaga | Um quarto/lugar disponível num apê compartilhado |
| Procurar vaga | Capacidade da conta de quem busca lugar (nunca paga) |
| Anunciar | Capacidade de quem publica vaga ou imóvel inteiro |
| Compatibilidade | % calculada pelos hábitos de convivência dos dois perfis |
| Anúncio extra | Anúncio pago a partir do 4º ativo, vale 30 dias |
| Destaque | Anúncio pago que aparece no topo da busca por 30 dias |
| Convívio | Registro de que duas pessoas moraram juntas, base das avaliações |

## Brand Voice
**Tone:** Descontraído, próximo, de universitário para universitário — sem ser infantil.
**Style:** Direto e curto; pergunta concreta ("Fuma? Tem pet?"); emojis com moderação em redes sociais; números concretos (92%, 3 grátis).
**Personality:** Amigável, prático, local, confiável, leve.

## Proof Points
**Metrics:** **[nenhuma ainda — produto em pré-lançamento]**
**Customers:** **[nenhum ainda]**
**Testimonials:**
> **[coletar]**
**Value themes:**
| Theme | Proof |
|-------|-------|
| Combina antes de chamar | % de compatibilidade em cada anúncio, por hábitos |
| Grátis para quem procura | Regra de cobrança: só anunciante paga |
| Local | Filtro por bairro/mapa de Maringá |
| Segurança | CPF no cadastro, avaliações de convívio, bloqueio/denúncia, vagas por sexo |

⚠️ **Cuidado com "Perfil verificado por CPF"** (usado na landing e no story): o sistema só confere os dígitos do CPF e se é único, não consulta nenhuma base. Preferir "cadastro com CPF" ou "um CPF por conta" até haver verificação real.

## Goals
**Business goal:** Lançar em Maringá e atingir liquidez no marketplace (anúncios suficientes para quem procura achar vaga) antes dos picos de jan/fev e julho. **[confirmar metas]**
**Conversion action:** Criar conta grátis (e completar o perfil de hábitos); para anunciantes, publicar o primeiro anúncio.
**Current metrics:** **[preencher]**

## Changelog
*Newest first. One line per revision: what changed and why.*
- v1 (2026-10-04) — Initial context, auto-drafted from README, landing, onboarding, billing docs and Instagram captions.
