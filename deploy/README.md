# Servidor (VPS Linux de 2 GB)

Como colocar o Toc Toc Who? no ar numa VPS (ex.: Locaweb VPS 2 GB Linux, Ubuntu 24.04), com
**produção** em `toctocwho.com.br` e **homologação** em `homolog.toctocwho.com.br`.

```
Internet (https)
   │
 Caddy :80/:443  ── certificados HTTPS grátis e automáticos (Let's Encrypt) ──
   ├── toctocwho.com.br          → site (Nginx) → API (Java) → banco (Postgres)   [sempre ligado]
   └── homolog.toctocwho.com.br  → site (Nginx) → API (Java) → banco (Postgres)   [liga quando for testar]
```

| Arquivo | Para quê |
|---|---|
| `.github/workflows/imagens.yml` | a cada push na `main`: testes e, se passarem, as imagens Docker publicadas no ghcr.io |
| `deploy/instalar-servidor.sh` | prepara a VPS nova (Docker, firewall, swap, backup diário). Uma vez só |
| `deploy/servidor.sh` | liga, desliga e atualiza produção, homolog e o Caddy |
| `deploy/docker-compose.servidor.yml` | ajustes de servidor: imagens prontas, sem portas abertas, limites de memória |
| `deploy/caddy/` | a porta de entrada com HTTPS |
| `deploy/nginx/servidor.conf` | Nginx do site atrás do Caddy (IP real do visitante, cache) |
| `deploy/backup.sh` | backup do banco de produção (roda sozinho às 03:30) |

**Memória (medida num teste):** produção ligada usa ~380 MB (API ~300 MB, banco ~55 MB, site ~4 MB)
e o Caddy ~20 MB. Com o Linux, sobra ~1 GB: dá para ligar o homolog junto quando for testar. Cada
container tem um teto (`mem_limit`), e o swap de 2 GB segura picos.

---

## 1. Antes de começar

1. **VPS:** contrate a VPS Linux 2 GB com **Ubuntu 24.04 LTS**. Anote o **IP** e a senha do `root`.
2. **Domínio** (Registro.br): em *DNS → Editar zona*, crie três registros **A** apontando para o IP da VPS:
   `toctocwho.com.br`, `www.toctocwho.com.br` e `homolog.toctocwho.com.br`.
   A propagação leva de minutos a algumas horas (confira com `nslookup toctocwho.com.br`).
3. **GitHub** (repositório → *Settings*):
   - *Secrets and variables → Actions → New repository secret*: `MAPTILER_KEY` com a chave do MapTiler.
   - Faça um push na `main` e veja em *Actions* o "Imagens Docker" terminar (verde). As imagens ficam em
     *Packages* do seu perfil, privadas.
   - Crie um **token para o servidor baixar as imagens**: foto do perfil → *Settings → Developer settings →
     Personal access tokens → Tokens (classic)* → só a permissão **`read:packages`**. Guarde o token.
4. **Google Cloud** (login com Google): no cliente OAuth, em *Origens JavaScript autorizadas*, adicione
   `https://toctocwho.com.br` e `https://homolog.toctocwho.com.br`. Quando for lançar, *Publicar app*
   na tela de consentimento.
5. **MapTiler**: em *Allowed HTTP origins* da chave, libere os dois domínios.

## 2. Instalar o servidor (uma vez)

No seu computador, entre na VPS:

```bash
ssh root@IP_DA_VPS
```

Crie um usuário para o dia a dia (não use o root) e entre com ele:

```bash
adduser toctoc
usermod -aG sudo toctoc
su - toctoc
```

Baixe o projeto. O repositório é privado, então crie uma **chave de leitura** só para o servidor:

```bash
ssh-keygen -t ed25519 -C "vps-toctocwho" -N "" -f ~/.ssh/id_ed25519
cat ~/.ssh/id_ed25519.pub
```

Copie o que apareceu e cole no GitHub: repositório → *Settings → Deploy keys → Add deploy key*
(deixe **sem** "Allow write access"). Depois:

```bash
sudo mkdir -p /opt/toctocwho && sudo chown toctoc: /opt/toctocwho
git clone git@github.com:LorenzoMBegnozzi/Projeto-DividirAluguel.git /opt/toctocwho
cd /opt/toctocwho
sudo bash deploy/instalar-servidor.sh
exit
```

(o `exit` é para sair e entrar de novo, e o usuário passar a usar o Docker sem `sudo`)

```bash
su - toctoc
cd /opt/toctocwho
docker login ghcr.io -u LorenzoMBegnozzi
```

A senha pedida é o **token `read:packages`** do passo 1.

## 3. Configurar os ambientes

```bash
cp .env.prod.example .env.prod
cp .env.homolog.example .env.homolog
cp deploy/caddy/.env.caddy.example deploy/caddy/.env
chmod 600 .env.prod .env.homolog deploy/caddy/.env
```

Gere senhas e chaves novas (rode uma vez para cada campo):

```bash
openssl rand -base64 48
```

Preencha com `nano .env.prod` (salvar: Ctrl+O, Enter; sair: Ctrl+X):

- `POSTGRES_ADMIN_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`: valores gerados, **diferentes** entre si e entre os ambientes;
- `MAIL_*`: um SMTP de verdade (Brevo, Resend ou Gmail com senha de app);
- `MERCADOPAGO_*`: credencial de **produção** (começa com `APP_USR-`);
- `ADMIN_EMAILS`, `MAPTILER_KEY`, `GOOGLE_CLIENT_ID`;
- `BILLING_MODE=MERCADOPAGO` e os preços reais.

