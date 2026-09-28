-- Reembolso de compras (CDC, art. 49: 7 dias de arrependimento em compra pela internet).
-- REEMBOLSADO: o dinheiro voltou (pelo admin ou direto no Mercado Pago) e o efeito da compra
-- foi desfeito (dias de destaque retirados / anúncio extra fora do ar).
ALTER TABLE pagamentos DROP CONSTRAINT ck_pagamentos_status;
ALTER TABLE pagamentos ADD CONSTRAINT ck_pagamentos_status
    CHECK (status IN ('PENDENTE', 'PAGO', 'CANCELADO', 'REEMBOLSADO'));

ALTER TABLE pagamentos ADD (
    reembolsado_em      TIMESTAMP,
    reembolsado_por_id  NUMBER,
    motivo_reembolso    VARCHAR2(500 CHAR)
);
ALTER TABLE pagamentos ADD CONSTRAINT fk_pagamentos_reembolsado_por
    FOREIGN KEY (reembolsado_por_id) REFERENCES usuarios (id) ON DELETE SET NULL;
