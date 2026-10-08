package com.rachaai.admin;

import com.fasterxml.jackson.databind.JsonNode;
import com.rachaai.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Área de administração e moderação")
class AdminModerationTest extends ApiTestSupport {

    @Test
    @DisplayName("quem não é admin não acessa /api/admin")
    void nonAdminIsForbidden() throws Exception {
        Account a = renter("FEMININO");
        mvc.perform(auth(get("/api/admin/resumo"), a)).andExpect(status().isForbidden());
        mvc.perform(auth(get("/api/admin/usuarios"), a)).andExpect(status().isForbidden());
        mvc.perform(auth(get("/api/admin/resumo"), admin())).andExpect(status().isOk());
    }

    @Test
    @DisplayName("resolver denúncia bloqueando: a conta perde o login e os anúncios somem; desbloquear devolve")
    void blockingFromReport() throws Exception {
        Account admin = admin();
        Account scammer = advertiser();
        Map<String, Object> vaga = listingBody("TEM_VAGA");
        vaga.put("availableSlots", 1);
        long listingId = createListing(scammer, vaga);
        Account victim = renter("FEMININO");
        assertThat(searchIds(victim)).contains(listingId);

        long reportId = body(mvc.perform(jsonPost("/api/denuncias", victim, Map.of(
                "denunciadoId", scammer.id(), "motivo", "GOLPE_OU_FRAUDE", "descricao", "Pediu PIX adiantado")))
                .andExpect(status().isOk())).get("id").asLong();

        mvc.perform(jsonPost("/api/admin/denuncias/" + reportId + "/fechar", admin,
                        Map.of("status", "RESOLVIDA", "note", "confirmado", "blockReported", true)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("RESOLVIDA"))
                .andExpect(jsonPath("$.reported.blocked").value(true));

        mvc.perform(auth(get("/api/users/me"), scammer)).andExpect(status().isForbidden());
        login(scammer.email(), PASSWORD, uniqueIp())
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("bloqueada")));
        // Com a senha errada, não revela que a conta está bloqueada.
        login(scammer.email(), "errada", uniqueIp())
                .andExpect(status().isUnauthorized());
        assertThat(searchIds(victim)).doesNotContain(listingId);

