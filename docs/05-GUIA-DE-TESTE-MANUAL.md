# Guia passo a passo: subir o projeto e testar tudo manualmente

Do zero até o fim: preparar o ambiente, subir o Docker, popular dados, testar cada tela e
cada regra, olhar o banco, parar e resolver problemas.

Tempo estimado: **~15 min para subir na primeira vez** (baixa ~1,2 GB do Oracle) + ~45 min
para percorrer todos os testes.

> Os comandos de terminal abaixo são para o **Ubuntu do WSL** (onde o Docker roda). Cada
> comando está em um bloco separado, para copiar e colar.

---

## 1. Antes de começar

### 1.1 O que precisa estar instalado

| Item | Como conferir (no terminal do Ubuntu) | Esperado |
|---|---|---|
| WSL 2 com Ubuntu | `wsl -l -v` no PowerShell | `Ubuntu ... 2` |
| Docker | `docker --version` | `Docker version 29.x` (qualquer recente) |
| Docker Compose | `docker compose version` | `v5.x` (qualquer v2+) |
| curl | `curl --version` | qualquer versão |

Recursos da máquina: **8 GB de RAM** (o Oracle usa ~2 GB), **~6 GB livres em disco**.

Para *rodar só o projeto* você **não** precisa de Java, Node nem Maven na sua máquina:
tudo é compilado dentro do Docker. (Eles só são necessários no modo desenvolvimento, seção 12.)

### 1.2 Abrir o terminal certo

Abra o menu Iniciar, procure **Ubuntu** e abra. Ou, no PowerShell:

```powershell
wsl
```

### 1.3 Ir para a pasta do projeto

No Ubuntu, o disco C: fica em `/mnt/c`. O caminho tem espaços, então use aspas:

```bash
cd "/mnt/c/Users/Lorenzo/Desktop/Berg/videos teste claude/rachaai"
```

Confirme que está no lugar certo:

```bash
ls
```

Deve listar: `backend  database  docker-compose.yml  docs  frontend  scripts  README.md ...`

> **Importante — mantenha essa janela do Ubuntu aberta enquanto testa.** O WSL desliga o
> Linux sozinho quando não há nenhum terminal aberto, e isso derruba o Docker e os
> containers (o site "some"). Veja a seção 13.

---

## 2. Configurar o arquivo `.env`

O `.env` guarda senhas e opções. Ele **não** vai para o Git.

Se ainda não existe:

```bash
cp .env.example .env
```

Abra para editar (ou use o editor que preferir):

```bash
nano .env
```

Ajuste:

