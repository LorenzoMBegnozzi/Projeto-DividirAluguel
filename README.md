# Toc Toc Who? (antigo RachaAi)

Plataforma para **dividir aluguel** (ou alugar um imóvel) em Maringá. Estudantes que vêm de
outras cidades encontram com quem dividir apartamento perto da faculdade, sem depender de
grupos de WhatsApp. Cada pessoa cria um perfil com hábitos que importam para a convivência
(fuma, bebe, vegetariano, pet, rotina, música...) e o sistema ordena os anúncios por
**compatibilidade**.

No cadastro a conta escolhe começar **procurando** ou **anunciando** e pode ligar a outra
capacidade depois, no perfil, sem criar outra conta:

- **Procurar vaga** — navega pelos anúncios (filtro por bairro, mapa e orçamento; vagas por sexo)
  e puxa conversa. **Nunca paga.**
- **Anunciar** — publica vaga para dividir ou imóvel inteiro, com fotos. **Até 2 anúncios
  grátis**; do 3º em diante paga um *anúncio extra*; pode pagar um *destaque* para aparecer no
  topo da busca.

Também tem: perfil com foto, convívios e avaliações entre quem já morou junto, notificações,
bloqueio e denúncia, e "esqueci minha senha" por e-mail.

## Ambientes: dev, homolog e prod

São três ambientes isolados, cada um com o seu banco, senhas e dados. Para trocar de ambiente basta mudar a variável `AMBIENTE` (dev, homolog ou prod). Tudo sobre eles:
**[docs/07-AMBIENTES.md](docs/07-AMBIENTES.md)**.

## Subir o ambiente de desenvolvimento

Precisa de Docker. No PowerShell, dentro da pasta do projeto:

```powershell
Copy-Item .env.dev.example .env.dev    # só na primeira vez; depois edite as senhas
.\scripts\ambiente.ps1 dev up
.\scripts\ambiente.ps1 dev seed        # usuários e anúncios de exemplo (senha: senha123)
```

(No Git Bash: `bash scripts/ambiente.sh dev up`.) A primeira subida demora (baixa ~1,2 GB do Oracle).
**Passo a passo completo, com todos os testes: [docs/05-GUIA-DE-TESTE-MANUAL.md](docs/05-GUIA-DE-TESTE-MANUAL.md).**

| O quê | dev | homolog |
|---|---|---|
| Site | http://localhost:8082 | http://localhost:8092 |
| API + Swagger | http://localhost:8080/swagger-ui.html | http://localhost:8090/swagger-ui.html |
| Banco Oracle | `localhost:1522`, serviço `XEPDB1` | `localhost:1532`, serviço `XEPDB1` |
| E-mails de teste (Mailpit) | http://localhost:8025 | http://localhost:8035 |

Produção não expõe API nem banco; ver [docs/07-AMBIENTES.md](docs/07-AMBIENTES.md). Para colocar no ar numa VPS (produção + homologação, HTTPS, backup): **[deploy/README.md](deploy/README.md)**.

## Documentação

| Documento | Conteúdo |
|---|---|
| [09 — LGPD](docs/09-LGPD.md) | termos, privacidade, aceite, exclusão de conta e o que falta antes de publicar |
| [08 — Segurança e administração](docs/08-SEGURANCA.md) | limite de tentativas, logout, políticas por linha (RLS), área /admin e o que ainda falta |
| [07 — Ambientes](docs/07-AMBIENTES.md) | dev, homolog e prod: a variável AMBIENTE, portas, senhas, comandos, fluxo de uma mudança, checklist de produção |
| [05 — Guia de teste manual](docs/05-GUIA-DE-TESTE-MANUAL.md) | do Docker ao fim: subir, dados de exemplo, testar cada tela e regra, banco, parar, problemas |
| [01 — Tecnologias e versões](docs/01-TECNOLOGIAS.md) | front, back, banco, infraestrutura, portas e variáveis, com as versões exatas |
| [02 — Arquitetura](docs/02-ARQUITETURA.md) | como o sistema é organizado, segurança, cálculo de compatibilidade |
| [03 — Banco de dados](docs/03-BANCO-DE-DADOS.md) | tabelas, colunas, regras, migrations, consultas úteis |
| [04 — API](docs/04-API.md) | todas as rotas, permissões e erros |
| [06 — Cobrança](docs/06-COBRANCA.md) | regras de 2 grátis / extra / destaque, modo simulado, como ligar Pix de verdade |

