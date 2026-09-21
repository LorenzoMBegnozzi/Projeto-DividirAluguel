package com.rachaai.billing;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.math.BigDecimal;

@ConfigurationProperties(prefix = "app.billing")
public record BillingProperties(
        String mode,
        int freeListings,
        BigDecimal extraListingPrice,
        int extraListingDays,
        BigDecimal highlightPrice,
        int highlightDays
) {
    public boolean isSimulated() {
        return "SIMULADO".equalsIgnoreCase(mode);
    }
}
