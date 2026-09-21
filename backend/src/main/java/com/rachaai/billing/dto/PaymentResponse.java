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
        Instant paidAt
) {
    public static PaymentResponse from(Payment payment) {
        return new PaymentResponse(
                payment.getId(),
                payment.getType(),
                payment.getListingId(),
                payment.getAmount(),
                payment.getStatus(),
                payment.getCreatedAt(),
                payment.getPaidAt()
        );
    }
}
