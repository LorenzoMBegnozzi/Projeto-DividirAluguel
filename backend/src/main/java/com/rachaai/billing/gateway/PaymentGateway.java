package com.rachaai.billing.gateway;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Quem cobra de verdade (hoje: Mercado Pago). O resto do sistema só conversa com esta interface,
 * então trocar de gateway é escrever outra implementação.
 *
 * Regra de ouro: o sistema nunca confia no que o navegador diz ("voltei com status=approved").
 * A confirmação é sempre perguntada ao gateway, por findPaymentFor ou getPayment.
 */
public interface PaymentGateway {

    /** Nome gravado em pagamentos.gateway. */
    String name();

    /**
     * Cria a cobrança e devolve a página de checkout onde a pessoa escolhe Pix, crédito ou débito.
     *
     * @param reference  identificador do nosso pagamento, devolvido pelo gateway nas consultas
     * @param returnUrl  para onde o gateway manda a pessoa depois de pagar (ou desistir)
     */
    CheckoutSession createCheckout(String reference, String title, BigDecimal amount, String returnUrl);

    /** A tentativa mais relevante de pagar a cobrança (a aprovada, se houver; senão a mais recente). */
    Optional<GatewayPayment> findPaymentFor(String reference);

    /** Um pagamento pelo id do gateway (usado pelo aviso automático, o webhook). */
    Optional<GatewayPayment> getPayment(String gatewayPaymentId);

    /** Devolve o valor total de um pagamento aprovado (Pix ou cartão: volta pelo mesmo meio). */
    void refund(String gatewayPaymentId);

    /** Confere se o aviso (webhook) veio mesmo do gateway. */
    boolean isValidWebhookSignature(String signatureHeader, String requestId, String dataId);

    record CheckoutSession(String checkoutId, String checkoutUrl) {
    }

    /**
     * @param status  approved, pending, in_process, rejected, cancelled, refunded, charged_back
     * @param method  pix, credit_card, debit_card, account_money...
     */
    record GatewayPayment(String id, String reference, String status, String statusDetail, String method, BigDecimal amount) {

        public boolean isApproved() {
            return "approved".equals(status);
        }

        /** Dinheiro devolvido: reembolso (refunded) ou estorno pedido no cartão (charged_back). */
        public boolean isRefunded() {
            return "refunded".equals(status) || "charged_back".equals(status);
        }
    }
}
