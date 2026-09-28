# Ambientes: dev, homolog e prod

O RachaAi tem três ambientes **isolados**. Cada um tem o seu banco Oracle, o seu backend, o seu
site, as suas senhas e os seus dados. Mexer em um não afeta os outros.

| Ambiente | Para quê | Onde roda | Dados |
|---|---|---|---|
| **dev** | desenvolver e testar no dia a dia | seu PC | de exemplo (`seed`), pode apagar à vontade |
| **homolog** | homologação: testar a versão **antes** de ir para produção | seu PC ou um servidor de testes | de exemplo, recriáveis |
| **prod** | usuários reais | **um servidor** (não o PC de desenvolvimento) | reais: fazer backup, nunca apagar |

## 1. A variável `AMBIENTE`: uma troca só

**Para escolher o ambiente, você só muda a variável `AMBIENTE`** (`dev`, `homolog` ou `prod`).
Todo o resto (porta do banco, senhas, endereço da API, perfil do Spring) sai do arquivo
`.env.<ambiente>` na raiz do projeto.

| Onde | Como definir | O que ela decide |
|---|---|---|
| Terminal PowerShell | `$env:AMBIENTE = "homolog"` | vale para os comandos seguintes nesse terminal |
| Git Bash | `export AMBIENTE=homolog` | idem |
| Windows inteiro | `setx AMBIENTE homolog` (abra de novo terminal e IDE depois) | vale para tudo, inclusive a IDE |
| Eclipse | *Run Configurations → Environment →* `AMBIENTE` = `homolog` | só o backend rodando no Eclipse |

Sem `AMBIENTE` definida, tudo usa **dev**.

Com ela definida, cada peça aponta sozinha:

| Peça | Comando | Com `AMBIENTE=homolog` vai para |
|---|---|---|
| Docker (sobe o ambiente inteiro) | `.\scripts\ambiente.ps1 up` | o stack `rachaai-homolog` |
| Frontend local | `npm run dev` (pasta `frontend`) | API do homolog (`localhost:8090`) |
| Backend local (IDE / `mvnw`) | rodar normalmente | banco do homolog (`localhost:1532`), senhas e JWT do homolog, perfil `homolog` |

O nome do ambiente no comando do script continua funcionando e passa por cima da variável
(`.\scripts\ambiente.ps1 dev up` sobe o dev, qualquer que seja a `AMBIENTE`).

## 2. Endereços de cada ambiente

| | dev | homolog | prod |
|---|---|---|---|
| Site | http://localhost:8082 | http://localhost:8092 | porta 80 do servidor (`SITE_PORT`) |
| API + Swagger | http://localhost:8080/swagger-ui.html | http://localhost:8090/swagger-ui.html | **fechada** (só via `/api` do site); Swagger desligado |
| Banco Oracle | `localhost:1522` / `XEPDB1` | `localhost:1532` / `XEPDB1` | **fechado** (só o backend acessa) |
| E-mails de teste (Mailpit) | http://localhost:8025 | http://localhost:8035 | não existe: usa SMTP real |
| Pagamento | simulado | simulado | `DESATIVADO` (ver seção 8) |
| Perfil do Spring | `dev` | `homolog` | `prod` |
| Projeto do Compose / volume | `rachaai-dev` / `rachaai-dev_oracle_data` | `rachaai-homolog` / `rachaai-homolog_oracle_data` | `rachaai-prod` / `rachaai-prod_oracle_data` |

As portas de dev e homolog são diferentes para os dois poderem rodar ao mesmo tempo. O site de
dev está na **8082** porque a 8081 costuma estar ocupada pelo Eclipse.

## 3. Como os ambientes são montados

```
docker-compose.yml         ← um só arquivo para os três (portas e senhas vêm do .env)
docker-compose.prod.yml    ← só em prod: fecha as portas da API e do banco
.env.dev   .env.homolog   .env.prod                       ← senhas de cada ambiente (NÃO vão para o Git)
.env.dev.example  .env.homolog.example  .env.prod.example ← modelos (vão para o Git)
backend/src/main/resources/application-{dev,homolog,prod}.yml   ← diferenças no backend
scripts/ambiente.ps1  e  scripts/ambiente.sh   ← atalhos para subir cada ambiente
```

