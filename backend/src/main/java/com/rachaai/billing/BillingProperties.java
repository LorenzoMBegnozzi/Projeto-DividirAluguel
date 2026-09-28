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
    /** SIMULADO: botão "Simular pagamento", ninguém é cobrado (dev/homolog sem gateway). */
    public boolean isSimulated() {
        return "SIMULADO".equalsIgnoreCase(mode);
    }

    /** MERCADOPAGO: cobrança real (ou de teste, com credencial TEST-) pelo Mercado Pago. */
    public boolean isMercadoPago() {
        return "MERCADOPAGO".equalsIgnoreCase(mode);
    }
}
