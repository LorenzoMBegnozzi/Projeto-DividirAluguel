# Arquitetura

## O produto

O RachaAi liga pessoas que querem dividir aluguel (ou alugar um imóvel) em Maringá. Cada
conta escolhe **uma vez**, no cadastro, um de dois papéis:

| Papel na tela | Papel no código | O que faz |
|---|---|---|
| **Quero alugar** | `RENTER` / banco `ALUGAR` | descreve o que procura, navega pelos anúncios ordenados por compatibilidade e puxa conversa |
| **Quero anunciar** | `ADVERTISER` / banco `ANUNCIAR` | publica vaga para dividir ou imóvel inteiro, compra anúncio extra e destaque, recebe conversas |

O menu de cada papel mostra só o que interessa a ele:

- **Alugar:** Buscar, Minha busca, Conversas, Meu perfil.
- **Anunciar:** Meus anúncios, Pagamentos, Conversas, Meu perfil.

Não há "curtida" nem "match": a lista já vem ordenada por compatibilidade e quem aluga
clica em **Conversar** para abrir o chat direto.

## Visão de containers

```
                    ┌────────────────────── Docker Compose ──────────────────────┐
 Navegador ──8081──>│ frontend (Nginx)                                            │
                    │   ├─ arquivos do React compilado                            │
                    │   └─ /api/*  ── proxy ──> backend (Spring Boot, :8080)      │
                    │                               └─ JDBC ─> db (Oracle XE 21c) │
                    └────────────────────────────────────────────────────────────┘
```

O navegador só conversa com o Nginx; o front chama `/api/...` no mesmo endereço, então não há
problema de CORS em produção. Em desenvolvimento (Vite, porta 5173) o Vite faz esse proxy.

## Backend (Spring Boot)

Organizado **por assunto**, não por camada técnica. Cada pacote de `com.rachaai` tem suas
entidades, repositório, serviço, controller e DTOs.

```
com.rachaai
├── auth/          cadastro e login (retorna JWT)
├── user/          usuário, perfil de hábitos, papel (Role), conversor do papel
├── listing/       anúncios (3 tipos), cota grátis, expiração dos extras
├── match/         compatibilidade e busca ordenada (DiscoveryService)
├── conversation/  conversa entre inquilino e dono do anúncio
├── chat/          mensagens
├── billing/       pagamentos: anúncio extra e destaque
├── security/      JWT, filtro, UserDetails
├── config/        SecurityConfig, OpenApiConfig
└── common/        erros, conversor Sim/Não
```

Fluxo de uma requisição:

```
Controller (HTTP, validação, quem é o usuário logado)
   -> Service (regra de negócio, transação)
      -> Repository (Spring Data JPA)
         -> Entity (mapeada para tabela em português)
```

Os controllers **não devolvem entidades**: usam DTOs (`record`), para não vazar campos
internos e evitar problemas de carregamento preguiçoso do Hibernate.

### Segurança

- **Login:** `POST /api/auth/login` confere e-mail e senha e devolve um **JWT** (validade 24 h).
- **Senhas** guardadas com **BCrypt**; nunca em texto puro.
- Todas as rotas exigem `Authorization: Bearer <token>`, exceto `/api/auth/**` e o Swagger.
- Sem sessão no servidor (stateless); CSRF desligado, por ser API com token.
- **Regras por papel** são conferidas **no backend** (não só escondendo botão): por exemplo, quem
  aluga não consegue criar `TEM_VAGA` nem comprar destaque (403), quem anuncia não consegue
  navegar (403). Cada usuário só vê e mexe no que é dele (anúncio, pagamento, conversa).
- O segredo do JWT vem de variável de ambiente (`JWT_SECRET`); o valor padrão de
  desenvolvimento **não deve ser usado em produção**.

### Compatibilidade (0 a 100)

Implementada em `match/CompatibilityCalculator.java`. Itens sem dado dos dois lados não entram
na conta (não penaliza quem ainda não preencheu o perfil). Sem nenhum dado, o resultado é 50.

**Vaga para dividir (`TEM_VAGA`)** compara os dois perfis:

| Critério | Peso | Regra |
|---|---|---|
| Fuma | 10 | iguais = pontos |
| Bebe | 10 | iguais = pontos |
| Vegetariano | 15 | iguais = pontos |
| Animais | 20 | conflito (um tem pet e o outro não gosta de animais) = 0; os dois gostam = 100% do peso; senão 60% |
| Rotina | 10 | diurno/noturno/misto iguais |
| Música | 15 | sobreposição das palavras (índice de Jaccard) |
| Localização | 20 | bairro/faculdade em comum entre a busca de quem aluga e o anúncio |