No `.env.homolog`, troque também:

- `CORS_ALLOWED_ORIGINS` e `APP_BASE_URL` para `https://homolog.toctocwho.com.br`;
- `MERCADOPAGO_*` com a credencial de **teste** (`TEST-`), ou deixe `BILLING_MODE=SIMULADO`.

O homolog usa o Mailpit (e-mails não saem de verdade).

No `deploy/caddy/.env`: `DOMINIO=toctocwho.com.br` e `ACME_EMAIL=` o seu e-mail.

## 4. Subir

```bash
bash deploy/servidor.sh caddy subir
bash deploy/servidor.sh prod subir
```

Abra `https://toctocwho.com.br`. No primeiro acesso o Caddy pede o certificado; pode levar alguns segundos.

**Conta de administrador:** cadastre-se pelo site com o e-mail que está em `ADMIN_EMAILS` e depois:

```bash
bash deploy/servidor.sh prod restart backend
```

## 5. Dia a dia: publicar uma versão nova

1. Faça push na `main`. O GitHub roda os testes e publica as imagens. Em *Actions*, no fim do
   "Imagens Docker", aparece a versão gerada, ex.: `sha-1a2b3c4`.
2. **Teste no homolog** (pega sempre a mais nova):

   ```bash
   bash deploy/servidor.sh homolog subir
   ```

   Teste em `https://homolog.toctocwho.com.br`. Na primeira vez, se quiser os dados de exemplo:

   ```bash
   bash deploy/servidor.sh homolog seed
   ```

3. **Aprovou?** Leve a mesma versão para produção e desligue o homolog:

   ```bash
   bash deploy/servidor.sh prod subir sha-1a2b3c4
   bash deploy/servidor.sh homolog parar
   ```

**Voltar para a versão anterior:** rode `bash deploy/servidor.sh prod subir sha-<a anterior>`.
Atenção: se a versão nova tinha mudança no banco (migration), a antiga pode não funcionar com ele.
Nesse caso, restaure o backup (item 7).

**Mudou algo em `deploy/`, nos `docker-compose*.yml` ou no `database/`:** atualize os arquivos do servidor.

```bash
git pull
```

Depois rode `subir` de novo. Se mudou o `Caddyfile`, rode `bash deploy/servidor.sh caddy recarregar`.

## 6. Homologação

- **Ligada só quando for testar:** `bash deploy/servidor.sh homolog subir` liga e `bash deploy/servidor.sh homolog parar` desliga.
  O banco do homolog continua guardado entre uma vez e outra.
- **Desligada:** o endereço mostra "Homologação desligada no momento".
- **Ver os e-mails do homolog (Mailpit):** abra um túnel a partir do **seu computador** e acesse `http://localhost:8035`.

  ```bash
  ssh -L 8035:localhost:8035 toctoc@IP_DA_VPS
  ```

## 7. Backup

- Todo dia às **03:30**, o banco de produção (com as fotos) vai para `/opt/backups/toctocwho`, com os últimos 14 dias.
  - Log: `/var/log/toctocwho-backup.log`.
  - Fazer um agora: `sudo bash deploy/backup.sh`.
- **Cópia fora do servidor (faça!):** sem ela, se a VPS se perder, o backup vai junto.
  1. Configure um destino no `rclone`, por exemplo um Google Drive, com `rclone config`. Siga o assistente, dê o nome
     `gdrive` e, como a VPS não tem navegador, responda "n" em *auto config* e siga as instruções.
  2. Em `/etc/toctocwho-backup.env`, coloque `BACKUP_DESTINO=gdrive:toctocwho-backups`.
- **Restaurar** um backup (apaga o banco atual e põe o do arquivo no lugar):

  ```bash
  bash deploy/servidor.sh prod stop backend
  DB=$(docker ps -q -f label=com.docker.compose.project=rachaai-prod -f label=com.docker.compose.service=db)
  docker exec -i "$DB" pg_restore -U postgres -d rachaai --clean --if-exists < /opt/backups/toctocwho/prod-AAAAMMDD-HHMM.dump
  bash deploy/servidor.sh prod start backend
  ```

## 8. Acompanhar

| Para ver | Comando |
|---|---|
| Memória e CPU de cada container | `bash deploy/servidor.sh memoria` |
| Log da API de produção | `bash deploy/servidor.sh prod logs` |
| O que está rodando | `bash deploy/servidor.sh prod ps` |
| Log do Caddy (HTTPS, acessos) | `bash deploy/servidor.sh caddy logs` |

Vale cadastrar o site num monitor grátis (ex.: UptimeRobot) para receber um aviso se ele cair.

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| Certificado não sai / "não é seguro" | O domínio ainda não aponta para o IP da VPS (`nslookup`), ou as portas 80/443 estão fechadas no painel da Locaweb |
| `pull ... denied` ao subir | `docker login ghcr.io` não foi feito, ou o token não tem `read:packages` |
| Site lento com o homolog ligado | É a memória: desligue o homolog (`homolog parar`) ou passe para a VPS de 4 GB; os mesmos arquivos funcionam |
| Botão do Google com erro de origem | Adicione o domínio nas origens do cliente OAuth (passo 1.4) e espere uns minutos |
| Pagamento não confirma sozinho | No Mercado Pago, a URL de notificação deve ser `https://toctocwho.com.br/api/billing/webhook/mercadopago` |
