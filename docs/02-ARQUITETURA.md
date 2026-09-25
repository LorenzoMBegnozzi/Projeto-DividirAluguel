# Arquitetura

## O produto

O RachaAi liga pessoas que querem dividir aluguel (ou alugar um imóvel) em Maringá. Cada conta
tem duas **capacidades**, que podem ficar ligadas ao mesmo tempo:

| Na tela | No código | O que faz |
|---|---|---|
| **Procurar vaga** (no cadastro: "Quero alugar") | `renter` / banco `alugar` | navega pelos anúncios ordenados por compatibilidade, filtra por bairro, mapa e orçamento, conversa com anunciantes e demonstra interesse em imóveis |
| **Anunciar** (no cadastro: "Quero anunciar") | `advertiser` / banco `anunciar` | publica vaga para dividir e/ou imóvel inteiro (com fotos), compra anúncio extra e destaque, recebe conversas |

No cadastro a pessoa escolhe uma das duas. Depois, em **Meu perfil > "Quero também..."**, liga a
outra com um clique, **sem criar outra conta**, e o site já leva para a tela nova. O menu mostra
o que a conta pode usar:

- **Procurar:** Buscar, Conversas, Meu perfil.
- **Anunciar:** Meus anúncios, Pagamentos, Conversas, Meu perfil.
- No celular, o menu vira uma barra fixa embaixo (ícone + nome) e há tema claro/escuro.

Não há "curtida" nem "match": a lista já vem ordenada por compatibilidade e quem procura
clica em **Conversar** para abrir o chat direto.

Outras partes do produto:

- **Perfil de hábitos:** sexo, fumo, bebida, alimentação (com "Outro" e texto livre), pets,
  alergias, rotina e música, além de foto de perfil.
- **Vagas por sexo:** quem anuncia uma vaga escolhe "Tanto faz", "Somente homens" ou "Somente
  mulheres"; a vaga só aparece (e só aceita conversa) para quem tem esse sexo no perfil.
- **Convívios e avaliações:** quem morou junto registra o período, o outro confirma e cada um
  pode avaliar (pagamentos em dia e convivência). Fica dentro de **Meu perfil**.
- **Segurança:** aviso de segurança no primeiro acesso, bloqueio e denúncia de usuários.
- **Notificações** no sino do topo e **"esqueci minha senha" por e-mail**.

## Visão de containers

```
                    ┌────────────────────── Docker Compose ──────────────────────┐
 Navegador ──8081──>│ frontend (Nginx)                                            │
                    │   ├─ arquivos do React compilado                            │
                    │   └─ /api/*  ── proxy ──> backend (Spring Boot, :8080)      │
                    │                               ├─ JDBC ─> db (Oracle XE 21c) │
                    │                               └─ SMTP ─> mailpit (e-mails   │
 Navegador ──8025──>│ mailpit: caixa de e-mails de teste       de teste, :1025)   │
                    └────────────────────────────────────────────────────────────┘
```

O navegador só conversa com o Nginx; o front chama `/api/...` no mesmo endereço, então não há
problema de CORS em produção. Em desenvolvimento (Vite, porta 5173) o Vite faz esse proxy.

O **Mailpit** só existe para teste: ele captura os e-mails que o backend envia (por exemplo
o de "esqueci minha senha") e mostra em http://localhost:8025, sem mandar nada para fora.
Em produção, troque as variáveis `MAIL_*` por um provedor real (Gmail com senha de app,
Resend, Brevo...) e tire o Mailpit do compose.

## Backend (Spring Boot)

Organizado **por assunto**, não por camada técnica. Cada pacote de `com.rachaai` tem suas
entidades, repositório, serviço, controller e DTOs.

