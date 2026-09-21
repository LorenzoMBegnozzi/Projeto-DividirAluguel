package com.rachaai.billing.dto;

import java.math.BigDecimal;

public record PlanResponse(
        int freeListings,
        long freeListingsUsed,
        long extraCredits,
        BigDecimal extraListingPrice,
        int extraListingDays,
        BigDecimal highlightPrice,
        int highlightDays,
        boolean simulatedMode
) {
}
