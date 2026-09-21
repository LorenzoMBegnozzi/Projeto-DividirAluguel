# API REST

Base: `http://localhost:8081/api` (pelo Nginx) ou `http://localhost:8080/api` (direto no
backend). Documentação interativa (Swagger UI): http://localhost:8080/swagger-ui.html

- Formato: JSON, com acentos em UTF-8.
- **A API usa nomes em inglês** (`role`, `listing`, `RENTER`...); só o banco é em português.
- Autenticação: enviar `Authorization: Bearer <token>` em tudo, **exceto** `/api/auth/**`.
  O token vem do cadastro/login e vale 24 h (configurável).
- Papéis: `RENTER` (na tela: "Quero alugar") e `ADVERTISER` ("Quero anunciar").

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
| 403 | seu papel não pode fazer isso |
| 404 | não existe ou não é seu |
| 409 | conflito (e-mail já cadastrado, pagamento já processado, operação simultânea) |

## Autenticação

| Método e rota | Corpo | Resposta |
|---|---|---|
| `POST /api/auth/register` | `name`, `email`, `password` (mín. 8), `birthDate` (`AAAA-MM-DD`), `role` (`RENTER` ou `ADVERTISER`) | `{ token, user }` |
| `POST /api/auth/login` | `email`, `password` | `{ token, user }` |

## Usuário e perfil

| Método e rota | Papel | Descrição |
|---|---|---|
| `GET /api/users/me` | todos | dados do usuário logado, com o perfil |
| `PUT /api/users/me/profile` | todos | salva hábitos: `smoker`, `drinksAlcohol`, `vegetarian`, `hasPets`, `likesAnimals` (booleanos ou nulo), `allergies`, `musicTaste`, `routine` (`DIURNO`/`NOTURNO`/`MISTO`), `bio`, `occupation` |
| `GET /api/users/{id}` | todos | perfil público de alguém |

## Anúncios

| Método e rota | Papel | Descrição |
|---|---|---|
| `GET /api/listings/mine` | todos | meus anúncios ativos |
| `POST /api/listings` | ver abaixo | cria anúncio |
| `DELETE /api/listings/{id}` | dono | remove (desativa) o anúncio |

`POST /api/listings` — corpo: `type`, `title`, `description`, `preferredNeighborhood`,
`nearCollege`, `price`, `address`, `latitude`, `longitude`, `acceptsPets`, `acceptsSmoker`.

- `type = PROCURANDO`: só `RENTER`. Publicar de novo **substitui** a busca anterior.
  Não tem endereço nem mapa.
- `type = TEM_VAGA` ou `ESTABELECIMENTO`: só `ADVERTISER`. Exigem `address`, `latitude` e
  `longitude`. `acceptsPets`/`acceptsSmoker` valem só para `ESTABELECIMENTO`.
- **Limite grátis:** até 3 anúncios grátis ativos por conta. Do 4º em diante é preciso ter um
  crédito de anúncio extra pago; sem ele a resposta é **402**. Com crédito, o anúncio nasce
  com `expiresAt` (validade) e o crédito é consumido.

Campos extras da resposta de anúncio: `highlighted` (em destaque agora), `highlightedUntil`,
`expiresAt` (só em anúncio extra).

## Busca (só `RENTER`)

Ordem: anúncios em **destaque primeiro**, depois maior compatibilidade.

| Método e rota | Descrição |
|---|---|
| `GET /api/browse/roommates` | vagas para dividir (`TEM_VAGA`); compatibilidade entre os perfis de hábitos |
| `GET /api/browse/establishments` | imóveis inteiros; compatibilidade entre o seu perfil e o que o dono aceita |

Cada item: `{ user, listing, compatibilityScore }` (0 a 100).

## Conversas

Iniciar uma conversa não precisa de "curtida" nem de aprovação.

| Método e rota | Papel | Descrição |
|---|---|---|
| `POST /api/conversations` | `RENTER` | corpo `{ "listingId": 12 }`; cria ou reabre a conversa sobre o anúncio |
| `GET /api/conversations` | todos | conversas em que sou o inquilino ou o dono do anúncio |
| `GET /api/conversations/{id}/messages` | participantes | mensagens em ordem |
| `POST /api/conversations/{id}/messages` | participantes | corpo `{ "content": "texto" }` |

## Cobrança (só `ADVERTISER`)

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
curl -s http://localhost:8081/api/browse/roommates -H "Authorization: Bearer COLE_O_TOKEN"
```

No Windows, o `curl` estraga acentos passados direto na linha de comando. Envie o corpo
por arquivo ou por entrada padrão (`--data-binary @arquivo.json`); o script
`scripts/seed-demo.sh` já faz isso.
