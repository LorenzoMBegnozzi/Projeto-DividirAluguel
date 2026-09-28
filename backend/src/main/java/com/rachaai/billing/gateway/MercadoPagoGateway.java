package com.rachaai.billing.gateway;

import com.fasterxml.jackson.databind.JsonNode;
import com.rachaai.common.ApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Mercado Pago, Checkout Pro: a pessoa paga numa página do próprio Mercado Pago (Pix, crédito ou
 * débito) e volta ao site. O número do cartão nunca passa pelo RachaAi.
 *
 * APIs usadas: POST /checkout/preferences (cria a cobrança), GET /v1/payments/search (acha o
 * pagamento pela nossa referência), GET /v1/payments/{id} (confere um pagamento do webhook).
 */
@Component
public class MercadoPagoGateway implements PaymentGateway {

    private static final Logger log = LoggerFactory.getLogger(MercadoPagoGateway.class);

    private final MercadoPagoProperties props;
    private final RestClient http;

    public MercadoPagoGateway(MercadoPagoProperties props, RestClient.Builder builder) {
        this.props = props;
        this.http = builder
                .baseUrl(props.apiUrl() == null || props.apiUrl().isBlank() ? "https://api.mercadopago.com" : props.apiUrl())
                .defaultHeader("Authorization", "Bearer " + props.accessToken())
                .build();
    }

    @Override
    public String name() {
        return "MERCADOPAGO";
    }

