# Segurança e administração

Como o RachaAi protege contas e dados, e como funciona a área administrativa.

## 1. Resumo

| Proteção | Como funciona | Onde está |
|---|---|---|
| Rotas protegidas | toda a API exige login (token JWT), menos login/cadastro/fotos | `config/SecurityConfig.java` |
| Área de admin | `/api/admin/**` exige conta administradora (`ROLE_ADMIN`) | `SecurityConfig`, `admin/` |
| Senhas | guardadas com **BCrypt** (hash, não dá para reverter) | `AuthService` |
| Link de "esqueci a senha" | guardado só como hash SHA-256, vale 30 min, uso único | `AuthService` |
| Limite de tentativas | login, cadastro, esqueci/redefinir senha (seção 2) | `security/RateLimiter.java` |
| Logout de verdade | sair, redefinir a senha ou ser bloqueado derruba os tokens já emitidos (seção 3) | `JwtService`, `JwtAuthenticationFilter` |
| Políticas por linha (RLS) | o próprio Oracle filtra as tabelas privadas por usuário (seção 4) | `V29__rls_politicas.sql`, `config/RlsDataSource.java` |
| Conta bloqueada | não entra, perde o login na hora, anúncios somem da busca | `AdminService` |
| Perfil público sem dados privados | perfil de outra pessoa (busca, conversas, interessados, `/usuarios/{id}`) vem **sem e-mail e sem data de nascimento** | `UserResponse.publicFrom` |
| Confirmação de e-mail | link de 24 h no cadastro; sem confirmar não anuncia, não conversa e não demonstra interesse; reenvio até 3/h e invalida os links antigos | `auth/EmailConfirmationService.java` |
| LGPD | termos, privacidade, aceite e exclusão de conta | [09-LGPD.md](09-LGPD.md) |

## 2. Limite de tentativas

Contado na memória do backend, em janela deslizante. Estourou → resposta **429** com a mensagem
"Muitas tentativas. Tente de novo em N minuto(s)."

| O quê | Limite (produção) | Chave |
|---|---|---|
| Erros de senha | 5 a cada 15 min | por e-mail (acertar a senha zera) |
| Tentativas de login | 20 a cada 5 min | por IP |
| Cadastros | 5 por hora | por IP |
| "Esqueci a senha" | 5 por hora por IP e 3 por hora por e-mail | IP e e-mail |
| Redefinir senha (usar o link) | 10 por hora | por IP |

- Os números ficam em `app.rate-limit.*` no `application.yml`. Dev e homolog afrouxam cadastro e
  login por IP (`application-dev.yml`, `application-homolog.yml`) para o `seed` funcionar.
- O IP vem do cabeçalho `X-Real-IP`, que o Nginx do frontend preenche. **Ao colocar um proxy na
  frente (Caddy/Cloudflare) em produção**, configure o Nginx para confiar nele
  (`set_real_ip_from` + `real_ip_header X-Forwarded-For`), senão todo mundo aparece com o IP do
  proxy e divide o mesmo limite.
- Como é em memória: reiniciar o backend zera os contadores; com mais de uma instância do
  backend, trocar por um contador compartilhado (Redis).
- Efeito colateral conhecido: 5 senhas erradas num e-mail travam o login **daquela conta** por
  15 min, mesmo para o dono. É o preço de impedir que adivinhem a senha.

## 3. Sessão: sair derruba o login

Cada conta tem uma **versão de sessão** (`usuarios.versao_token`) que vai dentro do token. Toda
requisição confere: se a versão do token for diferente da atual, ou a conta estiver bloqueada, o
token não vale mais.

A versão sobe (e todos os logins abertos caem, em **todos os aparelhos**) quando a pessoa:
- clica em **Sair** (`POST /api/auth/logout`);
- **redefine a senha** pelo link do e-mail;
- é **bloqueada** por um admin.

## 4. Políticas por linha (RLS / VPD)

No Oracle, RLS se chama **VPD** (Virtual Private Database). O banco acrescenta sozinho um filtro a
toda consulta, alteração e exclusão nas tabelas privadas. Mesmo que o código peça "todas as
notificações" por engano, o banco só devolve as da pessoa logada.

