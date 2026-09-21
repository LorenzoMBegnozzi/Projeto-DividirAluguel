package com.rachaai.billing.dto;

import com.rachaai.billing.PaymentType;
import jakarta.validation.constraints.NotNull;

public record PaymentRequest(@NotNull PaymentType type, Long listingId) {
}