```
com.rachaai
├── auth/          cadastro, login (JWT), esqueci/redefinir senha
├── user/          usuário, perfil de hábitos, fotos de perfil, capacidades (renter/advertiser)
├── listing/       anúncios (2 tipos), fotos do anúncio, cota grátis, expiração dos extras
├── match/         compatibilidade e busca (DiscoveryService): filtros, por perto, sexo
├── conversation/  conversa com o dono ou entre interessados
├── chat/          mensagens
├── interest/      "tenho interesse" em imóveis inteiros
├── rating/        convívios e avaliações
├── notification/  notificações do sino
├── moderation/    bloqueios e denúncias
├── billing/       pagamentos: anúncio extra e destaque
├── security/      JWT, filtro, UserDetails
├── config/        SecurityConfig, OpenApiConfig
└── common/        erros, conversor Sim/Não, validação de CPF e de imagem, envio de e-mail
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
- **Cadastro:** exige maioridade e **CPF** válido e único (só confere os dígitos, não consulta
  nenhuma base). O CPF nunca volta nas respostas da API.
- **Senhas** guardadas com **BCrypt**; nunca em texto puro.
- **Esqueci minha senha:** gera um token aleatório, guarda só o **hash SHA-256** dele e manda o
  link por e-mail. O token vale 30 minutos, é de uso único e a resposta da API é igual para
  e-mail existente e inexistente (não revela quem tem conta).
- Todas as rotas exigem `Authorization: Bearer <token>`, exceto `/api/auth/**`, o Swagger e as
  duas rotas de **imagem** (`GET /api/users/{id}/foto` e `GET /api/listings/{id}/fotos/{id}`),
  que são públicas porque o `<img>` do navegador não envia o token.
- Sem sessão no servidor (stateless); CSRF desligado, por ser API com token.
- **Regras por capacidade** são conferidas **no backend** (não só escondendo botão): por exemplo,
  quem não tem `advertiser` não cria anúncio nem compra destaque (403), quem não tem `renter` não
  navega nem abre conversa (403). Cada usuário só vê e mexe no que é dele (anúncio, pagamento,
  conversa, fotos).
- **Vaga por sexo** também é conferida no backend: filtra a busca e recusa conversa direta por
  URL (403).
- O segredo do JWT vem de variável de ambiente (`JWT_SECRET`); o valor padrão de
  desenvolvimento **não deve ser usado em produção**.

### Compatibilidade (0 a 100)

Implementada em `match/CompatibilityCalculator.java`. **Depende só dos perfis** (a localização
foi retirada da conta e virou filtro). Itens sem dado dos dois lados não entram na conta (não
penaliza quem ainda não preencheu o perfil). Sem nenhum dado, o resultado é 50.

**Vaga para dividir (`TEM_VAGA`)** compara os dois perfis:

| Critério | Peso | Regra |
|---|---|---|
| Fuma | 10 | iguais = pontos |
| Bebe | 10 | iguais = pontos |
| Vegetariano | 15 | iguais = pontos (quem escolheu "Outro" em alimentação fica de fora) |
| Animais | 25 | conflito (um tem pet e o outro não gosta de animais) = 0; os dois gostam = 100% do peso; senão 60% |
| Rotina | 15 | diurno/noturno/misto iguais |
| Música | 25 | sobreposição das palavras (índice de Jaccard) |

**Imóvel inteiro (`ESTABELECIMENTO`)** compara o hábito de quem procura com o que **o dono
declarou aceitar**:

| Critério | Peso | Regra |
|---|---|---|
| Fumante | 50 | serve se o dono aceita fumante **ou** a pessoa não fuma |
| Pet | 50 | serve se o dono aceita pet **ou** a pessoa não tem pet |

### Busca: filtro e ordem

`DiscoveryService`:

1. **Filtros** decidem *quem aparece*: bairro (texto), **por perto** (ponto no mapa + raio de 3 km,
   distância real pela fórmula de Haversine), orçamento máximo, pessoas bloqueadas e, nas vagas,
   o **sexo** aceito.
2. **Ordem** decide *em que posição*: primeiro os anúncios **em destaque** (pagos, ainda
   válidos), depois maior compatibilidade.

O ponto "por perto" vem de uma sugestão do autocomplete de endereço (Nominatim/OpenStreetMap,
limitado a Maringá) ou de um clique no mapa. Sem ponto, vale o texto do bairro.

### Fotos

Foto de perfil e fotos de anúncio (até 6) ficam **no próprio Oracle**, como BLOB, em tabelas
separadas (o conteúdo só é lido quando a imagem é pedida). Aceita JPEG, PNG ou WEBP de até
3 MB (regra única em `common/PhotoValidator`). É simples de subir, mas engorda o banco: se o
volume crescer, o caminho natural é mover as imagens para um armazenamento de arquivos.

### E-mail

`common/EmailService` envia pelo Spring Mail (SMTP), de forma assíncrona (para o tempo de
resposta não revelar se a conta existe); falha de envio só vai para o log. O endereço do site
usado nos links vem de `APP_BASE_URL`.

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
Flyway (21 até agora); o Hibernate apenas valida. O código é em inglês, o banco em português,
ligados por `@Table`/`@Column` e por conversores JPA.

## Frontend (React + TypeScript)

```
frontend/src
├── api/          clientes HTTP tipados (axios): auth, perfil, anúncios, busca/conversas, cobrança, geocoding
├── context/      AuthContext (usuário e token) e ThemeContext (claro/escuro)
├── components/   NavBar, BottomNav (celular), RoleRoute, mapas, autocomplete de endereço,
│                 fotos (seletor, gerenciador, popup), seções do perfil, modais
├── constants/    listas de opções do perfil (fumo, dieta, sexo...) e seus rótulos
├── pages/        uma página por tela
├── types/        tipos que espelham a API
└── utils/        formatação de dinheiro e datas (pt-BR)
```

Telas: `/login`, `/registro`, `/esqueci-senha`, `/redefinir-senha/:token`, `/perfil` (hábitos,
foto, "Quero também...", convívios e avaliações, bloqueados, sair), `/browse` (Buscar),
`/anuncio` (Meus anúncios e publicar), `/anuncios/:id` (detalhe de um anúncio),
`/pagamentos`, `/conversas`, `/conversas/:id` e `/usuarios/:id` (perfil público).
Rotas antigas como `/convivios` redirecionam para o perfil.

- O token JWT fica no `localStorage` e é enviado em toda chamada (interceptor do axios). Resposta
  401 desloga e leva ao login.
- `RoleRoute` redireciona quem abre por URL uma tela para a qual a conta não tem a capacidade;
  o backend continua sendo a autoridade (devolve 403).
- **Buscar:** duas abas ("Preciso de uma vaga" e "Estabelecimentos"), alternância lista/grade,
  filtros de bairro/faculdade (com autocomplete), botão de marcar ponto no mapa e orçamento máximo.
  Toque na foto abre um popup com as outras fotos embaixo.
- **Mapa e endereço:** Leaflet com tiles do OpenStreetMap; sugestões de bairro/endereço pela
  Nominatim (chamada direto do navegador, com pausa entre as teclas para respeitar o limite de
  uso). Escolher uma sugestão já posiciona o pino, que ainda pode ser ajustado com um clique.
- **Estilo:** Tailwind CSS v4 (configurado no `index.css`, sem `tailwind.config.js`), com
  tema claro e escuro. Ícones: lucide-react. Não usamos emojis.
- O ícone da aba (`public/favicon.svg`) é uma casa dividida ao meio.

## Decisões de projeto e limitações

- **Sem integração** com sites de imóveis; todo anúncio é cadastrado por quem anuncia.
- **Fotos no banco** (BLOB), simples, mas sem redimensionamento nem armazenamento externo.
- **Chat por consulta periódica** (a tela busca mensagens novas a cada 4 s), sem WebSocket;
  o mesmo vale para as notificações.
- **Sem confirmação de e-mail no cadastro.** O e-mail de "esqueci minha senha" só sai para um
  provedor real depois de configurar as variáveis `MAIL_*`; até lá cai no Mailpit.
- **Sem login social** (Google) por enquanto.
- **Denúncias** ficam registradas, mas ainda não há painel de moderação.
- **Só Maringá:** as sugestões de endereço são limitadas à região da cidade.
- **Pagamento simulado** até integrar um gateway (ver cobrança).
- **Anúncio extra não renova sozinho** nem tem reembolso.
- O campo antigo "faculdade próxima" de anúncios não aparece mais no formulário (anúncios
  antigos ainda o exibem).
