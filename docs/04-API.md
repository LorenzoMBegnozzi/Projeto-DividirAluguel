# API REST

Base: `http://localhost:8081/api` (pelo Nginx) ou `http://localhost:8080/api` (direto no
backend). Documentação interativa (Swagger UI): http://localhost:8080/swagger-ui.html

- Formato: JSON, com acentos em UTF-8. Upload de foto é `multipart/form-data` (campo `file`).
- **A API usa nomes em inglês** (`renter`, `listing`, `TEM_VAGA`...) nos campos; só o banco é em português.
  Algumas rotas mais novas têm nome em português (`/notificacoes`, `/bloqueios`, `/convivios`...).
- Autenticação: enviar `Authorization: Bearer <token>` em tudo, **exceto** `/api/auth/**`,
  `GET /api/users/{id}/foto` e `GET /api/listings/{id}/fotos/{photoId}` (as imagens são públicas
  porque a tag `<img>` do navegador não envia o token). O token vem do cadastro/login e vale 24 h.
- **Capacidades da conta:** `renter` (procura vaga) e `advertiser` (anuncia). Uma conta pode ter
  as duas ao mesmo tempo; o usuário devolvido pela API traz os dois campos booleanos.

## Erros

Formato único:

```json
{ "timestamp": "2026-09-20T21:40:39Z", "status": 402, "error": "Payment Required",
  "message": "Você já usa os 3 anúncios grátis. Compre um anúncio extra para publicar outro." }
```

| Código | Quando |
|---|---|
| 400 | dados inválidos, corpo malformado, regra de negócio simples |
| 401 | sem token, token inválido ou e-mail/senha errados |
| 402 | precisa comprar um anúncio extra para publicar |
| 403 | sua conta não pode fazer isso (sem a capacidade exigida, vaga restrita a outro sexo...) |
| 404 | não existe ou não é seu |
| 409 | conflito (e-mail ou CPF já cadastrado, pagamento já processado, operação simultânea) |

## Autenticação

| Método e rota | Corpo | Resposta |
|---|---|---|
| `POST /api/auth/register` | `name`, `email`, `password` (mín. 8), `birthDate` (`AAAA-MM-DD`, 18+), `cpf` (11 dígitos válidos, único), `role` (`RENTER` ou `ADVERTISER`: a capacidade inicial), `advertiserKind` (`VAGA`/`ESTABELECIMENTO`, só para `ADVERTISER`) | `{ token, user }` |
| `POST /api/auth/login` | `email`, `password` | `{ token, user }` |
| `POST /api/auth/esqueci-senha` | `{ "email" }` | sempre a mesma mensagem genérica, exista a conta ou não. Se existir, **envia um e-mail** com o link `/redefinir-senha/<token>` (válido por 30 min). O token nunca volta na resposta |
| `POST /api/auth/redefinir-senha` | `{ "token", "newPassword" }` (mín. 8) | 204. O token é de uso único; reusar dá 400 |

## Usuário e perfil

| Método e rota | Descrição |
|---|---|
| `GET /api/users/me` | dados do usuário logado, com o perfil |
| `PUT /api/users/me/profile` | salva o perfil (ver abaixo) |
| `GET /api/users/{id}` | perfil público de alguém |
| `POST /api/users/me/aceitar-termos` | registra o aviso de segurança aceito |
| `POST /api/users/me/alugar` | **liga** a capacidade de procurar vaga na conta atual (sem criar outra conta) |
| `POST /api/users/me/anunciar` | liga a capacidade de anunciar. Corpo `{ "advertiserKind": "VAGA" }` (ou `ESTABELECIMENTO`) |
| `POST /api/users/me/foto` | envia/troca a foto de perfil (JPEG, PNG ou WEBP, até 3 MB) |
| `DELETE /api/users/me/foto` | remove a foto |
| `GET /api/users/{id}/foto` | a imagem (público) |

`PUT /api/users/me/profile` — corpo: `gender` (`MASCULINO`/`FEMININO`/`OUTRO`), `smokingHabit`,
`drinkingHabit`, `diet` (`VEGETARIANO`, `VEGANO`, `OUTRO`...) e `dietOther` (texto, só vale com
`diet = OUTRO`), `petPreferences` (lista), `allergyTags` (lista) e `allergyOther`, `musicTaste`,
`routine` (`DIURNO`/`NOTURNO`/`MISTO`), `bio`, `occupation`. **Substitui o perfil inteiro:** campo
não enviado vira vazio. As opções de cada lista estão em `frontend/src/constants/profileOptions.ts`.

