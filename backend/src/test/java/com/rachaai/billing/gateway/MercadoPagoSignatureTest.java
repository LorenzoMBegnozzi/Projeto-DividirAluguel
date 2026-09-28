package com.rachaai.billing.gateway;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestClient;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Assinatura do aviso do Mercado Pago (webhook)")
class MercadoPagoSignatureTest {

    private static final String SECRET = "segredo-do-webhook";

    private MercadoPagoGateway gateway(String secret) {
        return new MercadoPagoGateway(new MercadoPagoProperties("TEST-x", secret, "", "http://localhost"), RestClient.builder());
    }

    private static String sign(String dataId, String requestId, String ts) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String manifest = "id:" + dataId + ";request-id:" + requestId + ";ts:" + ts + ";";
        return HexFormat.of().formatHex(mac.doFinal(manifest.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    @DisplayName("aceita a assinatura certa")
    void acceptsValidSignature() throws Exception {
        String header = "ts=1704908010,v1=" + sign("123456", "req-1", "1704908010");
        assertThat(gateway(SECRET).isValidWebhookSignature(header, "req-1", "123456")).isTrue();
    }

    @Test
    @DisplayName("recusa assinatura errada, de outro pagamento ou sem cabeçalho")
    void rejectsInvalidSignature() throws Exception {
        String header = "ts=1704908010,v1=" + sign("123456", "req-1", "1704908010");
        MercadoPagoGateway g = gateway(SECRET);
        assertThat(g.isValidWebhookSignature(header, "req-1", "999999")).isFalse();
        assertThat(g.isValidWebhookSignature(header, "req-2", "123456")).isFalse();
        assertThat(g.isValidWebhookSignature("ts=1,v1=abc", "req-1", "123456")).isFalse();
        assertThat(g.isValidWebhookSignature(null, "req-1", "123456")).isFalse();
    }

    @Test
    @DisplayName("sem segredo configurado, deixa passar (a conferência é feita consultando o Mercado Pago)")
    void withoutSecretAllows() {
        assertThat(gateway("").isValidWebhookSignature(null, null, "1")).isTrue();
    }
}
