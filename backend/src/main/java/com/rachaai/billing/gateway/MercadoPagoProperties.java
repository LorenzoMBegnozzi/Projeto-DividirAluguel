package com.rachaai.billing.gateway;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Credenciais do Mercado Pago (vêm do .env do ambiente; nunca no código).
 *
 * @param accessToken   Access Token da aplicação. Credencial de teste começa com TEST- e não cobra ninguém
 * @param webhookSecret "Assinatura secreta" das notificações (Suas integrações → Webhooks). Vazia = o
 *                      aviso não tem a assinatura conferida, mas continua seguro: o pagamento é sempre
 *                      reconsultado na API do Mercado Pago antes de valer
 * @param webhookUrl    endereço público que o Mercado Pago chama ao aprovar (precisa de domínio com HTTPS).
 *                      Vazio = sem aviso automático; a confirmação acontece quando a pessoa volta ao site
 * @param apiUrl        endereço da API (só muda em testes)
 */
@ConfigurationProperties(prefix = "app.billing.mercadopago")
public record MercadoPagoProperties(String accessToken, String webhookSecret, String webhookUrl, String apiUrl) {

    public boolean isTestCredential() {
        return accessToken != null && accessToken.startsWith("TEST-");
    }
}