## Anúncios

| Método e rota | Descrição |
|---|---|
| `GET /api/listings/mine` | meus anúncios ativos |
| `GET /api/listings/{id}` | um anúncio (qualquer usuário logado) |
| `POST /api/listings` | cria anúncio (só quem tem `advertiser`) |
| `DELETE /api/listings/{id}` | dono: remove (desativa) o anúncio |
| `POST /api/listings/{id}/indisponivel` | dono: marca como indisponível. Corpo `{ "closedWithUserId": 7 }` (opcional; precisa ser alguém que conversou sobre o anúncio) |
| `POST /api/listings/{id}/disponivel` | dono: volta a disponível |
| `GET /api/listings/{id}/contatos-chat` | dono: quem conversou sobre o anúncio |
| `GET /api/listings/{id}/fotos` | lista as URLs das fotos, na ordem |
| `POST /api/listings/{id}/fotos` | dono: adiciona uma foto (até 6 por anúncio; JPEG/PNG/WEBP até 3 MB) |
| `GET /api/listings/{id}/fotos/{photoId}` | a imagem (público) |
| `DELETE /api/listings/{id}/fotos/{photoId}` | dono: remove a foto |

`POST /api/listings` — corpo: `type` (`TEM_VAGA` ou `ESTABELECIMENTO`, à escolha de quem
anuncia, qualquer que seja o `advertiserKind` da conta), `title`, `description`,
`preferredNeighborhood`, `price`, `address`, `latitude`, `longitude`, e conforme o tipo:

- `TEM_VAGA`: `availableSlots` (vagas disponíveis, ≥ 1) e `genderPreference`
  (`QUALQUER`, `MASCULINO` ou `FEMININO`: quem pode ocupar a vaga).
- `ESTABELECIMENTO`: `acceptsPets` e `acceptsSmoker`.

`address`, `latitude` e `longitude` são obrigatórios (o pino no mapa).

- **Limite grátis:** até 3 anúncios grátis ativos por conta. Do 4º em diante é preciso ter um
  crédito de anúncio extra pago; sem ele a resposta é **402**. Com crédito, o anúncio nasce
  com `expiresAt` (validade) e o crédito é consumido.

Campos extras da resposta de anúncio: `highlighted`, `highlightedUntil`, `expiresAt` (só em
anúncio extra), `available`, `dealClosedWithUserId`/`dealClosedWithUserName`.

## Busca (só quem tem `renter`)

Ordem: anúncios em **destaque primeiro**, depois maior compatibilidade. A compatibilidade
depende só dos perfis; **local e orçamento são filtros, não entram na porcentagem**.

| Método e rota | Descrição |
|---|---|
| `GET /api/browse/roommates` | vagas para dividir (`TEM_VAGA`); compatibilidade entre os perfis de hábitos. **Vagas restritas a um sexo só aparecem para quem tem esse sexo no perfil** (quem não informou vê só as "tanto faz") |
| `GET /api/browse/establishments` | imóveis inteiros; compatibilidade entre o seu perfil e o que o dono aceita |

Filtros opcionais nas duas rotas (query string):

| Parâmetro | Efeito |
|---|---|
| `bairro` | texto: bate com o bairro do anúncio (ou faculdade, em anúncios antigos), ignorando maiúsculas e zero à esquerda ("Zona 07" = "Zona 7") |
| `lat` + `lng` | busca **por perto**: anúncios num raio de **3 km** do ponto. Quando enviados, têm prioridade sobre `bairro` |
| `precoMax` | preço máximo |

Cada item: `{ user, listing, compatibilityScore }` (0 a 100). Anúncios de pessoas bloqueadas
(nos dois sentidos) não aparecem.

## Conversas

Iniciar uma conversa não precisa de "curtida" nem de aprovação.