## Estrutura do repositório

```
rachaai/
├── backend/            Spring Boot 3.3 (Java 21): API REST, JWT, Oracle
├── frontend/           React 19 + TypeScript + Vite + Tailwind 4
├── database/           script opcional para usar o Oracle instalado no PC
├── scripts/            ambiente.ps1 / ambiente.sh (sobe cada ambiente), seed-demo.sh (dados de exemplo)
├── docs/               a documentação acima
├── docker-compose.yml       Oracle + backend + frontend + Mailpit, igual para os 3 ambientes
├── docker-compose.prod.yml  ajustes de produção (fecha API e banco)
└── .env.{dev,homolog,prod}.example  modelos das configurações e senhas de cada ambiente
```

## Testes automáticos

Na pasta `backend`:

```bash
./mvnw test            # 39 testes rápidos, banco H2 em memória
./mvnw test -Poracle   # teste das políticas por linha (RLS) num Oracle de verdade (~2 min, precisa do Docker)
```

| Arquivo | O que garante |
|---|---|
| `auth/AuthAndSessionTest` | aceite dos Termos no cadastro, limite de tentativas (e-mail e IP), logout e troca de senha derrubam o login, "esqueci a senha" não revela contas |
| `auth/EmailConfirmationTest` | sem confirmar o e-mail não anuncia/conversa/demonstra interesse; link de uso único; reenviar invalida o antigo; limite de reenvio |
| `user/PrivacyAndAccountTest` | perfil público sem e-mail, nascimento e alergias; sexo travado; "Prefiro não informar"; excluir conta anonimiza e apaga mensagens |
| `listing/ListingRulesTest` | vaga só para mulheres invisível para homens (busca, link e conversa); suítes ≤ dormitórios; garagem; notificações de interesse |
| `admin/AdminModerationTest` | só admin acessa `/api/admin`; bloquear derruba o login e esconde anúncios; desbloquear devolve; tirar anúncio do ar |
| `security/RateLimiterTest`, `user/AllergyCodecTest`, `accesslog/AccessLogFilterTest` | peças isoladas: limitador, gravação das alergias, eventos do Marco Civil |
| `security/RlsOracleTest` (`-Poracle`) | no Oracle, cada usuário só vê as próprias notificações, conversas e mensagens; denunciado não vê a denúncia; registros de acesso invisíveis; o site segue funcionando |

## Resumo técnico

Java 21 · Spring Boot 3.3.13 · Spring Security + JWT · Hibernate 6.5 · Flyway 10 · Oracle
Database 21c XE · React 19.3 · TypeScript 6 · Vite 8 · Tailwind 4 · Leaflet/OpenStreetMap ·
Spring Mail · lucide-react · Docker + Nginx + Mailpit. Tabela completa em [docs/01-TECNOLOGIAS.md](docs/01-TECNOLOGIAS.md).

## Usando o Oracle instalado no PC em vez do container

Rode `database/setup-oracle-local.sql` como SYSDBA (cria o usuário `rachaai`) e suba o
backend com `DB_URL=jdbc:oracle:thin:@localhost:1521/XEPDB1`, `DB_USER=rachaai` e
`DB_PASSWORD=<a senha definida no script>`. As tabelas são criadas pelo Flyway.

## Estado atual e limitações

- **Pagamento é simulado.** Nenhum gateway está conectado; um botão de teste confirma a compra.
  Não use assim com pessoas reais. Como integrar Pix: [docs/06-COBRANCA.md](docs/06-COBRANCA.md).
- **E-mail:** por padrão o "esqueci minha senha" cai no Mailpit (caixa de teste local), não na
  internet. Para e-mail real, preencha as variáveis `MAIL_*` do `.env` do ambiente.
- Sem confirmação de e-mail no cadastro e sem login com Google.
- Fotos ficam no próprio banco (BLOB); denúncias são só registradas (não há painel de moderação).
- Endereços e sugestões só para Maringá. Anúncio extra não renova sozinho nem é reembolsado.
- Driver Oracle fixado em `ojdbc11 21.6` por causa de um bug da série 23.x com datas (`ORA-18716`).

Lista completa em [docs/02-ARQUITETURA.md](docs/02-ARQUITETURA.md).