        mvc.perform(auth(post("/api/admin/usuarios/" + scammer.id() + "/desbloquear"), admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.blocked").value(false));
        login(scammer.email(), PASSWORD, uniqueIp()).andExpect(status().isOk());
        assertThat(searchIds(victim)).contains(listingId);
    }

    @Test
    @DisplayName("admin não bloqueia a si mesmo")
    void adminCannotBlockSelf() throws Exception {
        Account admin = admin();
        mvc.perform(jsonPost("/api/admin/usuarios/" + admin.id() + "/bloquear", admin, Map.of("reason", "teste")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("admin tira anúncio do ar")
    void adminDeactivatesListing() throws Exception {
        Account owner = advertiser();
        Map<String, Object> vaga = listingBody("TEM_VAGA");
        vaga.put("availableSlots", 1);
        long listingId = createListing(owner, vaga);
        Account viewer = renter("FEMININO");
        assertThat(searchIds(viewer)).contains(listingId);

        mvc.perform(auth(post("/api/admin/anuncios/" + listingId + "/desativar"), admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false));
        assertThat(searchIds(viewer)).doesNotContain(listingId);
    }

    @Test
    @DisplayName("reembolso (modo simulado): só admin, só pagamento pago, e tira os dias de destaque")
    void refundRevertsHighlight() throws Exception {
        Account owner = advertiser();
        Map<String, Object> vaga = listingBody("TEM_VAGA");
        vaga.put("availableSlots", 1);
        long listingId = createListing(owner, vaga);
        long paymentId = body(mvc.perform(jsonPost("/api/billing/payments", owner, Map.of("type", "DESTAQUE", "listingId", listingId)))
                .andExpect(status().isOk())).get("id").asLong();
        Account admin = admin();

        // Pendente ainda não pode ser reembolsado.
        mvc.perform(jsonPost("/api/admin/pagamentos/" + paymentId + "/reembolsar", admin, Map.of("reason", "teste")))
                .andExpect(status().isConflict());

        mvc.perform(auth(post("/api/billing/payments/" + paymentId + "/simulate"), owner)).andExpect(status().isOk());
        mvc.perform(auth(get("/api/listings/" + listingId), owner)).andExpect(jsonPath("$.highlighted").value(true));

        mvc.perform(jsonPost("/api/admin/pagamentos/" + paymentId + "/reembolsar", owner, Map.of("reason", "quero")))
                .andExpect(status().isForbidden());
        mvc.perform(jsonPost("/api/admin/pagamentos/" + paymentId + "/reembolsar", admin, Map.of("reason", "")))
                .andExpect(status().isBadRequest());

        mvc.perform(jsonPost("/api/admin/pagamentos/" + paymentId + "/reembolsar", admin, Map.of("reason", "Arrependimento (CDC)")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REEMBOLSADO"))
                .andExpect(jsonPath("$.refundReason").value("Arrependimento (CDC)"))
                .andExpect(jsonPath("$.withinWithdrawalPeriod").value(true));
        mvc.perform(auth(get("/api/listings/" + listingId), owner)).andExpect(jsonPath("$.highlighted").value(false));

        // Reembolsar de novo não é possível.
        mvc.perform(jsonPost("/api/admin/pagamentos/" + paymentId + "/reembolsar", admin, Map.of("reason", "de novo")))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("reembolso de anúncio extra já usado tira o anúncio do ar")
    void refundUsedExtraDeactivatesListing() throws Exception {
        Account owner = advertiser();
        for (int i = 0; i < 2; i++) {   // ocupa os 2 grátis
            createListing(owner, listingBody("ESTABELECIMENTO"));
        }
        long paymentId = body(mvc.perform(jsonPost("/api/billing/payments", owner, Map.of("type", "ANUNCIO_EXTRA")))
                .andExpect(status().isOk())).get("id").asLong();
        mvc.perform(auth(post("/api/billing/payments/" + paymentId + "/simulate"), owner)).andExpect(status().isOk());
        long extraListing = createListing(owner, listingBody("ESTABELECIMENTO"));

        mvc.perform(jsonPost("/api/admin/pagamentos/" + paymentId + "/reembolsar", admin(), Map.of("reason", "teste")))
                .andExpect(status().isOk());
        java.util.List<Long> activeIds = new java.util.ArrayList<>();
        body(mvc.perform(auth(get("/api/listings/mine"), owner))).forEach(l -> activeIds.add(l.get("id").asLong()));
        assertThat(activeIds).doesNotContain(extraListing).hasSize(2);
    }

    @Test
    @DisplayName("dashboard: só admin, e os números acompanham cadastros, vendas e vagas fechadas")
    void dashboardReflectsActivity() throws Exception {
        Account admin = admin();
        Account renter = renter("FEMININO");
        mvc.perform(auth(get("/api/admin/dashboard"), renter)).andExpect(status().isForbidden());

        JsonNode before = body(mvc.perform(auth(get("/api/admin/dashboard?dias=7"), admin)).andExpect(status().isOk()));
        assertThat(before.get("days").asInt()).isEqualTo(7);

        Account owner = advertiser();
        Map<String, Object> vaga = listingBody("TEM_VAGA");
        vaga.put("availableSlots", 1);
        long listingId = createListing(owner, vaga);
        long paymentId = body(mvc.perform(jsonPost("/api/billing/payments", owner, Map.of("type", "DESTAQUE", "listingId", listingId)))
                .andExpect(status().isOk())).get("id").asLong();
        mvc.perform(auth(post("/api/billing/payments/" + paymentId + "/simulate"), owner)).andExpect(status().isOk());
        mvc.perform(jsonPost("/api/listings/" + listingId + "/indisponivel", owner, Map.of())).andExpect(status().isOk());

        JsonNode after = body(mvc.perform(auth(get("/api/admin/dashboard?dias=7"), admin)).andExpect(status().isOk()));
        JsonNode k0 = before.get("kpis"), k1 = after.get("kpis");
        assertThat(k1.get("newUsers").asLong()).isEqualTo(k0.get("newUsers").asLong() + 1);
        assertThat(k1.get("newAdvertisers").asLong()).isEqualTo(k0.get("newAdvertisers").asLong() + 1);
        assertThat(k1.get("sales").asLong()).isEqualTo(k0.get("sales").asLong() + 1);
        assertThat(k1.get("dealsClosed").asLong()).isEqualTo(k0.get("dealsClosed").asLong() + 1);
        assertThat(after.get("attention").get("paymentsWithinWithdrawal").asLong())
                .isEqualTo(before.get("attention").get("paymentsWithinWithdrawal").asLong() + 1);
        assertThat(after.get("revenueByMethod")).anyMatch(m -> m.get("method").asText().equals("simulado"));
        long weekTotal = 0;
        for (JsonNode w : after.get("signupsByWeek")) weekTotal += w.get("advertisers").asLong();
        assertThat(weekTotal).isEqualTo(k1.get("newAdvertisers").asLong());

        // Período fora da lista cai no padrão de 30 dias.
        mvc.perform(auth(get("/api/admin/dashboard?dias=5000"), admin)).andExpect(jsonPath("$.days").value(30));
    }

    private java.util.List<Long> searchIds(Account viewer) throws Exception {
        java.util.List<Long> ids = new java.util.ArrayList<>();
        for (JsonNode item : body(mvc.perform(auth(get("/api/browse/roommates"), viewer)).andExpect(status().isOk()))) {
            ids.add(item.get("listing").get("id").asLong());
        }
        return ids;
    }
}
