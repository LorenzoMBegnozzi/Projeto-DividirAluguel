# Cobrança: como o RachaAi ganha dinheiro

**Quem paga é quem anuncia.** Quem procura lugar (papel "Quero alugar") nunca paga nada.

## Regras

| O quê | Regra | Padrão |
|---|---|---|
| Anúncios grátis | Cada conta que anuncia tem até **3 anúncios ativos** grátis (vaga para dividir ou imóvel, em qualquer mistura) | 3 |
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
1. A pessoa já tem 3 anúncios grátis ativos e tenta publicar o 4º → a tela mostra "Você usou
   seus 3 anúncios grátis" e o botão *Comprar anúncio extra*.
2. Clicar cria um pagamento `PENDENTE` e abre a tela **Pagamentos**.
3. Depois que o pagamento é confirmado (`PAGO`), vira **1 crédito**.
4. A pessoa publica o anúncio; ele consome o crédito e ganha `expiresAt` (30 dias).

**Destaque**
1. Em **Meus anúncios**, botão *Destacar* no anúncio.
2. Pagamento `PENDENTE` → confirmado (`PAGO`) → o anúncio ganha `destaqueAte` = agora + 30 dias.
3. Na busca de quem aluga, o anúncio aparece com o selo "Destaque" no topo da lista.

## Modo simulado (situação atual)

Ainda **não há um gateway de pagamento conectado**. Por isso o projeto roda em
`BILLING_MODE=SIMULADO`:

- as compras são criadas normalmente, mas ficam `PENDENTE`;
- a tela **Pagamentos** mostra um aviso amarelo e o botão **Simular pagamento**, que confirma
  a compra sem cobrar ninguém (endpoint `POST /api/billing/payments/{id}/simulate`);
- com qualquer outro valor em `BILLING_MODE`, esse endpoint responde **403** e o botão some.
  Foi testado: com `BILLING_MODE=PRODUCAO`, a compra fica pendente para sempre até um gateway
  confirmá-la.

**Não use o modo simulado com usuários reais**: qualquer um "paga" sem pagar.

## Como ligar um pagamento de verdade (Pix)

O sistema já está preparado: toda a lógica de "o que acontece quando o pagamento é
confirmado" está em um único método, `BillingService.applyPaid(Payment)`. Falta trocar quem
o chama. Passo a passo sugerido:

1. **Escolher o gateway.** Para Pix no Brasil, Mercado Pago, Pagar.me, Asaas ou Stripe
   atendem. Criar a conta e obter as credenciais (chave de API) e a URL do webhook.
2. **Ao criar o pagamento** (`BillingService.createPayment`), chamar a API do gateway para gerar
   a cobrança Pix; guardar o id devolvido em `pagamentos.referencia_externa` e devolver ao
   front o QR Code / "copia e cola" para mostrar na tela **Pagamentos**.
3. **Criar um endpoint de webhook** (por exemplo `POST /api/billing/webhook`, **liberado** no
   `SecurityConfig` porque quem chama é o gateway, não um usuário logado). Ele deve:
   - **validar a assinatura** do gateway (obrigatório; sem isso qualquer pessoa forjaria
     pagamentos);
   - achar o pagamento por `referencia_externa`;
   - se o status for "aprovado" e o pagamento ainda estiver `PENDENTE`, chamar
     `billingService.applyPaid(payment)` (é idempotente pelo status: o gateway costuma reenviar
     o mesmo aviso).
4. **Guardar as credenciais** em variáveis de ambiente (`.env`), nunca no código.
5. Colocar `BILLING_MODE` com outro valor (ex.: `PRODUCAO`) para desligar o botão de simulação.
6. Testar primeiro no ambiente de testes (sandbox) do gateway.

Cuidados legais e fiscais (emitir nota fiscal, termos de uso, política de privacidade/LGPD,
regras de reembolso) fazem parte de abrir a cobrança e não estão no código.

## Onde está no código

| O quê | Arquivo |
|---|---|
| Regras de compra, crédito, destaque, confirmação | `backend/.../billing/BillingService.java` |
| Preços e prazos (configuração) | `backend/.../billing/BillingProperties.java` e `application.yml` |
| Cota de 3 grátis e consumo do crédito ao publicar | `backend/.../listing/ListingService.java` |
| Desativação de anúncios extras vencidos | `backend/.../listing/ListingExpirationJob.java` |
| Destaque no topo da busca | `backend/.../match/DiscoveryService.java` (`HIGHLIGHT_FIRST_THEN_COMPATIBILITY`) |
| Tela de pagamentos | `frontend/src/pages/PaymentsPage.tsx` |
| Compra de extra e botão Destacar | `frontend/src/pages/ListingPage.tsx` |
| Tabela | `pagamentos` (ver [03-BANCO-DE-DADOS.md](03-BANCO-DE-DADOS.md)) |
