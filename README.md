# RachaAi

Plataforma para **dividir aluguel** (ou alugar um imóvel) em Maringá. Estudantes que vêm de
outras cidades encontram com quem dividir apartamento perto da faculdade, sem depender de
grupos de WhatsApp. Cada pessoa cria um perfil com hábitos que importam para a convivência
(fuma, bebe, vegetariano, pet, rotina, música...) e o sistema ordena os anúncios por
**compatibilidade**.

No cadastro a conta escolhe começar **procurando** ou **anunciando** e pode ligar a outra
capacidade depois, no perfil, sem criar outra conta:

- **Procurar vaga** — navega pelos anúncios (filtro por bairro, mapa e orçamento; vagas por sexo)
  e puxa conversa. **Nunca paga.**
- **Anunciar** — publica vaga para dividir ou imóvel inteiro, com fotos. **Até 3 anúncios
  grátis**; do 4º em diante paga um *anúncio extra*; pode pagar um *destaque* para aparecer no
  topo da busca.

Também tem: perfil com foto, convívios e avaliações entre quem já morou junto, notificações,
bloqueio e denúncia, e "esqueci minha senha" por e-mail.

## Subir em 3 comandos

Precisa de Docker (no WSL, no Windows). No Ubuntu do WSL, dentro da pasta do projeto:

```bash
cp .env.example .env        # só na primeira vez; depois edite as senhas
docker compose up --build -d
bash scripts/seed-demo.sh   # cria usuários e anúncios de exemplo (senha: senha123)
```

Abra **http://localhost:8081**. A primeira subida demora (baixa ~1,2 GB do Oracle).
**Passo a passo completo, com todos os testes: [docs/05-GUIA-DE-TESTE-MANUAL.md](docs/05-GUIA-DE-TESTE-MANUAL.md).**

| O quê | Endereço |
|---|---|
| Site | http://localhost:8081 |
| API + Swagger | http://localhost:8080/swagger-ui.html |
| Banco Oracle | `localhost:1522`, serviço `XEPDB1` |
| E-mails de teste (Mailpit) | http://localhost:8025 |

## Documentação

| Documento | Conteúdo |
|---|---|
| [05 — Guia de teste manual](docs/05-GUIA-DE-TESTE-MANUAL.md) | do Docker ao fim: subir, dados de exemplo, testar cada tela e regra, banco, parar, problemas |
| [01 — Tecnologias e versões](docs/01-TECNOLOGIAS.md) | front, back, banco, infraestrutura, portas e variáveis, com as versões exatas |
| [02 — Arquitetura](docs/02-ARQUITETURA.md) | como o sistema é organizado, segurança, cálculo de compatibilidade |
| [03 — Banco de dados](docs/03-BANCO-DE-DADOS.md) | tabelas, colunas, regras, migrations, consultas úteis |
| [04 — API](docs/04-API.md) | todas as rotas, permissões e erros |
| [06 — Cobrança](docs/06-COBRANCA.md) | regras de 3 grátis / extra / destaque, modo simulado, como ligar Pix de verdade |

## Estrutura do repositório

```
rachaai/
├── backend/            Spring Boot 3.3 (Java 21): API REST, JWT, Oracle
├── frontend/           React 19 + TypeScript + Vite + Tailwind 4
├── database/           script opcional para usar o Oracle instalado no PC
├── scripts/            seed-demo.sh (dados de exemplo)
├── docs/               a documentação acima
├── docker-compose.yml  Oracle + backend + frontend + Mailpit (e-mails de teste)
└── .env.example        modelo das configurações e senhas
```

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
  internet. Para e-mail real, preencha as variáveis `MAIL_*` do `.env`.
- Sem confirmação de e-mail no cadastro e sem login com Google.
- Fotos ficam no próprio banco (BLOB); denúncias são só registradas (não há painel de moderação).
- Endereços e sugestões só para Maringá. Anúncio extra não renova sozinho nem é reembolsado.
- Driver Oracle fixado em `ojdbc11 21.6` por causa de um bug da série 23.x com datas (`ORA-18716`).

Lista completa em [docs/02-ARQUITETURA.md](docs/02-ARQUITETURA.md).