O que separa os ambientes no Docker é o `COMPOSE_PROJECT_NAME` de cada `.env`: o Docker prefixa
os containers, a rede e o volume do banco com ele (`rachaai-dev-backend-1`,
`rachaai-homolog_oracle_data`...).

Diferenças no backend (perfis do Spring):

| | dev | homolog | prod |
|---|---|---|---|
| Swagger | ligado | ligado | **desligado** |
| Log do sistema | `DEBUG` | `INFO` | `INFO` (resto só `WARN`) |
| Segredos sem valor padrão | não (usa o do exemplo) | `JWT_SECRET` | `JWT_SECRET`, `DB_URL`, `DB_USER`, `DB_PASSWORD`: se faltar, **não sobe** |

## 4. Primeira vez: criar o `.env` do ambiente

Cada ambiente precisa do seu arquivo. Copie do modelo e troque as senhas:

```powershell
Copy-Item .env.homolog.example .env.homolog
notepad .env.homolog
```

- Senhas do Oracle (`ORACLE_PASSWORD`, `DB_PASSWORD`): **só letras e números**, começando por letra.
- `JWT_SECRET`: gere um diferente para cada ambiente (`openssl rand -base64 48` no Git Bash).
- Nunca reaproveite as senhas de dev em homolog ou prod.
- **Confirmação de e-mail:** em dev e homolog, contas `@teste.com` (as do `seed`) já nascem confirmadas (`app.email-confirmation.auto-confirm-domain`). Outros e-mails recebem o link no Mailpit. Em prod, todo mundo confirma.
- `MAPTILER_KEY`: chave dos mapas e da busca de endereço (MapTiler). Vazia = OpenStreetMap gratuito. Depois de mudar, reconstrua o frontend (`.\scripts\ambiente.ps1 dev up frontend`).
- `ADMIN_EMAILS`: quem pode abrir a área `/admin` (ver [08-SEGURANCA.md](08-SEGURANCA.md)). Em dev e homolog, `admin@teste.com` (criado pelo `seed`).

Neste PC, o `.env.dev` já foi criado com as senhas do antigo `.env` e o `.env.homolog` com senhas
novas geradas. O `.env.prod` **não** foi criado: ele deve ser montado no servidor de produção.

## 5. Comandos do dia a dia (Docker)

PowerShell, na pasta do projeto (com `$env:AMBIENTE` definida, ou passando o nome):

```powershell
.\scripts\ambiente.ps1 up          # constrói e sobe o ambiente da variável AMBIENTE
.\scripts\ambiente.ps1 dev up      # ... ou diga qual
.\scripts\ambiente.ps1 ps          # o que está rodando
.\scripts\ambiente.ps1 logs        # logs do backend (Ctrl+C para sair)
.\scripts\ambiente.ps1 seed        # cria os dados de exemplo (só dev e homolog)
.\scripts\ambiente.ps1 stop        # para, sem remover nada
.\scripts\ambiente.ps1 down        # para e remove os containers (os DADOS ficam)
```

Git Bash: igual, com `bash scripts/ambiente.sh up` etc. Qualquer outro comando do
`docker compose` também funciona (ex.: `.\scripts\ambiente.ps1 homolog restart backend`).

**Memória:** cada Oracle usa uns 1,5–2 GB de RAM. Deixe ligado só o ambiente que estiver usando
(`.\scripts\ambiente.ps1 homolog stop` quando terminar de testar).

**Apagar o banco de um ambiente** (volta vazio na próxima subida): `.\scripts\ambiente.ps1 homolog down -v`.
Em prod, isso apaga os dados reais. Não faça sem backup.

## 6. Rodar frontend ou backend fora do Docker

### Frontend (`npm run dev`, porta 5173)

O frontend só chama `/api`; o proxy do Vite ([frontend/vite.config.ts](../frontend/vite.config.ts))
manda para o ambiente da `AMBIENTE`:

| `AMBIENTE` | `/api` vai para |
|---|---|
| `dev` (ou vazia) | `http://localhost:<API_PORT do .env.dev>` → 8080 |
| `homolog` | `http://localhost:<API_PORT do .env.homolog>` → 8090 |
| `prod` | `APP_BASE_URL` do `.env.prod` (o site público; a API de prod não tem porta aberta) |

