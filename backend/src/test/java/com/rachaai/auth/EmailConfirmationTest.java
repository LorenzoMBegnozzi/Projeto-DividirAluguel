package com.rachaai.auth;

import com.rachaai.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Confirmação de e-mail")
class EmailConfirmationTest extends ApiTestSupport {

    /** Domínio que NÃO é auto-confirmado (só teste.com é, no perfil de teste). */
    private static final String REAL_DOMAIN = "exemplo.com.br";

    @Test
    @DisplayName("sem confirmar, a conta não publica anúncio; confirmando, publica")
    void unconfirmedCannotPublishUntilConfirmed() throws Exception {
        Account a = register(uniqueEmail("anuncia", REAL_DOMAIN), "ADVERTISER");
        org.assertj.core.api.Assertions.assertThat(me(a).get("emailConfirmed").asBoolean()).isFalse();

        mvc.perform(jsonPost("/api/listings", a, listingBody("TEM_VAGA")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message", containsString("Confirme seu e-mail")));

        String token = lastConfirmationToken(a.email(), 1);
        mvc.perform(jsonPost("/api/auth/confirmar-email", null, Map.of("token", token))).andExpect(status().isNoContent());

        org.assertj.core.api.Assertions.assertThat(me(a).get("emailConfirmed").asBoolean()).isTrue();
        createListing(a, listingBody("TEM_VAGA"));
    }

    @Test
    @DisplayName("o link de confirmação só vale uma vez")
    void confirmationLinkIsSingleUse() throws Exception {
        Account a = register(uniqueEmail("umavez", REAL_DOMAIN), "RENTER");
        String token = lastConfirmationToken(a.email(), 1);
        mvc.perform(jsonPost("/api/auth/confirmar-email", null, Map.of("token", token))).andExpect(status().isNoContent());
        mvc.perform(jsonPost("/api/auth/confirmar-email", null, Map.of("token", token))).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("reenviar gera um link novo e invalida o antigo")
    void resendInvalidatesPreviousLink() throws Exception {
        Account a = register(uniqueEmail("reenvia", REAL_DOMAIN), "RENTER");
        String first = lastConfirmationToken(a.email(), 1);
        mvc.perform(auth(post("/api/users/me/reenviar-confirmacao"), a)).andExpect(status().isNoContent());
        String second = lastConfirmationToken(a.email(), 2);

        org.assertj.core.api.Assertions.assertThat(second).isNotEqualTo(first);
        mvc.perform(jsonPost("/api/auth/confirmar-email", null, Map.of("token", first))).andExpect(status().isBadRequest());
        mvc.perform(jsonPost("/api/auth/confirmar-email", null, Map.of("token", second))).andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("reenviar tem limite de 3 por hora")
    void resendIsRateLimited() throws Exception {
        Account a = register(uniqueEmail("limite", REAL_DOMAIN), "RENTER");
        for (int i = 0; i < 3; i++) {
            mvc.perform(auth(post("/api/users/me/reenviar-confirmacao"), a)).andExpect(status().isNoContent());
        }
        mvc.perform(auth(post("/api/users/me/reenviar-confirmacao"), a)).andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("sem confirmar, não puxa conversa nem demonstra interesse")
    void unconfirmedCannotInteract() throws Exception {
        Account owner = advertiser();
        Map<String, Object> estab = listingBody("ESTABELECIMENTO");
        long listingId = createListing(owner, estab);

        Account a = register(uniqueEmail("interage", REAL_DOMAIN), "RENTER");
        mvc.perform(jsonPost("/api/conversations", a, Map.of("listingId", listingId))).andExpect(status().isForbidden());
        mvc.perform(auth(post("/api/listings/" + listingId + "/interest"), a)).andExpect(status().isForbidden());
    }
}
