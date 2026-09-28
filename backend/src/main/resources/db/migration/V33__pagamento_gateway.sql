-- Pagamento real pelo Mercado Pago (Checkout Pro: Pix, cartão de crédito e de débito).
--   gateway              : quem processou (MERCADOPAGO; nulo = modo simulado/antigo)
--   link_pagamento       : página do checkout do gateway (para "Pagar agora" retomar o pagamento)
--   gateway_pagamento_id : id do pagamento aprovado no gateway (para conferência e reembolso)
--   metodo               : como a pessoa pagou (pix, credit_card, debit_card, account_money...)
--   status_gateway       : último status informado pelo gateway (approved, pending, rejected...)
-- referencia_externa (já existia) guarda o id da cobrança (preferência) criada no gateway.
ALTER TABLE pagamentos ADD (
    gateway               VARCHAR2(20 CHAR),
    link_pagamento        VARCHAR2(500 CHAR),
    gateway_pagamento_id  VARCHAR2(40 CHAR),
    metodo                VARCHAR2(30 CHAR),
    status_gateway        VARCHAR2(30 CHAR)
);