**Como o banco sabe quem é:** a cada conexão tirada do pool, o backend grava na sessão Oracle o
`CLIENT_IDENTIFIER` (`config/RlsDataSource.java`):

| Identificador | Quem | Vê |
|---|---|---|
| `U:<id>` | usuário logado | só as próprias linhas |
| `A:<id>` | administrador logado | tudo |
| vazio | sem login: tarefas agendadas, migrations, login/cadastro | tudo |

**Tabelas e filtros** (função `rls_predicado`):

| Tabela | A pessoa vê |
|---|---|
| `notificacoes` | as dela |
| `pagamentos` | os dela |
| `bloqueios` | os que ela fez e os que recebeu |
| `denuncias` | só as que ela fez (quem é denunciado nunca vê) |
| `conversas` | as que ela participa (inquilino, 2º participante ou dono do anúncio) |
| `mensagens` | as das conversas dela |

`INSERT` fica de fora de propósito: uma pessoa precisa criar linhas para outra (a notificação que
o dono recebe quando alguém puxa conversa). `SELECT`, `UPDATE` e `DELETE` passam pelo filtro.

**Permissão:** criar políticas exige `EXECUTE` em `DBMS_RLS`, que só o SYS pode dar. O script
`database/startdb/01-permissoes-rls.sh` faz isso toda vez que o container do banco sobe (pasta
`/container-entrypoint-startdb.d` da imagem).

**Conferir no banco** (como o usuário da aplicação):
```sql
EXEC DBMS_SESSION.SET_IDENTIFIER('U:1');
SELECT COUNT(*) FROM notificacoes;   -- só as do usuário 1
EXEC DBMS_SESSION.SET_IDENTIFIER('');
SELECT COUNT(*) FROM notificacoes;   -- todas
```

**Limites:** `usuarios`, `anuncios`, fotos e avaliações não têm política, porque parte deles é
pública no site (perfil, anúncios). A proteção desses continua sendo a do backend.

## 5. Área administrativa (`/admin`)

**Quem é admin:** as contas cujos e-mails estão em `ADMIN_EMAILS` no `.env` do ambiente (vários
separados por vírgula). A conta vira admin ao se cadastrar com esse e-mail ou quando o backend
sobe. Não existe tela para virar admin. Tirar o e-mail da lista não remove o admin; para remover:
`UPDATE usuarios SET admin = 0 WHERE email = '...';`

No dev e no homolog, o `seed` cria `admin@teste.com`.

**O que dá para fazer:**

| Aba | Ações |
|---|---|
| Resumo | números do site: usuários, bloqueados, anúncios ativos, denúncias abertas, pagamentos |
| Denúncias | filtrar por status; **bloquear a conta e resolver**, **resolver sem bloquear** ou **descartar**, com nota |
| Usuários | buscar por nome/e-mail; ver denúncias recebidas; **bloquear** (motivo obrigatório) e **desbloquear** |
| Anúncios | buscar por título/dono; **tirar do ar** |
| Pagamentos | vendas por status, meio de pagamento e prazo de 7 dias do CDC; **reembolsar** (motivo obrigatório; devolve pelo Mercado Pago) |

- Bloquear não apaga nada: desbloquear devolve a conta e os anúncios como estavam.
- Bloquear uma conta resolve automaticamente as denúncias abertas contra ela.
- Contas de admin não podem ser bloqueadas pela tela, nem o admin pode bloquear a si mesmo.
- Toda ação de admin é registrada no log do backend com o id de quem fez.
- Quem está bloqueado e tenta entrar vê "Esta conta foi bloqueada pela moderação". Com a senha
  errada, vê o erro normal de senha, para não revelar a situação da conta a terceiros.

## 6. O que ainda falta

- **Dados pessoais em texto puro** (CPF, nascimento): criptografar o CPF na aplicação e ligar
  a criptografia de disco/backup no servidor. O Oracle XE 21c tem TDE disponível.
- **Usuário do banco com permissão mínima** em produção (hoje o backend conecta como dono do schema).
- **Token no `localStorage`:** vulnerável a XSS; o ideal é cookie `HttpOnly`.
- **Testes automáticos** das regras de acesso (hoje há 1 teste).
