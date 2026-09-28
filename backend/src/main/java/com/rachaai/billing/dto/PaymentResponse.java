package com.rachaai.billing.dto;

import com.rachaai.billing.Payment;
import com.rachaai.billing.PaymentStatus;
import com.rachaai.billing.PaymentType;

import java.math.BigDecimal;
import java.time.Instant;

public record PaymentResponse(
        Long id,
        PaymentType type,
        Long listingId,
        BigDecimal amount,
        PaymentStatus status,
        Instant createdAt,
        Instant paidAt,
        /** Página do Mercado Pago para pagar (só em pagamento pendente pelo gateway). */
        String checkoutUrl,
        /** Como pagou: pix, credit_card, debit_card, account_money... */
        String method,
        /** Último status no gateway (approved, pending, rejected...), para explicar um pendente. */
        String gatewayStatus
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getType(),
                payment.getListingId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getCreatedAt(),
                payment.getPaidAt(),
                payment.getStatus() == com.rachaai.billing.PaymentStatus.PENDENTE ? payment.getCheckoutUrl() : null,
                payment.getMethod(),
                payment.getGatewayStatus()
        );
    }
}