Ao subir, o Vite mostra no terminal para onde está apontando. O proxy remove o cabeçalho
`Origin`, então não precisa mexer no CORS de nenhum ambiente. `API_TARGET=<endereço>` passa por
cima de tudo, se precisar de um endereço avulso. Apontando para prod você usa **dados reais**.

Precisa de **Node 20.19+ ou 22.12+** (o Vite 8 não roda no 20.11).

### Backend (Eclipse, IntelliJ ou `mvnw spring-boot:run`)

Rodando na pasta `backend`, o `application.yml` importa o `../.env.<AMBIENTE>` e tira dele a
porta do banco (`DB_PORT`), as senhas, o `JWT_SECRET` e o perfil (`APP_ENV`). **Não precisa
configurar mais nada além da `AMBIENTE`.**

- Pare o backend do Docker daquele ambiente antes (`.\scripts\ambiente.ps1 homolog stop backend`)
  ou defina `SERVER_PORT=8181` na IDE, para não brigar pela porta 8080.
- Se o `.env.<AMBIENTE>` não existir, o backend **se recusa a subir** (em vez de cair no dev sem
  avisar): `AMBIENTE=prod, mas o perfil ativo é [dev]. Confira se o arquivo .env.prod existe...`
- **Prod: não aponte um backend local para o banco de produção.** O banco de prod não tem porta
  aberta de propósito; com `AMBIENTE=prod` o backend local não conecta. Para investigar algo em
  prod, use os logs no servidor (`bash scripts/ambiente.sh prod logs`) ou o frontend local
  apontando para o site de prod.

## 7. Fluxo de uma mudança

1. **dev:** desenvolve e testa.
2. **homolog:** `.\scripts\ambiente.ps1 homolog up` com o mesmo código. As migrations novas rodam
   no banco do homolog; teste os fluxos que mudaram (guia: [05-GUIA-DE-TESTE-MANUAL.md](05-GUIA-DE-TESTE-MANUAL.md)).
3. **prod:** no servidor, atualize o código (`git pull`) e rode `bash scripts/ambiente.sh prod up`.
   Antes, faça backup do banco.

Migrations que **apagam** dados (ex.: `V27__remove_musica_rotina.sql`, que remove colunas) são
irreversíveis: passam por homolog primeiro e só vão para prod depois de um backup.

## 8. Antes de subir produção de verdade

- [ ] Servidor com Docker, e `.env.prod` preenchido lá (a partir do `.env.prod.example`).
- [ ] Senhas longas e novas; `JWT_SECRET` gerado só para prod.
- [ ] `CORS_ALLOWED_ORIGINS` e `APP_BASE_URL` com o domínio real.
- [ ] HTTPS na frente do site (ex.: Nginx/Caddy com Let's Encrypt, ou o proxy do provedor).
- [ ] SMTP real nas variáveis `MAIL_*`.
- [ ] **Pagamento:** prod fica com `BILLING_MODE=DESATIVADO`, que recusa o botão "Simular pagamento".
  Como ainda não há gateway conectado, compras ficam pendentes até integrar o Pix
  ([06-COBRANCA.md](06-COBRANCA.md)).
- [ ] Backup do banco agendado (ex.: `expdp` do Oracle ou cópia do volume `rachaai-prod_oracle_data`).
- [ ] Mapas: `MAPTILER_KEY` no `.env.prod` e, no painel do MapTiler, a chave liberada só para o domínio do site (Allowed HTTP origins).

## 9. Volumes antigos guardados

- `projeto-dividiraluguel_oracle_data`: o banco de quando havia um ambiente só. Os dados foram
  **copiados** para o dev. Depois de conferir o dev: `docker volume rm projeto-dividiraluguel_oracle_data`.
- `rachaai-qa_oracle_data`: o ambiente se chamava `qa` antes de virar `homolog`; só tinha dados
  de exemplo. Pode apagar: `docker volume rm rachaai-qa_oracle_data`.

O arquivo `.env` antigo não é mais usado.
