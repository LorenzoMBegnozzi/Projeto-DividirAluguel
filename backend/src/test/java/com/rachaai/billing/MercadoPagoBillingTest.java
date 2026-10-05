package com.rachaai.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.rachaai.billing.gateway.PaymentGateway;
import com.rachaai.billing.gateway.PaymentGateway.CheckoutSession;
import com.rachaai.billing.gateway.PaymentGateway.GatewayPayment;
import com.rachaai.listing.ListingRepository;
import com.rachaai.support.ApiTestSupport;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Map;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Pagamento pelo Mercado Pago com o gateway trocado por um dublê: cada teste diz o que o
 * "Mercado Pago" responde e confere o que o sistema faz. Regra central: só vale o que o gateway
 * confirma, e no valor certo.
 */
@TestPropertySource(properties = {
        "app.billing.mode=MERCADOPAGO",
        "app.billing.mercadopago.access-token=TEST-token-falso",
        "app.billing.extra-listing-price=1.00",
        "app.billing.highlight-price=1.00",
})
@DisplayName("Pagamento pelo Mercado Pago (Pix, crédito e débito)")
class MercadoPagoBillingTest extends ApiTestSupport {

    @MockBean
    private PaymentGateway gateway;

    @Autowired
    private ListingRepository listingRepository;

    @BeforeEach
    void gatewayDefaults() {
        when(gateway.name()).thenReturn("MERCADOPAGO");
        when(gateway.createCheckout(anyString(), anyString(), any(), anyString()))
                .thenAnswer(inv -> new CheckoutSession("pref-" + inv.getArgument(0), "https://mp.test/checkout/" + inv.getArgument(0)));
        when(gateway.isValidWebhookSignature(any(), any(), any())).thenReturn(true);
    }

    private JsonNode buyExtra(Account a) throws Exception {
        return body(mvc.perform(jsonPost("/api/billing/payments", a, Map.of("type", "ANUNCIO_EXTRA"))).andExpect(status().isOk()));
    }

    private String referenceOf(long paymentId) {
        return "rachaai-test-" + paymentId;
    }

    @Test
    @DisplayName("comprar cria a cobrança no Mercado Pago e devolve o link do checkout; clicar de novo reaproveita")
    void createsCheckoutAndReusesPending() throws Exception {
        Account a = advertiser();
        JsonNode first = buyExtra(a);
        long id = first.get("id").asLong();
        assertThat(first.get("status").asText()).isEqualTo("PENDENTE");
        assertThat(first.get("checkoutUrl").asText()).isEqualTo("https://mp.test/checkout/" + referenceOf(id));

        ArgumentCaptor<String> returnUrl = ArgumentCaptor.forClass(String.class);
        verify(gateway).createCheckout(eq(referenceOf(id)), anyString(), eq(new BigDecimal("1.00")), returnUrl.capture());
        assertThat(returnUrl.getValue()).endsWith("/pagamentos/retorno?pagamento=" + id);

        JsonNode second = buyExtra(a);
        assertThat(second.get("id").asLong()).isEqualTo(id);
        verify(gateway, times(1)).createCheckout(eq(referenceOf(id)), anyString(), any(), anyString());
    }

