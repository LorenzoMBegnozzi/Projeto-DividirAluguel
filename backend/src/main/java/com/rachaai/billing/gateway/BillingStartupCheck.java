package com.rachaai.billing.gateway;

import com.rachaai.billing.BillingProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * No modo MERCADOPAGO, sem o Access Token o backend não sobe: melhor falhar na hora do que deixar
 * as pessoas clicarem em "Pagar" e receberem erro.
 */
@Component
public class BillingStartupCheck {

    private static final Logger log = LoggerFactory.getLogger(BillingStartupCheck.class);

    public BillingStartupCheck(BillingProperties billing, MercadoPagoProperties mercadoPago) {
        if (billing.isMercadoPago()) {
            if (mercadoPago.accessToken() == null || mercadoPago.accessToken().isBlank()) {
                throw new IllegalStateException(
                        "BILLING_MODE=MERCADOPAGO, mas MERCADOPAGO_ACCESS_TOKEN está vazio no .env do ambiente.");
            }
            log.info("Cobrança pelo Mercado Pago ({})", mercadoPago.isTestCredential() ? "credencial de TESTE" : "credencial de PRODUÇÃO");
        }
    }
}