| Variável | O que colocar |
|---|---|
| `ORACLE_PASSWORD` | senha do administrador do Oracle |
| `DB_PASSWORD` | senha do usuário `rachaai` (a que o backend usa) |
| `JWT_SECRET` | segredo dos logins (gere um novo, comando abaixo) |
| `MAIL_*` e `APP_BASE_URL` | opcionais: sem mexer, os e-mails vão para a caixa de teste (Mailpit, http://localhost:8025). Veja os comentários do `.env.example` para usar um e-mail de verdade |

**Regra das duas senhas do Oracle:** somente **letras e números**, **começando por letra**
(ex.: `Rachaai2026Senha`). Hífen, espaço ou símbolo podem fazer o login no banco falhar.

Gerar um `JWT_SECRET` novo (precisa ser Base64):

```bash
openssl rand -base64 48
```

Copie a saída para `JWT_SECRET=`. Salvar no `nano`: `Ctrl+O`, `Enter`, `Ctrl+X`.

> Já existe um `.env` funcionando neste projeto. Se ele estiver lá, pode pular esta seção.
> **Não troque `DB_PASSWORD` depois que o banco já foi criado** (veja a seção 13, erro
> `ORA-01017`).

Conferir se o Docker Compose lê o arquivo sem erro:

```bash
docker compose config > /dev/null && echo "configuração OK"
```

---

## 3. Subir o Docker

Sobe os 4 containers (banco, backend, frontend e o Mailpit de e-mails de teste), construindo as imagens:

```bash
docker compose up --build -d
```

O que acontece (e por que demora na primeira vez):

1. Baixa a imagem do Oracle (~1,2 GB).
2. Compila o backend com Maven dentro de um container e baixa as dependências.
3. Compila o frontend com npm e monta o Nginx.
4. Sobe o Oracle e cria o banco na primeira vez (**1 a 2 minutos**).
5. O backend espera o Oracle ficar saudável, roda as **migrations** (cria as tabelas) e inicia.

Acompanhe o estado:

```bash
docker compose ps
```

Você quer ver os três `Up`, e o `db` com `(healthy)`:

```
NAME                 STATUS
rachaai-db-1         Up 2 minutes (healthy)
rachaai-backend-1    Up 1 minute
rachaai-frontend-1   Up 1 minute
```

Enquanto o `db` mostrar `(health: starting)`, é só esperar.

Ver o backend iniciar (sai com `Ctrl+C`; isso **não** derruba nada):

```bash
docker compose logs -f backend
```

Procure estas linhas:

```
Successfully applied 21 migrations to schema "RACHAAI", now at version v21
Started BackendApplication in ... seconds
```

(Nas próximas subidas aparece `Schema "RACHAAI" is up to date`.)

---

## 4. Verificar que subiu

Sem abrir o navegador ainda:

```bash
curl -s -o /dev/null -w "site (front):  %{http_code}\n" http://localhost:8081/
```

```bash
curl -s -o /dev/null -w "swagger (API): %{http_code}\n" http://localhost:8080/swagger-ui.html
```

Esperado: `200` no site e `302` no swagger (redireciona para a página do Swagger).

Agora no navegador do Windows:

| O quê | Endereço |
|---|---|
| **O site** | http://localhost:8081 |
| Documentação da API (Swagger) | http://localhost:8080/swagger-ui.html |

Deve abrir a tela de **login do RachaAi**.

---

## 5. Popular dados de demonstração

O banco começa vazio. Este script cria 7 usuários, perfis, anúncios e uma conversa:

```bash
bash scripts/seed-demo.sh
```

Pode rodar de novo quando quiser: reaproveita os usuários, recria os anúncios e **não duplica** a
conversa de exemplo. Isso também serve para "arrumar" o estado dos anúncios depois de testar
a cobrança (os pagamentos feitos nos testes continuam no banco; para limpá-los, seção 10).

**Senha de todos: `senha123`**

| E-mail | Conta | O que tem |
|---|---|---|
| `rita.alugar@teste.com` | Procura vaga | mulher, não fuma, vegetariana, diurna; **uma conversa já iniciada** |
| `caio.alugar@teste.com` | Procura vaga | homem, fuma, bebe, tem cachorro, noturno (perfil oposto ao da Rita) |
| `novato.alugar@teste.com` | Procura vaga | só a conta, sem perfil |
| `bia.vaga@teste.com` | Anuncia | 2 vagas para dividir (uma **só para mulheres**), perfil parecido com o da Rita |
| `davi.vaga@teste.com` | Anuncia | 1 vaga, perfil parecido com o do Caio |
| `marcos.imoveis@teste.com` | Anuncia | 2 imóveis: Kitnet (sem pet/fumante) e Casa (aceita os dois) |
| `lucia.limite@teste.com` | Anuncia | **já usa os 3 anúncios grátis** |

> Se você já criou anúncios pela tela com outras contas, eles também aparecem na busca e podem
> mudar a contagem de itens das tabelas abaixo (as notas dos itens do seed continuam iguais).

> O script precisa da API no ar. Se aparecer "Nao consegui falar com a API", volte à seção 3/4.

---

## 6. Testes por tela

Use uma **janela anônima** por usuário, ou clique em **Sair** entre um teste e outro.

### 6.1 Cadastro e escolha do tipo de conta

1. Abra http://localhost:8081/registro.
2. Aparecem dois cartões: **Quero alugar** e **Quero anunciar**. Clique em **Quero alugar**.
3. Preencha nome, e-mail novo, senha (mín. 8 caracteres), data de nascimento (18+) e **CPF**
   → **Criar conta**. (O CPF só tem os dígitos conferidos, não é consultado em lugar nenhum:
   use um CPF de teste válido. Um CPF já usado dá "Já existe uma conta com este CPF".)
4. ✔ Vai para **Meu perfil**, com o aviso de segurança na primeira vez (marque a caixa e
   continue). O menu mostra **Buscar, Conversas, Meu perfil** (sem "Meus anúncios" nem "Pagamentos").
5. Clique em **Sair**. Repita escolhendo **Quero anunciar** (e depois o tipo: vaga ou imóvel).
6. ✔ O menu agora é **Meus anúncios, Pagamentos, Conversas, Meu perfil** (sem "Buscar").

Validações a experimentar:
- senha com menos de 8 caracteres → o navegador bloqueia o envio;
- e-mail que já existe → mensagem "Já existe uma conta com este e-mail";
- CPF inválido → "CPF inválido";
- entrar com senha errada → "E-mail ou senha inválidos".

### 6.2 Perfil de hábitos

1. Entre como **rita.alugar@teste.com** → **Meu perfil**.
2. Veja os campos: **Sexo**, Fuma, Bebida, Alimentação (Vegetariano, Vegano, **Outro**), Pets,
   Rotina, Alergias, Música, Sobre mim, Curso.
3. Mude algo (ex.: Fuma → Fumante), **Salvar e continuar** → ✔ aparece "Perfil salvo!". Volte para
   "Não fumo" e salve de novo (para os scores dos testes seguintes ficarem como no guia).
4. Em **Alimentação**, clique **Outro** → ✔ aparece a caixa **"Qual?"**; escreva algo e salve.
   Troque para Vegetariano e salve → ✔ o texto some. **Volte para Vegetariano antes de seguir.**
5. Em **Trocar foto**, escolha uma imagem JPEG/PNG/WEBP de até 3 MB → ✔ a foto aparece no perfil
   e no seu cartão da busca. **Remover** volta para as iniciais.
6. Mais abaixo, em **Convívios e avaliações**, ficam os convívios (ver 6.13) e, no fim da página,
   o botão **Sair**.

### 6.3 Filtros da busca (bairro, mapa e orçamento)

Como Rita → **Buscar**, aba **Preciso de uma vaga**:

1. No campo **"Bairro ou faculdade"** digite `zona` → ✔ aparecem sugestões de Maringá
   (Zona 02, Zona 04...). Escolha uma → ✔ o texto entra no campo e aparece a linha
   **"Mostrando lugares perto do ponto marcado no mapa"** (a busca vira "por perto", raio de 3 km).
   Clique em **limpar** para voltar à lista inteira.
2. Digitar o texto e **não** escolher sugestão filtra pelo texto do bairro (ex.: `zona 7`
   mostra só o anúncio da Zona 7; "Zona 07" e "Zona 7" são tratados como iguais).
3. O botão de **pino** ao lado do campo abre um mapa: clique num ponto e **Usar este local** →
   ✔ só aparecem anúncios a até 3 km do ponto.
4. No campo **Orçamento máximo (R$)** digite `500` → ✔ somem os anúncios acima de R$ 500.
5. O botão de **grade** (canto direito) alterna entre lista e grade.

Local e orçamento **só filtram**; a porcentagem de compatibilidade não muda por causa deles.

### 6.4 Quem aluga: Buscar (compatibilidade)

A porcentagem depende **só dos perfis** (hábitos), não do bairro. Como **Rita** → **Buscar**,
aba **Preciso de uma vaga**:

| Ordem | Anúncio | Compatibilidade esperada |
|---|---|---|
| 1º e 2º | Vaga em apê de 2 quartos / Vaga em república feminina (Bia) | **100%** |
| 3º | Vaga em apê compartilhado (Lúcia) | **41%** |
| 4º | Vaga em casa com quintal (Davi) | **25%** |

Cada cartão mostra a **foto de capa** (se houver), ícones de hábitos, bairro, preço, número de
**vagas disponíveis**, **mapa com o pino** e o endereço.

Aba **Estabelecimentos**: os imóveis com o que o dono aceita ("Aceita animais", "Não aceita
fumantes"...). Para a Rita todos dão 100% (ela não fuma e não tem pet).

Agora saia e entre como **caio.alugar@teste.com** → **Buscar**:

| Aba | Esperado |
|---|---|
| Preciso de uma vaga | Davi **100%**, Lúcia **50%**, Bia (apê de 2 quartos) **25%**. **A "república feminina" não aparece** (é só para mulheres) |
| Estabelecimentos | Casa 3 quartos **100%** (aceita pet e fumante), Apartamento Zona 3 **50%**, Kitnet e Sala comercial **0%** (não aceitam pet nem fumante) |

✔ Isso confirma que a compatibilidade de imóvel compara **o seu hábito com o que o dono aceita**.

Teste também **novato.alugar@teste.com** (sem perfil): todos os scores ficam em **50%**
(sem dados para comparar) e ele só vê as vagas "tanto faz", com um aviso para preencher o sexo.

### 6.5 Conversar

1. Como Rita → **Conversas** → ✔ já existe a conversa "Marcos Imóveis — Casa 3 quartos na Zona 7"
   com 2 mensagens.
2. Volte em **Buscar**, escolha um anúncio novo (ex.: Bia) e clique **Conversar** →
   ✔ abre o chat na hora, **sem curtida nem aprovação**.
3. Escreva uma mensagem e clique **Enviar** → ✔ aparece à direita.
4. Clique **Conversar** no mesmo anúncio de novo → ✔ reabre a **mesma** conversa (não duplica).
5. Saia e entre como **bia.vaga@teste.com** → **Conversas** → ✔ a conversa da Rita aparece.
   Abra e responda → ✔ ela vê a resposta em até 4 segundos (o chat consulta a cada 4 s).

### 6.6 Quem anuncia: publicar anúncios

Entre como **marcos.imoveis@teste.com** → **Meus anúncios**:

1. ✔ Cabeçalho: "2 de 3 anúncios grátis em uso. A partir do 4º, cada anúncio extra custa
   R$ 19,90 por 30 dias."
2. ✔ Os 2 imóveis aparecem com o botão **Remover** e **Destacar · R$ 14,90 / 30 dias**.
   Clique no título de um anúncio para **expandir** os detalhes e as **fotos**.
3. No formulário há dois botões: **Tenho vaga para dividir** e **Tenho um imóvel pra alugar**
   (qualquer anunciante pode escolher qualquer um a cada anúncio). Com **imóvel** aparecem
   *Aceita animais?* e *Aceita fumantes?*. Com **vaga** aparecem **Valor médio por pessoa**,
   **Vagas disponíveis** e **Quem pode ocupar a vaga?** (ver 6.10).
4. Preencha título, bairro (com sugestões), valor e **Endereço**: escolha uma sugestão →
   ✔ o **pino no mapa** é marcado sozinho (dá para ajustar clicando).
5. Em **Fotos (0/6)** clique **Adicionar** e escolha até 6 imagens → ✔ aparecem as miniaturas
   (passe o mouse para remover uma).
6. **Publicar anúncio** → ✔ "Anúncio publicado!", o contador vira **3 de 3** e as fotos são
   enviadas junto.
7. Tente publicar **sem endereço/mapa** → ✔ erro "Marque o local no mapa e informe o endereço".
8. Clique **Remover** em um anúncio → ✔ ele some e o contador diminui.
9. **Marcar indisponível** (com ou sem escolher com quem fechou negócio) tira o anúncio da busca;
   **Marcar disponível** traz de volta.

### 6.7 Limite de 3 grátis e anúncio extra (cobrança)

Entre como **lucia.limite@teste.com** → **Meus anúncios**:

1. ✔ "3 de 3 anúncios grátis em uso" e, no lugar do formulário, o painel **"Você usou seus 3
   anúncios grátis"** com o botão **Comprar anúncio extra · R$ 19,90**.
2. Clique nele → ✔ vai para **Pagamentos**: aviso amarelo de **ambiente de teste**, contadores
   ("3 de 3 em uso", "0 disponível(is)") e uma compra **Pendente** de R$ 19,90.
3. Volte em **Meus anúncios** → ✔ continua bloqueado (a compra ainda não foi paga).
4. Em **Pagamentos**, clique **Simular pagamento** → ✔ vira **Pago** e o contador mostra
   **1 disponível**.
5. **Meus anúncios** → ✔ o formulário voltou, com o aviso: "Este anúncio usa 1 dos seus 1
   crédito(s) de anúncio extra e fica ativo por 30 dias."
6. Publique um anúncio (com endereço e mapa) → ✔ ele aparece com o selo azul **"Extra até
   dd/mm/aaaa"** (30 dias à frente).
7. ✔ O painel de compra volta (crédito gasto) → não dá para publicar um 5º sem comprar outro.
8. Em **Pagamentos**, o extra aparece como "Anúncio extra usado em ...".

### 6.8 Destaque avulso (topo da busca)

1. Entre como **davi.vaga@teste.com** → **Meus anúncios** → no anúncio "Vaga em casa com quintal",
   clique **Destacar · R$ 14,90 / 30 dias**.
2. ✔ Vai para **Pagamentos** com uma compra "Destaque de 30 dias" **Pendente** → **Simular
   pagamento** → ✔ **Pago**.
3. **Meus anúncios** → ✔ o anúncio mostra o selo amarelo **"Destaque até dd/mm/aaaa"**
   (30 dias à frente).
4. Saia e entre como **rita.alugar@teste.com** → **Buscar** → aba **Preciso de uma vaga**.
5. ✔ O anúncio do Davi está **em primeiro**, com o selo **Destaque**, **mesmo com 25%** de
   compatibilidade, à frente dos de 100%. Isso é a regra: destaque vale independente da
   compatibilidade.
6. Compre o destaque do mesmo anúncio de novo e pague → ✔ a data avança **mais 30 dias**
   (soma, não recomeça).

### 6.9 Restrições por capacidade

| Teste | Como | Esperado |
|---|---|---|
| Conta sem "anunciar" abre tela de anunciar | logado como Rita, acesse http://localhost:8081/pagamentos | volta para **/browse** |
| Conta sem "procurar" abre a busca | logado como Bia, acesse http://localhost:8081/browse | vai para **/anuncio** |
| Sem login | janela anônima em http://localhost:8081/browse | vai para **/login** |

E no backend (a regra vale mesmo sem a tela): use o Swagger (seção 8) ou, com um token,
chame `POST /api/billing/payments` como Rita → **403 "Apenas contas de anúncio podem
comprar..."**.

### 6.10 Vaga por sexo

1. Como **Bia** → **Meus anúncios** → ✔ a "Vaga em república feminina" foi criada como
   **Somente mulheres** (aparece ao expandir o anúncio).
2. Ao publicar uma vaga, em **Quem pode ocupar a vaga?** escolha **Tanto faz**, **Somente homens**
   ou **Somente mulheres**.
3. Como **Rita** (mulher) a república feminina aparece; como **Caio** (homem) **não** aparece.
4. Como **novato** (sem sexo no perfil) só aparecem as vagas "tanto faz", com o aviso *"Informe
   seu sexo no perfil..."*.
5. O backend também bloqueia: com o token do Caio, `POST /api/conversations` com o id dessa vaga
   devolve **403 "Essa vaga é restrita a outro sexo"**.

### 6.11 Fotos e popup

1. Como **Bia**, expanda um anúncio em **Meus anúncios** → **Fotos** → **Adicionar** (até 6).
2. Como **Rita** → **Buscar** → ✔ a foto de capa aparece no cartão, com o selo **"N fotos"**
   quando há mais de uma.
3. Clique na foto → ✔ abre um **popup** com a foto grande e as **miniaturas embaixo**; setas ← →
   ou clique nas miniaturas para trocar; **Esc** ou clicar fora fecha.
4. Clique no título do anúncio dentro de uma conversa → ✔ abre a **página do anúncio**
   (`/anuncios/<id>`) com a galeria.

### 6.12 "Quero também..." (uma conta com as duas capacidades)

1. Entre com uma conta **nova** que só procura vaga → **Meu perfil** → role até
   **"Quero também..."**.
2. Clique **Anunciar uma vaga ou imóvel** → escolha o tipo → ✔ o site **leva direto para Meus
   anúncios** e o menu ganha **Meus anúncios** e **Pagamentos** (sem criar outra conta).
3. O mesmo vale ao contrário: uma conta que só anuncia pode ligar **Procurar uma vaga**.

> Use uma conta nova: o script de seed não desliga capacidades, então uma conta de exemplo
> que você converter continua com as duas.

### 6.13 Interesse em imóveis, convívios e denúncias

- **Tenho interesse:** como Rita, aba **Estabelecimentos** → **Tenho interesse** num imóvel.
  Se só você se interessou, aparece **"Você é o único interessado até o momento"**; se houver
  mais gente, **"N pessoa(s) também se interessaram"**, que expande a lista para **Conversar**
  com essas pessoas.
- **Convívios:** no **perfil público** de alguém (clique no nome em uma conversa) → **Registrar
  convívio** com o período. A outra pessoa **confirma** no próprio perfil; depois cada uma pode
  **avaliar** (pagamentos em dia e convivência, 1 a 5).
- **Bloquear/denunciar:** no perfil público, os ícones de escudo e bandeira. Bloqueados somem da
  busca e não trocam mensagens; a lista fica em **Meu perfil > Bloqueados**.
- **Sino** no topo: mostra notificações (nova conversa, mensagem, convívio, avaliação).

### 6.14 Esqueci minha senha (e-mail)

1. Saia (ou use uma janela anônima) → tela de login → **Esqueci minha senha**.
2. Digite `rita.alugar@teste.com` → **Enviar link de redefinição** → ✔ a tela diz só que
   "se esse e-mail tiver uma conta, enviamos um link" (a mesma mensagem para qualquer e-mail).
3. Abra a **caixa de teste em http://localhost:8025** → ✔ chegou o e-mail "RachaAi - redefinição
   de senha" com o link (válido por 30 minutos). Nenhum e-mail sai para a internet.
4. Abra o link, defina uma senha nova → ✔ dá para entrar com ela. Abrir o **mesmo link de novo**
   → ✔ "Link inválido ou expirado". **Volte a senha para `senha123`** ao terminar.
5. Um e-mail que não existe → ✔ mesma mensagem, e **nenhum** e-mail chega na caixa.

Para receber no e-mail de verdade, veja as variáveis `MAIL_*` no `.env.example`.

### 6.15 Validade do anúncio extra (opcional)

O sistema desativa anúncios extras vencidos a cada 10 minutos. Para ver isso rápido:

1. No `.env`, ponha `EXPIRATION_CHECK=PT10S` (checa a cada 10 segundos) e recrie o backend:

   ```bash
   docker compose up -d backend
   ```

2. Descubra o id do anúncio extra da Lúcia (SQL Developer, seção 7):

   ```sql
   SELECT id, titulo, expira_em FROM anuncios WHERE expira_em IS NOT NULL;
   ```

3. Faça-o "vencer":

   ```sql
   UPDATE anuncios SET expira_em = SYSTIMESTAMP - INTERVAL '1' DAY WHERE id = 999;  -- troque 999 pelo id
   COMMIT;
   ```

4. Em até ~10 s: ✔ o anúncio some de **Meus anúncios** da Lúcia e o log mostra
   `1 anúncio(s) extra(s) expirado(s) foram desativados` (`docker compose logs backend | tail`).
5. Volte o `.env` para `EXPIRATION_CHECK=PT10M` e rode `docker compose up -d backend` de novo.

---

## 7. Olhar o banco de dados

### 7.1 Conectar pelo SQL Developer

Nova conexão, tipo **Básico**:

| Campo | Valor |
|---|---|
| Name | `rachaai-docker` (qualquer nome) |
| Nome do Usuário | `rachaai` |
| Senha | o valor de `DB_PASSWORD` do seu `.env` |
| Nome do Host | `localhost` |
| Porta | **`1522`** (a `1521` é de um Oracle instalado no Windows, não deste projeto) |
| **Nome do Serviço** | **`XEPDB1`** (marque *Nome do Serviço*, **não** SID) |

Clique **Testar** → "Com êxito" → **Conectar**. Se recusar a conexão, veja a seção 13.

### 7.2 Conferir os dados

```sql
SELECT id, nome, email, alugar, anunciar, tipo_anunciante FROM usuarios ORDER BY id;
```

✔ `alugar` e `anunciar` são `1` ou `0` (uma conta pode ter os dois ligados).

```sql
SELECT u.nome, p.sexo, p.habito_fumo, p.alimentacao, p.alimentacao_outro
  FROM perfis_usuario p JOIN usuarios u ON u.id = p.usuario_id;
```

✔ Os hábitos são códigos por extenso (`FUMANTE`, `VEGETARIANO`...); vazio = "não informado".

```sql
SELECT u.nome, a.tipo, a.titulo, a.sexo_aceito, a.vagas_disponiveis, a.expira_em, a.destaque_ate
  FROM anuncios a JOIN usuarios u ON u.id = a.usuario_id WHERE a.ativo = 'SIM';
```

✔ Depois dos testes 6.7 e 6.8: o anúncio extra da Lúcia tem `expira_em` e o do Davi tem
`destaque_ate`. Anúncios grátis têm `expira_em` vazio.

```sql
SELECT u.nome, p.tipo, p.valor, p.status, p.anuncio_id, p.pago_em
  FROM pagamentos p JOIN usuarios u ON u.id = p.usuario_id ORDER BY p.id;
```

✔ Cada compra com `status` `PENDENTE` ou `PAGO`; o extra usado tem `anuncio_id` preenchido.

Provar que o banco protege a regra de restrição por sexo (o comando deve **falhar** por causa
do `CHECK`; nada é gravado):

```sql
INSERT INTO anuncios (usuario_id, tipo, titulo, sexo_aceito)
SELECT id, 'TEM_VAGA', 'invalido', 'TALVEZ' FROM usuarios WHERE ROWNUM = 1;
ROLLBACK;
```

✔ `ORA-02290: check constraint (RACHAAI.CK_ANUNCIOS_SEXO_ACEITO) violated`.

### 7.3 Pelo terminal (sem SQL Developer)

```bash
docker exec -it rachaai-db-1 sqlplus rachaai/SUA_DB_PASSWORD@localhost/XEPDB1
```

(troque `SUA_DB_PASSWORD`; `exit` para sair.)

---

## 8. Testar a API pelo Swagger

1. Abra http://localhost:8080/swagger-ui.html.
2. Rode `POST /api/auth/login` (**Try it out**) com:

   ```json
   { "email": "rita.alugar@teste.com", "password": "senha123" }
   ```

3. Copie o valor de `token` da resposta.
4. Clique no cadeado **Authorize** (topo), cole o token e confirme.
5. Agora chame qualquer rota, por exemplo `GET /api/browse/roommates` ✔ lista ordenada, ou
   `GET /api/billing/plan` como Rita ✔ **403**, e como `lucia.limite@teste.com`
   ✔ `{"freeListings":3,"freeListingsUsed":3,"extraCredits":0,...,"simulatedMode":true}`.

Lista completa das rotas em [04-API.md](04-API.md).

---

## 9. Rodar os testes automáticos (opcional)

Precisa de Java 21 na máquina (não é necessário para só usar o sistema). Na pasta `backend`:

```bash
cd backend && ./mvnw test
```

Sobe o contexto Spring com um banco em memória e confere se o mapeamento está correto.
Esperado: `Tests run: 1, Failures: 0` (a saída é longa; procure `BUILD SUCCESS`).

---

## 10. Parar, religar e zerar

| Objetivo | Comando | Dados |
|---|---|---|
| **Parar** (mantém tudo) | `docker compose stop` | preservados |
| **Religar** | `docker compose up -d` | preservados |
| Ver logs | `docker compose logs -f backend` | |
| Reconstruir depois de mudar código | `docker compose up --build -d` | preservados |
| Parar e remover containers | `docker compose down` | preservados (o volume fica) |
| **Zerar tudo, inclusive o banco** | `docker compose down -v` | **APAGADOS** |

Depois de `down -v`, suba de novo (seção 3) e rode o script de dados (seção 5).

**Limpar só as compras de teste** (sem apagar usuários nem anúncios), para repetir os testes
6.7 e 6.8 do zero. No SQL Developer (seção 7):

```sql
DELETE FROM pagamentos;
UPDATE anuncios SET destaque_ate = NULL;
COMMIT;
```

Isso zera créditos de anúncio extra e destaques. Os anúncios que já foram publicados com crédito
continuam ativos, com a validade deles; rode `bash scripts/seed-demo.sh` para recriar os anúncios
no estado inicial.

---

## 11. Checklist final

Marque conforme testar:

- [ ] Sobe com `docker compose up --build -d` e o `db` fica `(healthy)`
- [ ] Site abre em http://localhost:8081 e o Swagger em :8080
- [ ] Cadastro pede **alugar ou anunciar** (e CPF) e o menu muda conforme a conta
- [ ] Login com senha errada é recusado
- [ ] Perfil salva (sexo, hábitos, alimentação "Outro" com texto, foto)
- [ ] Buscar com 2 abas, filtros de bairro/mapa/orçamento, scores conforme a tabela 6.4
- [ ] Vaga só para mulheres some para o Caio e o backend dá 403 na conversa direta
- [ ] Conversar abre o chat direto; quem anuncia responde
- [ ] Anunciar: vaga e imóvel (endereço com sugestões, mapa, fotos, vagas disponíveis, sexo aceito)
- [ ] Foto no cartão abre popup com miniaturas
- [ ] 4º anúncio bloqueado → comprar extra → simular pagamento → publicar → selo "Extra até"
- [ ] Destaque: pago → selo "Destaque até" → topo da busca mesmo com score menor
- [ ] "Quero também..." liga a outra capacidade e leva para a tela nova
- [ ] "Esqueci minha senha" entrega o e-mail no Mailpit (:8025) e o link só vale uma vez
- [ ] Telas sem a capacidade redirecionam; API devolve 403
- [ ] Banco mostra `alugar`/`anunciar` e `SIM`/`NAO`
- [ ] `docker compose stop` para tudo; `docker compose up -d` traz os dados de volta

---

## 12. Modo desenvolvimento (opcional, sem Docker para o app)

Para editar código com recarga automática. O **banco continua no Docker**.

Precisa de: **Java 21**, **Node 20+** (testado com 24), npm. O Maven não precisa instalar (`mvnw`).

**1) Só o banco:**

```bash
docker compose up -d db
```

Espere ficar `(healthy)` (`docker compose ps`).

**2) Backend** (numa janela do **PowerShell** dentro da pasta `backend`; na linha do
`DB_PASSWORD` use a senha do seu `.env`):

