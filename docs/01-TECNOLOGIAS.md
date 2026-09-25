w# Tecnologias, ferramentas e versões

Este documento lista tudo que o RachaAi usa, com a versão exata. As versões foram
conferidas no projeto (arquivos `pom.xml`, `package.json`, `Dockerfile`,
`docker-compose.yml`) e nos programas instalados, não estimadas.

> Onde aparece "declarada", é a faixa que está no arquivo de dependências. Onde aparece
> "instalada", é a versão que de fato foi resolvida e está rodando.

## 1. Visão geral da arquitetura

```
Navegador ──> Nginx (container "frontend", porta 8081)
                 ├─ serve o site (React compilado)
                 └─ /api/*  ──proxy──>  Backend Spring Boot (container "backend", porta 8080)
                                              └─ JDBC ──>  Oracle XE (container "db", porta 1522 no seu PC)
```

Três containers Docker, definidos em `docker-compose.yml`.

## 2. Banco de dados

| Item | Versão / valor | Onde é definido |
|---|---|---|
| Oracle Database Express Edition | **21c (21.3.0.0.0)** | imagem Docker |
| Imagem Docker do Oracle | `gvenzl/oracle-xe:21-slim-faststart` (~1,2 GB) | `docker-compose.yml` |
| Conjunto de caracteres | AL32UTF8 (aceita acentos) | padrão da imagem |
| Nome do serviço | `XEPDB1` (banco plugável) | padrão da imagem |
| Porta no seu PC | **1522** (dentro do Docker é 1521) | `docker-compose.yml` |
| Usuário / schema da aplicação | `rachaai` (criado pelo container a partir do `.env`) | `.env` |
| Migrations | Flyway **10.10.0** (`flyway-core` + `flyway-database-oracle`) | `pom.xml` |
| Driver JDBC | **ojdbc11 21.6.0.0.1** (fixado de propósito, veja abaixo) | `pom.xml` |
| Pool de conexões | HikariCP 5.1.0 | vem com o Spring Boot |

**Por que o driver está fixado em 21.6:** a série 23.x do driver tem um bug
(`ORA-18716`) ao ler e gravar datas Java (`LocalDate`) contra o Oracle 21c. Não suba a
versão sem testar o cadastro de usuário (que grava a data de nascimento).

## 3. Backend

| Item | Versão | Observação |
|---|---|---|
| Linguagem | **Java 21 (LTS)** | imagem `eclipse-temurin:21-jdk` (build) e `21-jre` (execução); JDK local usado no desenvolvimento: 21.0.11 |
| Framework | **Spring Boot 3.3.13** | linha 3.3.x, madura e estável |
| Spring Framework | 6.1.21 | |
| Spring Web MVC | 6.1.21 | API REST |
| Spring Data JPA | 3.3.13 | acesso ao banco |
| Hibernate ORM | 6.5.3.Final | implementação do JPA |
| Spring Security | 6.3.10 | autenticação e autorização |
| JWT | JJWT **0.13.0** (`jjwt-api`, `-impl`, `-jackson`) | tokens de login, assinatura HMAC |
| Validação | Hibernate Validator 8.0.2.Final / Jakarta Validation 3.0.2 | |
| Servidor embutido | Apache Tomcat 10.1.42 | |
| JSON | Jackson 2.17.3 | |
| Documentação da API | springdoc-openapi **2.6.0** (Swagger UI) / swagger-core 2.2.22 | `/swagger-ui.html` |
| Logs | SLF4J 2.0.17 + Logback 1.5.18 | |
| Build | **Maven 3.9.16** (via Maven Wrapper `mvnw`, não precisa instalar) | `.mvn/wrapper/maven-wrapper.properties` |
| Testes | JUnit Jupiter 5.10.5, Mockito 5.11.0, Spring Security Test | |
| Banco dos testes | H2 2.2.224 (em memória, só no teste) | não é usado em produção |
| Hash de senha | BCrypt (`BCryptPasswordEncoder`) | |
| E-mail | Spring Boot Mail (`spring-boot-starter-mail`, Jakarta Mail) | envia o e-mail de "esqueci minha senha" por SMTP; `@Async` ligado |
| Lombok | 1.18.38 | declarado no `pom.xml`, mas **não é usado** no código |

Estrutura de pacotes (`backend/src/main/java/com/rachaai`): `auth`, `user`, `listing`,
`match`, `conversation`, `chat`, `interest`, `rating`, `notification`, `moderation`, `billing`,
`security`, `config`, `common`.

## 4. Frontend

