# Cobrança: como o RachaAi ganha dinheiro

**Quem paga é quem anuncia.** Quem procura lugar (capacidade "procurar vaga") nunca paga nada. Uma conta que também anuncia paga só pelos anúncios extras e destaques que comprar.

## Regras

| O quê | Regra | Padrão |
|---|---|---|
| Anúncios grátis | Cada conta que anuncia tem até **2 anúncios ativos** grátis (vaga para dividir ou imóvel, em qualquer mistura) | 2 |
| Anúncio extra | Do **4º anúncio em diante** é preciso comprar um *anúncio extra*. Cada compra vale por **1 anúncio** e ele fica ativo por N dias; depois disso é desativado sozinho | R$ 19,90 por 30 dias |
| Destaque avulso | Pagando, o anúncio **aparece no topo da busca**, à frente dos outros, **independente da compatibilidade**, por N dias | R$ 14,90 por 30 dias |
| Comprar de novo o destaque | Se o anúncio já está em destaque, os dias **somam** (não perde o que já pagou) | |

Todos os valores e prazos são configuráveis (ver [01-TECNOLOGIAS.md](01-TECNOLOGIAS.md),
seção "Configurações"): `FREE_LISTINGS`, `EXTRA_LISTING_PRICE`, `EXTRA_LISTING_DAYS`,
`HIGHLIGHT_PRICE`, `HIGHLIGHT_DAYS`. **Os preços acima são valores de partida; ajuste
conforme o mercado.** O destaque de 30 dias foi a duração escolhida na definição do produto.

### Detalhes que valem saber

- **Grátis vs. extra:** o que conta como "grátis em uso" são os anúncios ativos **sem
  validade**. Se você remove um anúncio grátis, a vaga grátis é liberada. Anúncios extras não
  ocupam vaga grátis.
- **Extra vencido:** quando a validade acaba, o anúncio é desativado (a checagem roda a cada
  10 minutos). Para publicar de novo, é preciso comprar outro extra. **Não há renovação
  automática nem reembolso** de anúncio extra removido antes do prazo.
- **Destaque** só vale para anúncio ativo. Se o anúncio for removido ou vencer, o destaque
  fica sem efeito (não aparece mais na busca).
- **Só quem tem conta "Quero anunciar"** compra. Quem aluga recebe 403.
- O preço fica **congelado no pagamento** (`pagamentos.valor`): mudar o preço depois não altera
  compras antigas.

## Fluxo de uso

**Anúncio extra**
1. A pessoa já tem 2 anúncios grátis ativos e tenta publicar o 3º → a tela mostra "Você usou
   seus 2 anúncios grátis" e o botão *Comprar anúncio extra*.
2. Clicar cria um pagamento `PENDENTE` e abre a tela **Pagamentos**.
3. Depois que o pagamento é confirmado (`PAGO`), vira **1 crédito**.
4. A pessoa publica o anúncio; ele consome o crédito e ganha `expiresAt` (30 dias).

**Destaque**
1. Em **Meus anúncios**, botão *Destacar* no anúncio.
2. Pagamento `PENDENTE` → confirmado (`PAGO`) → o anúncio ganha `destaqueAte` = agora + 30 dias.
3. Na busca de quem aluga, o anúncio aparece com o selo "Destaque" no topo da lista.

## Modos de cobrança (`BILLING_MODE`)

| Modo | O que acontece | Onde usar |
|---|---|---|
| `SIMULADO` | a compra fica pendente e o botão **Simular pagamento** confirma sem cobrar | dev e homolog sem credencial |
| `MERCADOPAGO` | a compra abre o **checkout do Mercado Pago**: Pix, cartão de crédito ou débito | homolog (credencial de teste) e prod |
| `DESATIVADO` | nenhuma compra pode ser feita | emergência |

**Preços atuais são de TESTE: R$ 1,00** (anúncio extra e destaque). Definir os preços reais antes
de lançar (`EXTRA_LISTING_PRICE` e `HIGHLIGHT_PRICE` no `.env`).

## Pagamento pelo Mercado Pago (Checkout Pro)

A pessoa paga numa **página do próprio Mercado Pago**: o número do cartão nunca passa pelo
RachaAi (sem obrigação de certificação PCI). Aceita **Pix, cartão de crédito, cartão de débito**
e saldo do Mercado Pago. Boleto fica de fora (demora dias).

```
"Destacar · R$ 1,00"  →  backend cria a cobrança no Mercado Pago (referência rachaai-<ambiente>-<id>)
→ navegador vai para o checkout  →  paga  →  volta para /pagamentos/retorno?pagamento=<id>
→ backend PERGUNTA ao Mercado Pago como está  →  aprovado (no valor certo) → PAGO → efeito aplicado
```

**Regras de segurança**
- **Nunca confia no navegador.** O `status=approved` que o Mercado Pago põe na URL de volta é
  ignorado; o backend consulta a API do Mercado Pago (`/v1/payments/search`).
- **Valor conferido:** pagamento aprovado com valor menor que o cobrado não é aceito.
- **Idempotente:** o mesmo aviso repetido não soma dias de destaque nem crédito de novo.
- **Referência por ambiente:** `rachaai-dev-5`, `rachaai-homolog-5`... dev, homolog e prod podem
  usar a mesma conta do Mercado Pago sem um confirmar o pagamento do outro.
