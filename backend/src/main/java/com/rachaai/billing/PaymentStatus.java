package com.rachaai.billing;

public enum PaymentStatus {
    PENDENTE,
    PAGO,
    CANCELADO,
    /** O dinheiro voltou para quem comprou e o efeito da compra foi desfeito. */
    REEMBOLSADO
}