| Método e rota | Descrição |
|---|---|
| `POST /api/conversations` | quem tem `renter`. Corpo `{ "listingId": 12 }`; cria ou reabre a conversa com o dono. Dá 403 se a vaga for restrita a outro sexo |
| `POST /api/conversations/interessados` | corpo `{ "listingId", "otherUserId" }`: conversa entre duas pessoas que se interessaram pelo mesmo estabelecimento |
| `GET /api/conversations` | minhas conversas (como inquilino, como dono do anúncio ou como interessado) |
| `GET /api/conversations/{id}` | uma conversa |
| `GET /api/conversations/{id}/messages` | mensagens em ordem |
| `POST /api/conversations/{id}/messages` | corpo `{ "content": "texto" }` |

## Interesse em estabelecimentos

| Método e rota | Descrição |
|---|---|
| `GET /api/listings/{id}/interest` | `{ interested, total }`. O `total` **inclui você** |
| `POST /api/listings/{id}/interest` | "Tenho interesse" (só `renter`) |
| `DELETE /api/listings/{id}/interest` | retira o interesse |
| `GET /api/listings/{id}/interest/people` | quem mais se interessou (só para quem já se interessou ou é o dono) |

## Convívios e avaliações

Só quem morou junto avalia. Ver o modelo em [03-BANCO-DE-DADOS.md](03-BANCO-DE-DADOS.md).

| Método e rota | Descrição |
|---|---|
| `POST /api/convivios` | propõe: `{ "outroUsuarioId", "periodoInicio", "periodoFim" }` |
| `GET /api/convivios` | meus convívios |
| `POST /api/convivios/{id}/confirmar` / `.../recusar` | a outra pessoa responde |
| `POST /api/avaliacoes` | `{ "convivioId", "notaPontualidade", "notaConvivencia", "comentario" }` (notas de 1 a 5) |
| `GET /api/usuarios/{id}/avaliacoes` | avaliações recebidas por alguém |
| `GET /api/usuarios/{id}/avaliacoes/resumo` | `{ total, mediaPontualidade, mediaConvivencia }` |

## Notificações, bloqueios e denúncias

| Método e rota | Descrição |
|---|---|
| `GET /api/notificacoes` | minhas notificações |
| `GET /api/notificacoes/nao-lidas` | quantidade de não lidas |
| `POST /api/notificacoes/{id}/lida` / `POST /api/notificacoes/lidas` | marca uma / todas como lidas |
| `POST /api/bloqueios` | `{ "bloqueadoId" }` |
| `GET /api/bloqueios` | quem eu bloqueei |
| `DELETE /api/bloqueios/{bloqueadoId}` | desbloqueia |
| `POST /api/denuncias` | `{ "denunciadoId", "motivo", "descricao", "conversaId" }` |

## Cobrança (só quem tem `advertiser`)

Detalhes das regras em [06-COBRANCA.md](06-COBRANCA.md).

| Método e rota | Descrição |
|---|---|
| `GET /api/billing/plan` | regras e preços, quantos grátis estão em uso, créditos disponíveis e se está em modo simulado |
| `GET /api/billing/payments` | meu histórico de compras |
| `POST /api/billing/payments` | cria uma compra `PENDENTE`. Corpo `{ "type": "ANUNCIO_EXTRA" }` ou `{ "type": "DESTAQUE", "listingId": 12 }` |
| `POST /api/billing/payments/{id}/simulate` | confirma a compra sem cobrar. **Só existe com `BILLING_MODE=SIMULADO`**; nos outros modos responde 403 |

Exemplo de `GET /api/billing/plan`:

```json
{ "freeListings": 3, "freeListingsUsed": 3, "extraCredits": 0,
  "extraListingPrice": 19.90, "extraListingDays": 30,
  "highlightPrice": 14.90, "highlightDays": 30, "simulatedMode": true }
```

## Exemplo rápido com curl

```bash
# 1) login
curl -s -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"rita.alugar@teste.com","password":"senha123"}'

# 2) usar o token retornado
curl -s "http://localhost:8081/api/browse/roommates?bairro=zona%207" -H "Authorization: Bearer COLE_O_TOKEN"
```

No Windows, o `curl` estraga acentos passados direto na linha de comando. Envie o corpo
por arquivo ou por entrada padrão (`--data-binary @arquivo.json`); o script
`scripts/seed-demo.sh` já faz isso.