    @Test
    @DisplayName("aprovado no Mercado Pago (Pix): vira PAGO e libera o crédito de anúncio extra")
    void approvedPaymentGrantsCredit() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.findPaymentFor(referenceOf(id))).thenReturn(Optional.of(
                new GatewayPayment("mp-1", referenceOf(id), "approved", "accredited", "pix", new BigDecimal("1.00"))));

        mvc.perform(auth(post("/api/billing/payments/" + id + "/sincronizar"), a))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PAGO"))
                .andExpect(jsonPath("$.method").value("pix"))
                .andExpect(jsonPath("$.checkoutUrl").doesNotExist());
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.extraCredits").value(1));
    }

    @Test
    @DisplayName("recusado (cartão): continua pendente, com o motivo, e nada é liberado")
    void rejectedPaymentStaysPending() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.findPaymentFor(referenceOf(id))).thenReturn(Optional.of(
                new GatewayPayment("mp-2", referenceOf(id), "rejected", "cc_rejected_insufficient_amount", "credit_card", new BigDecimal("1.00"))));

        mvc.perform(auth(post("/api/billing/payments/" + id + "/sincronizar"), a))
                .andExpect(jsonPath("$.status").value("PENDENTE"))
                .andExpect(jsonPath("$.gatewayStatus").value("rejected"));
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.extraCredits").value(0));
    }

    @Test
    @DisplayName("aprovado com valor menor que o cobrado não é aceito")
    void underpaidIsNotAccepted() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.findPaymentFor(referenceOf(id))).thenReturn(Optional.of(
                new GatewayPayment("mp-3", referenceOf(id), "approved", "accredited", "pix", new BigDecimal("0.01"))));

        mvc.perform(auth(post("/api/billing/payments/" + id + "/sincronizar"), a))
                .andExpect(jsonPath("$.status").value("PENDENTE"));
    }

    @Test
    @DisplayName("aviso automático (webhook) aprova o destaque; o mesmo aviso repetido não soma dias de novo")
    void webhookIsIdempotent() throws Exception {
        Account a = advertiser();
        Map<String, Object> vaga = listingBody("TEM_VAGA");
        vaga.put("availableSlots", 1);
        long listingId = createListing(a, vaga);
        long id = body(mvc.perform(jsonPost("/api/billing/payments", a, Map.of("type", "DESTAQUE", "listingId", listingId)))
                .andExpect(status().isOk())).get("id").asLong();
        when(gateway.getPayment("mp-9")).thenReturn(Optional.of(
                new GatewayPayment("mp-9", referenceOf(id), "approved", "accredited", "credit_card", new BigDecimal("1.00"))));

        String notice = "{\"type\":\"payment\",\"data\":{\"id\":\"mp-9\"}}";
        // Sem login: quem chama é o Mercado Pago.
        mvc.perform(post("/api/billing/webhook/mercadopago").contentType(MediaType.APPLICATION_JSON).content(notice))
                .andExpect(status().isOk());
        Instant firstUntil = listingRepository.findById(listingId).orElseThrow().getHighlightedUntil();
        assertThat(firstUntil).isAfter(Instant.now().plusSeconds(29L * 24 * 3600));

        mvc.perform(post("/api/billing/webhook/mercadopago").contentType(MediaType.APPLICATION_JSON).content(notice))
                .andExpect(status().isOk());
        assertThat(listingRepository.findById(listingId).orElseThrow().getHighlightedUntil()).isEqualTo(firstUntil);

        mvc.perform(auth(get("/api/billing/payments"), a))
                .andExpect(jsonPath("$[0].status").value("PAGO"))
                .andExpect(jsonPath("$[0].method").value("credit_card"));
    }

    @Test
    @DisplayName("webhook com assinatura inválida é recusado")
    void webhookWithBadSignatureIsRejected() throws Exception {
        when(gateway.isValidWebhookSignature(any(), any(), any())).thenReturn(false);
        mvc.perform(post("/api/billing/webhook/mercadopago").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"payment\",\"data\":{\"id\":\"mp-x\"}}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("webhook de pagamento de outro ambiente (ou de fora) é ignorado")
    void webhookFromOtherEnvironmentIsIgnored() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.getPayment("mp-hml")).thenReturn(Optional.of(
                new GatewayPayment("mp-hml", "rachaai-homolog-" + id, "approved", "accredited", "pix", new BigDecimal("1.00"))));

        mvc.perform(post("/api/billing/webhook/mercadopago").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"payment\",\"data\":{\"id\":\"mp-hml\"}}"))
                .andExpect(status().isOk());
        mvc.perform(auth(get("/api/billing/payments"), a)).andExpect(jsonPath("$[0].status").value("PENDENTE"));
    }

    @Test
    @DisplayName("ninguém consulta nem cancela o pagamento de outra pessoa; o dono cancela o pendente")
    void onlyOwnerCanSyncOrCancel() throws Exception {
        Account owner = advertiser();
        Account other = advertiser();
        long id = buyExtra(owner).get("id").asLong();

        mvc.perform(auth(post("/api/billing/payments/" + id + "/sincronizar"), other)).andExpect(status().isNotFound());
        mvc.perform(auth(post("/api/billing/payments/" + id + "/cancelar"), other)).andExpect(status().isNotFound());

        when(gateway.findPaymentFor(referenceOf(id))).thenReturn(Optional.empty());
        mvc.perform(auth(post("/api/billing/payments/" + id + "/cancelar"), owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELADO"));
    }

    @Test
    @DisplayName("reembolso pelo admin devolve o dinheiro no Mercado Pago e tira o crédito")
    void adminRefundCallsGateway() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.findPaymentFor(referenceOf(id))).thenReturn(Optional.of(
                new GatewayPayment("mp-77", referenceOf(id), "approved", "accredited", "debit_card", new BigDecimal("1.00"))));
        mvc.perform(auth(post("/api/billing/payments/" + id + "/sincronizar"), a)).andExpect(jsonPath("$.status").value("PAGO"));

        mvc.perform(jsonPost("/api/admin/pagamentos/" + id + "/reembolsar", admin(), Map.of("reason", "Arrependimento (CDC)")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REEMBOLSADO"))
                .andExpect(jsonPath("$.method").value("debit_card"));
        verify(gateway).refund("mp-77");
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.extraCredits").value(0));
    }

    @Test
    @DisplayName("se o Mercado Pago recusar o reembolso, nada fica marcado como reembolsado")
    void failedGatewayRefundChangesNothing() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.findPaymentFor(referenceOf(id))).thenReturn(Optional.of(
                new GatewayPayment("mp-78", referenceOf(id), "approved", "accredited", "pix", new BigDecimal("1.00"))));
        mvc.perform(auth(post("/api/billing/payments/" + id + "/sincronizar"), a)).andExpect(status().isOk());
        org.mockito.Mockito.doThrow(new com.rachaai.common.ApiException(org.springframework.http.HttpStatus.BAD_GATEWAY, "falhou"))
                .when(gateway).refund("mp-78");

        mvc.perform(jsonPost("/api/admin/pagamentos/" + id + "/reembolsar", admin(), Map.of("reason", "teste")))
                .andExpect(status().isBadGateway());
        mvc.perform(auth(get("/api/billing/payments"), a)).andExpect(jsonPath("$[0].status").value("PAGO"));
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.extraCredits").value(1));
    }

    @Test
    @DisplayName("reembolso ou estorno feito direto no Mercado Pago também desfaz a compra (aviso automático)")
    void refundDoneAtGatewayIsDetected() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        when(gateway.getPayment("mp-80")).thenReturn(Optional.of(
                new GatewayPayment("mp-80", referenceOf(id), "approved", "accredited", "credit_card", new BigDecimal("1.00"))));
        String notice = "{" + q("type") + ":" + q("payment") + "," + q("data") + ":{" + q("id") + ":" + q("mp-80") + "}}";
        mvc.perform(post("/api/billing/webhook/mercadopago").contentType(MediaType.APPLICATION_JSON).content(notice)).andExpect(status().isOk());
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.extraCredits").value(1));

        when(gateway.getPayment("mp-80")).thenReturn(Optional.of(
                new GatewayPayment("mp-80", referenceOf(id), "charged_back", "reimbursed", "credit_card", new BigDecimal("1.00"))));
        mvc.perform(post("/api/billing/webhook/mercadopago").contentType(MediaType.APPLICATION_JSON).content(notice)).andExpect(status().isOk());
        mvc.perform(auth(get("/api/billing/payments"), a)).andExpect(jsonPath("$[0].status").value("REEMBOLSADO"));
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.extraCredits").value(0));
    }

    private static String q(String text) {
        return '"' + text + '"';
    }

    @Test
    @DisplayName("o botão \"Simular pagamento\" não existe no modo Mercado Pago")
    void simulateIsForbidden() throws Exception {
        Account a = advertiser();
        long id = buyExtra(a).get("id").asLong();
        mvc.perform(auth(post("/api/billing/payments/" + id + "/simulate"), a)).andExpect(status().isForbidden());
        mvc.perform(auth(get("/api/billing/plan"), a)).andExpect(jsonPath("$.paymentMode").value("MERCADOPAGO"));
    }

    @Test
    @DisplayName("a tabela de preços da landing é pública e usa os mesmos valores da cobrança")
    void publicPrices() throws Exception {
        mvc.perform(get("/api/billing/precos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.freeListings").value(3))
                .andExpect(jsonPath("$.extraListingPrice").value(1.00))
                .andExpect(jsonPath("$.highlightPrice").value(1.00))
                .andExpect(jsonPath("$.highlightDays").value(30))
                .andExpect(jsonPath("$.paymentMode").doesNotExist());
    }
}