**Imóvel inteiro (`ESTABELECIMENTO`)** compara o hábito de quem procura com o que **o dono
declarou aceitar**:

| Critério | Peso | Regra |
|---|---|---|
| Fumante | 40 | serve se o dono aceita fumante **ou** a pessoa não fuma |
| Pet | 40 | serve se o dono aceita pet **ou** a pessoa não tem pet |
| Localização | 20 | bairro/faculdade em comum |

### Ordem na busca

`DiscoveryService`: primeiro os anúncios **em destaque** (pagos, ainda válidos), depois o resto;
dentro de cada grupo, maior compatibilidade primeiro.

### Cobrança

Regras em [06-COBRANCA.md](06-COBRANCA.md). Resumo do desenho:

- **3 grátis:** `ListingService.create` conta os anúncios ativos **sem validade**. Se já são 3,
  exige um crédito.
- **Crédito de anúncio extra:** é uma linha de `pagamentos` paga e com `anuncio_id` nulo.
  `BillingService.consumeExtraCredit` liga o crédito ao anúncio recém-criado e define `expira_em`.
  Uma coluna `versao` (bloqueio otimista) impede gastar o mesmo crédito duas vezes.
- **Destaque:** ao confirmar, `destaque_ate` do anúncio recebe agora (ou o destaque atual) + 30
  dias.
- **Expiração:** `ListingExpirationJob` (tarefa agendada, a cada 10 min) desativa anúncios extras
  vencidos.
- **Gateway de pagamento:** ainda não integrado; há um modo simulado. Como ligar um Pix real está
  descrito no documento de cobrança.

### Tratamento de erros

`GlobalExceptionHandler` converte tudo em um JSON único (`status`, `error`, `message`). Erros
inesperados são registrados no log com o stack trace e a resposta ao cliente é genérica (500).
Conflito de operação simultânea vira 409.

### Banco e migrations

Ver [03-BANCO-DE-DADOS.md](03-BANCO-DE-DADOS.md). Resumo: o schema só muda por migrations do
Flyway; o Hibernate apenas valida. O código é em inglês, o banco em português, ligados por
`@Table`/`@Column` e por dois conversores JPA.

## Frontend (React + TypeScript)

```
frontend/src
├── api/          clientes HTTP tipados (axios): auth, perfil, anúncios, busca/conversas, cobrança
├── context/      AuthContext: usuário logado e token
├── components/   NavBar, rotas protegidas por papel (RoleRoute), mapa, ícones (Fact), toggles
├── pages/        uma página por tela
├── types/        tipos que espelham a API
└── utils/        formatação de dinheiro e datas (pt-BR)
```

Telas: `/registro` (com a escolha "alugar/anunciar"), `/login`, `/perfil`, `/anuncio`
("Minha busca" ou "Meus anúncios", conforme o papel), `/browse` (só alugar), `/pagamentos` (só
anunciar), `/conversas` e `/conversas/:id`.

- O token JWT fica no `localStorage` e é enviado em toda chamada (interceptor do axios). Resposta
  401 desloga e leva ao login.
- `RoleRoute` redireciona quem abre por URL uma tela que não é do seu papel; o backend continua
  sendo a autoridade (devolve 403).
- **Mapa:** Leaflet com tiles do OpenStreetMap (grátis, sem chave). O pino do imóvel é marcado
  clicando no mapa ao criar o anúncio.
- **Estilo:** Tailwind CSS v4 (configurado no `index.css`, sem `tailwind.config.js`).
- **Ícones:** lucide-react. Não usamos emojis.

## Decisões de projeto e limitações

- **Sem fotos** de perfil ou de imóvel nesta versão (extensão natural para depois).
- **Sem integração** com sites de imóveis; todo anúncio é cadastrado por quem anuncia.
- **Papel da conta é fixo.** Trocar de papel exige outra conta.
- **Chat por consulta periódica** (a tela busca mensagens novas a cada 4 s), sem WebSocket.
- **Sem confirmação de e-mail** nem recuperação de senha.
- **Pagamento simulado** até integrar um gateway (ver cobrança).
- **Anúncio extra não renova sozinho** nem tem reembolso.