    @Override
    public CheckoutSession createCheckout(String reference, String title, BigDecimal amount, String returnUrl) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("items", List.of(Map.of(
                "id", reference,
                "title", title,
                "quantity", 1,
                "currency_id", "BRL",
                "unit_price", amount)));
        body.put("external_reference", reference);
        body.put("statement_descriptor", "RACHAAI");
        body.put("back_urls", Map.of("success", returnUrl, "pending", returnUrl, "failure", returnUrl));
        // O Mercado Pago só volta sozinho ao site (auto_return) para endereço https.
        if (returnUrl.startsWith("https://")) {
            body.put("auto_return", "approved");
        }
        // Pix, crédito e débito (e saldo do Mercado Pago). Boleto fica de fora: leva dias para compensar.
        body.put("payment_methods", Map.of(
                "excluded_payment_types", List.of(Map.of("id", "ticket"), Map.of("id", "atm")),
                "installments", 1));
        // A cobrança vale por 24 h; depois disso é preciso gerar outra.
        OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
        body.put("expires", true);
        body.put("expiration_date_from", now.format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        body.put("expiration_date_to", now.plusHours(24).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        if (props.webhookUrl() != null && !props.webhookUrl().isBlank()) {
            body.put("notification_url", props.webhookUrl());
        }

        JsonNode res = call(() -> http.post().uri("/checkout/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Idempotency-Key", UUID.randomUUID().toString())
                .body(body)
                .retrieve()
                .body(JsonNode.class));
        // Com credencial de teste (TEST-), o link é o do ambiente de testes (sandbox).
        String url = props.isTestCredential() && res.hasNonNull("sandbox_init_point")
                ? res.get("sandbox_init_point").asText()
                : res.get("init_point").asText();
        return new CheckoutSession(res.get("id").asText(), url);
    }

    @Override
    public Optional<GatewayPayment> findPaymentFor(String reference) {
        JsonNode res = call(() -> http.get()
                .uri(u -> u.path("/v1/payments/search")
                        .queryParam("external_reference", reference)
                        .queryParam("sort", "date_created")
                        .queryParam("criteria", "desc")
                        .build())
                .retrieve()
                .body(JsonNode.class));
        GatewayPayment latest = null;
        for (JsonNode p : res.path("results")) {
            GatewayPayment payment = toPayment(p);
            if (payment.isApproved()) {
                return Optional.of(payment);
            }
            if (latest == null) {
                latest = payment;
            }
        }
        return Optional.ofNullable(latest);
    }

    @Override
    public Optional<GatewayPayment> getPayment(String gatewayPaymentId) {
        try {
            JsonNode p = http.get().uri("/v1/payments/{id}", gatewayPaymentId).retrieve().body(JsonNode.class);
            return Optional.ofNullable(p).map(MercadoPagoGateway::toPayment);
        } catch (RestClientResponseException e) {
            if (e.getStatusCode().value() == 404) {
                return Optional.empty();
            }
            throw unavailable(e);
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    @Override
    public void refund(String gatewayPaymentId) {
        // Reembolso total (corpo vazio). A chave de idempotência evita reembolsar duas vezes se a
        // chamada for repetida.
        call(() -> http.post().uri("/v1/payments/{id}/refunds", gatewayPaymentId)
                .contentType(MediaType.APPLICATION_JSON)
                .header("X-Idempotency-Key", "refund-" + gatewayPaymentId)
                .body(Map.of())
                .retrieve()
                .body(JsonNode.class));
    }

    private static GatewayPayment toPayment(JsonNode p) {
        return new GatewayPayment(
                p.path("id").asText(),
                p.path("external_reference").asText(null),
                p.path("status").asText(),
                p.path("status_detail").asText(null),
                // pix aparece como payment_method_id=pix (payment_type_id=bank_transfer)
                "pix".equals(p.path("payment_method_id").asText()) ? "pix" : p.path("payment_type_id").asText(null),
                p.hasNonNull("transaction_amount") ? p.get("transaction_amount").decimalValue() : null);
    }

    /**
     * Confere a assinatura do aviso (webhook) do Mercado Pago. Cabeçalho x-signature = "ts=...,v1=..." e
     * v1 = HMAC-SHA256(segredo, "id:<data.id>;request-id:<x-request-id>;ts:<ts>;").
     * Sem segredo configurado devolve true: o aviso só serve para "vá conferir", e a conferência
     * sempre consulta a API do Mercado Pago.
     */
    @Override
    public boolean isValidWebhookSignature(String signatureHeader, String requestId, String dataId) {
        if (props.webhookSecret() == null || props.webhookSecret().isBlank()) {
            return true;
        }
        if (signatureHeader == null || dataId == null) {
            return false;
        }
        String ts = null;
        String v1 = null;
        for (String part : signatureHeader.split(",")) {
            String[] kv = part.trim().split("=", 2);
            if (kv.length == 2 && kv[0].equals("ts")) ts = kv[1];
            if (kv.length == 2 && kv[0].equals("v1")) v1 = kv[1];
        }
        if (ts == null || v1 == null) {
            return false;
        }
        StringBuilder manifest = new StringBuilder("id:").append(dataId.toLowerCase()).append(';');
        if (requestId != null && !requestId.isBlank()) {
            manifest.append("request-id:").append(requestId).append(';');
        }
        manifest.append("ts:").append(ts).append(';');
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(props.webhookSecret().getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = HexFormat.of().formatHex(mac.doFinal(manifest.toString().getBytes(StandardCharsets.UTF_8)));
            return MessageDigest.isEqual(expected.getBytes(StandardCharsets.UTF_8), v1.getBytes(StandardCharsets.UTF_8));
        } catch (Exception e) {
            return false;
        }
    }

    private JsonNode call(java.util.function.Supplier<JsonNode> request) {
        try {
            return request.get();
        } catch (RestClientResponseException e) {
            log.error("Mercado Pago respondeu {}: {}", e.getStatusCode().value(), e.getResponseBodyAsString());
            throw unavailable(e);
        } catch (RestClientException e) {
            throw unavailable(e);
        }
    }

    private static ApiException unavailable(Exception e) {
        log.error("Falha ao falar com o Mercado Pago", e);
        return new ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY,
                "Não foi possível falar com o Mercado Pago agora. Tente de novo em alguns instantes.");
    }
}