| Item | Declarada | Instalada | Para que serve |
|---|---|---|---|
| React | ^19.2.8 | **19.3.0** | biblioteca de interface |
| React DOM | ^19.2.8 | 19.3.0 | |
| TypeScript | ~6.0.2 | **6.0.3** | tipagem |
| Vite | ^8.3.0 | **8.3.0** | servidor de desenvolvimento e build |
| `@vitejs/plugin-react` | ^6.1.1 | 6.1.1 | |
| React Router (`react-router-dom`) | ^7.18.4 | **7.18.4** | rotas |
| Axios | ^1.20.0 | **1.20.0** | chamadas HTTP à API |
| Tailwind CSS | ^4.3.3 | **4.3.3** | estilos (v4, configurado via CSS) |
| `@tailwindcss/vite` | ^4.3.3 | 4.3.3 | |
| lucide-react | ^1.47.0 | **1.47.0** | ícones (no lugar de emojis) |
| Leaflet | ^1.9.4 | **1.9.4** | mapa |
| react-leaflet | ^5.0.0 | **5.0.0** | Leaflet para React |
| Mapa (tiles) | OpenStreetMap | | gratuito, sem chave de API |
| Busca de endereço | Nominatim (OpenStreetMap) | | sugestões de bairro/endereço em Maringá, chamada direto do navegador, sem chave (limite de ~1 requisição por segundo, por isso há espera entre as teclas) |
| oxlint | ^1.81.0 | 1.83.0 | verificação de código (`npm run lint`) |
| Node.js (build no Docker) | | imagem `node:20-alpine` | |
| Node.js / npm (seu PC) | | v24.12.0 / 11.6.2 | só necessário para rodar o front fora do Docker |

## 5. Infraestrutura e ferramentas de execução

| Ferramenta | Versão | Para que serve |
|---|---|---|
| Docker Engine | **29.5.0** | roda os containers |
| Docker Compose | **v5.1.3** | sobe os 4 containers de uma vez |
| Mailpit | `axllent/mailpit` | servidor de e-mail **de teste** (captura os e-mails; caixa em http://localhost:8025). Só para desenvolvimento |
| Nginx | `nginx:1.27-alpine` | serve o front e faz proxy de `/api` para o backend |
| Windows | 11 Home (10.0.26200) | sistema do computador de desenvolvimento |
| WSL | **2.7.3.0** (kernel 6.6.114.1-1) | Linux dentro do Windows, onde o Docker roda |
| Distribuição Linux no WSL | Ubuntu 26.04 LTS | |
| SQL Developer (opcional) | qualquer versão recente | ver e consultar o banco |
| Git Bash ou WSL (opcional) | | para rodar o script `scripts/seed-demo.sh` |

## 6. Portas usadas

| Porta | Serviço | Endereço |
|---|---|---|
| 8081 | Frontend (Nginx) | http://localhost:8081 |
| 8080 | Backend / API / Swagger | http://localhost:8080 e `/swagger-ui.html` |
| 1522 | Oracle XE | `localhost:1522`, serviço `XEPDB1` |
| 8025 | Mailpit (caixa de e-mails de teste) | http://localhost:8025 |
| 5173 | Frontend em modo desenvolvimento (Vite), só se rodar fora do Docker | http://localhost:5173 |

## 7. Configurações por variável de ambiente

Todas têm valor padrão de desenvolvimento em `backend/src/main/resources/application.yml`
e podem ser trocadas no arquivo `.env` (raiz do projeto).

| Variável | Padrão | Descrição |
|---|---|---|
| `DB_URL` | `jdbc:oracle:thin:@localhost:1522/XEPDB1` | conexão com o Oracle (no Docker vira `@db:1521/XEPDB1`) |
| `DB_USER` / `DB_PASSWORD` | `rachaai` / (do `.env`) | usuário e senha da aplicação no banco |
| `ORACLE_PASSWORD` | (do `.env`) | senha do SYS/SYSTEM do Oracle (administração) |
| `JWT_SECRET` | valor de desenvolvimento | segredo dos tokens; **troque em produção**; precisa ser Base64 |
| `JWT_EXPIRATION_MINUTES` | 1440 (24 h) | validade do login |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | origens permitidas |
| `BILLING_MODE` | `SIMULADO` | `SIMULADO` ou outro valor (ver [06-COBRANCA.md](06-COBRANCA.md)) |
| `FREE_LISTINGS` | 3 | anúncios grátis por conta |
| `EXTRA_LISTING_PRICE` / `EXTRA_LISTING_DAYS` | 19.90 / 30 | preço e validade do anúncio extra |
| `HIGHLIGHT_PRICE` / `HIGHLIGHT_DAYS` | 14.90 / 30 | preço e duração do destaque |
| `EXPIRATION_CHECK` | `PT10M` | de quanto em quanto tempo o sistema desativa anúncios extras vencidos |
| `APP_BASE_URL` | `http://localhost:8081` | endereço público do site, usado nos links enviados por e-mail |
| `MAIL_HOST` / `MAIL_PORT` | `mailpit` (no Docker) / `1025` | servidor SMTP. Para e-mail real: `smtp.gmail.com` / `587` |
| `MAIL_USER` / `MAIL_PASSWORD` | vazio | login do SMTP (no Gmail: a **senha de app**, nunca a senha da conta) |
| `MAIL_AUTH` / `MAIL_STARTTLS` | `false` / `false` | `true` nos dois para provedores reais |
| `MAIL_FROM` | `RachaAi <nao-responda@rachaai.local>` | remetente que aparece no e-mail |