```powershell
$env:DB_PASSWORD = "SUA_DB_PASSWORD"
.\mvnw.cmd spring-boot:run
```

Sem `DB_URL`, ele usa `jdbc:oracle:thin:@localhost:1522/XEPDB1` (o Oracle do Docker). Sobe em
http://localhost:8080. Se o container `backend` do Docker estiver rodando, pare-o antes
(`docker compose stop backend frontend`), senão a porta 8080 fica ocupada.

**3) Frontend** (outra janela, pasta `frontend`):

```powershell
npm install
npm run dev
```

Abre em http://localhost:5173; o Vite envia `/api/*` para `localhost:8080` sozinho.

**Usar o Oracle instalado no Windows** em vez do container: rode
`database/setup-oracle-local.sql` como SYSDBA e suba o backend com
`DB_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1` (detalhes no README).

---

## 13. Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| Site/API param de responder, containers "sumiram" | o WSL desligou por não ter terminal aberto | Abra o **Ubuntu** e deixe a janela aberta; depois `docker compose ps`. Eles voltam sozinhos (`restart: unless-stopped`). Para desativar o desligamento automático, no arquivo `C:\Users\Lorenzo\.wslconfig` (seção `[wsl2]`) acrescente `instanceIdleTimeout=-1` e rode `wsl --shutdown` uma vez |
| `docker: command not found` | está no PowerShell, não no Ubuntu | abra o **Ubuntu** (`wsl`) |
| `db` fica em `(health: starting)` por muito tempo | primeira inicialização do Oracle | espere até ~3 min; veja `docker compose logs db` |
| Backend reinicia em loop / `Connection refused` | subiu antes do Oracle ficar pronto | espere o `db` ficar `healthy`; ele reconecta sozinho |
| `ORA-01017: invalid username/password` | você mudou `DB_PASSWORD` **depois** de o banco ser criado (a senha só é definida na criação) | volte a senha antiga no `.env`, ou zere o banco: `docker compose down -v` e suba de novo |
| `port is already allocated` (8080, 8081 ou 1522) | outro programa usa a porta | feche-o, ou mude a porta em `docker-compose.yml` |
| SQL Developer não conecta | WSL parado, porta errada ou SID em vez de serviço | confira porta `1522` e **Nome do Serviço** `XEPDB1` |
| Login com 401 no script/Swagger | usuário não existe | rode `bash scripts/seed-demo.sh` |
| Acentos quebrados ao chamar a API com `curl` no Windows | o `curl` do Windows converte a linha de comando | envie o corpo por arquivo ou stdin (`--data-binary @-`), como o `seed-demo.sh` faz |
| `bash: scripts/seed-demo.sh: ...^M` | arquivo com quebra de linha do Windows | `sed -i 's/\r$//' scripts/seed-demo.sh` |
| Mudei código e nada mudou | imagem antiga | `docker compose up --build -d` |
| Pagamento não confirma / sem botão "Simular pagamento" | `BILLING_MODE` não é `SIMULADO` | ponha `BILLING_MODE=SIMULADO` no `.env` e `docker compose up -d backend` |
| Erro `ORA-18716` ao cadastrar | versão do driver Oracle foi alterada | volte o `ojdbc11` para `21.6.0.0.1` no `pom.xml` |
| Tela em branco ao abrir o site | backend ainda subindo | espere e recarregue (`docker compose logs backend`) |