- **Aviso automático (webhook)** em `POST /api/billing/webhook/mercadopago`: público (quem chama é o
  Mercado Pago), confere a assinatura (`MERCADOPAGO_WEBHOOK_SECRET`) e reconsulta o pagamento na API
  antes de aplicar. Precisa de endereço público com HTTPS, então **só funciona em prod**; em dev a
  confirmação acontece quando a pessoa volta ao site ou abre a tela **Pagamentos**.
- Clicar duas vezes em comprar reaproveita a cobrança pendente (não gera duas). A cobrança vale 24 h.
- Pendente pode ser **cancelado** pela própria pessoa; se ela já tinha pago, o cancelamento vira
  confirmação.

**Configuração (`.env` do ambiente)**

| Variável | O quê |
|---|---|
| `BILLING_MODE=MERCADOPAGO` | liga o Mercado Pago |
| `MERCADOPAGO_ACCESS_TOKEN` | credencial. **Teste** começa com `TEST-` (não cobra ninguém); produção com `APP_USR-` |
| `MERCADOPAGO_WEBHOOK_SECRET` | "assinatura secreta" das notificações (Suas integrações → Webhooks). Só prod |
| `MERCADOPAGO_WEBHOOK_URL` | `https://seudominio.com.br/api/billing/webhook/mercadopago`. Só prod |

Sem o Access Token com `BILLING_MODE=MERCADOPAGO`, o backend **não sobe** (avisa no log).

**Testar sem cobrar ninguém**
1. Credencial de **teste** no `.env.dev` e `BILLING_MODE=MERCADOPAGO`; reiniciar o backend.
2. Comprar um destaque ou anúncio extra → abre o checkout de teste do Mercado Pago.
3. Pagar com um **cartão de teste** do Mercado Pago (lista em "Cartões de teste" na documentação
   deles). O nome do titular decide o resultado: `APRO` = aprovado, `OTHE` = recusado.
4. Voltar ao site: a página de retorno mostra "Pagamento aprovado" e o efeito já vale.

## Reembolso

No **/admin → aba Pagamentos**, cada pagamento pago tem o botão **Reembolsar** (motivo obrigatório).
A lista marca **"no prazo de 7 dias"** quando a compra ainda está no prazo de arrependimento do CDC
(art. 49, compra pela internet); fora dele o admin decide.

- **O dinheiro volta pelo Mercado Pago**, pelo mesmo meio (Pix ou cartão). Se o Mercado Pago recusar,
  nada é marcado: o pagamento continua PAGO e a mensagem de erro aparece.
- **A compra é desfeita:** destaque perde os dias daquele pagamento; anúncio extra ainda não usado some
  dos créditos; se já foi usado, o anúncio publicado com ele sai do ar.
- Compra do **modo simulado** não tem dinheiro a devolver: o reembolso só desfaz o efeito.
- **Reembolso feito direto no painel do Mercado Pago, ou estorno pedido no cartão (chargeback),**
  também é reconhecido pelo aviso automático (webhook): o pagamento vira REEMBOLSADO e a compra é desfeita.
- Status novo: `REEMBOLSADO` (com data, motivo e quem fez).

**Ainda não feito:** emissão de nota fiscal (ver abaixo).

## Nota fiscal (pendente)

O RachaAi vende serviço digital, então a nota é a **NFS-e** (nota de serviço), emitida por quem
vende. O Mercado Pago **não** emite por vocês. Decisões pendentes, com o contador:

1. **CNPJ** (MEI, se a atividade for permitida, ou ME no Simples Nacional). Sem CNPJ não há nota.
2. **Como emitir:**
   - **Manual** (começo): emitir no Emissor Nacional ou no site da prefeitura. Dá para ter no `/admin`
     uma lista de vendas pagas sem nota, com nome, CPF e valor de quem comprou.
   - **Automático** (quando crescer): serviço emissor de NFS-e por API (NFE.io, Focus NFe, eNotas,
     Nuvem Fiscal...). Pagamento aprovado → emite → PDF por e-mail; reembolso → cancela a nota.

O sistema já guarda o CPF de quem compra, que é o dado exigido do tomador na nota.

## Onde está no código

| O quê | Arquivo |
|---|---|
| Regras de compra, crédito, destaque, confirmação | `backend/.../billing/BillingService.java` |
| Preços e prazos (configuração) | `backend/.../billing/BillingProperties.java` e `application.yml` |
| Cota de 2 grátis e consumo do crédito ao publicar | `backend/.../listing/ListingService.java` |
| Desativação de anúncios extras vencidos | `backend/.../listing/ListingExpirationJob.java` |
| Destaque no topo da busca | `backend/.../match/DiscoveryService.java` (`HIGHLIGHT_FIRST_THEN_COMPATIBILITY`) |
| Tela de pagamentos | `frontend/src/pages/PaymentsPage.tsx` e `PaymentReturnPage.tsx` (volta do checkout) |
| Integração com o Mercado Pago | `backend/.../billing/gateway/MercadoPagoGateway.java` (contrato em `PaymentGateway.java`) |
| Compra de extra e botão Destacar | `frontend/src/pages/ListingPage.tsx` |
| Tabela | `pagamentos` (ver [03-BANCO-DE-DADOS.md](03-BANCO-DE-DADOS.md)) |
