package com.rachaai.billing.dto;

import com.rachaai.billing.BillingProperties;

import java.math.BigDecimal;

/** Preços públicos (seção de preços da landing): os mesmos valores que a cobrança usa. */
public record PricesResponse(
        int freeListings,
        BigDecimal extraListingPrice,
        int extraListingDays,
        BigDecimal highlightPrice,
        int highlightDays
) {
    public static PricesResponse from(BillingProperties props) {
        return new PricesResponse(
                props.freeListings(),
                props.extraListingPrice(),
                props.extraListingDays(),
                props.highlightPrice(),
                props.highlightDays()
        );
    }
}
