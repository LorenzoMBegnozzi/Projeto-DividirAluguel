package com.rachaai.auth;

import com.fasterxml.jackson.databind.JsonNode;
import com.rachaai.support.ApiTestSupport;
import com.rachaai.user.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * "Continuar com Google". O Google de verdade não é chamado: o GoogleTokenVerifier é um dublê que
 * devolve a identidade que cada teste escolhe para um token de mentira.
 */
@DisplayName("Login com Google")
class GoogleLoginTest extends ApiTestSupport {

    @MockBean
    private GoogleTokenVerifier verifier;

    @Autowired
    private UserRepository userRepository;

    /** Faz o dublê aceitar um token novo como sendo desta conta do Google. */
    private String googleToken(String email, boolean verified) {
        String token = "google-token-" + UUID.randomUUID();
        when(verifier.verify(token)).thenReturn(new GoogleIdentity("sub-" + UUID.randomUUID(), email, verified, "Pessoa Google"));
        return token;
    }

    private ResultActions continueWithGoogle(String credential) throws Exception {
        return mvc.perform(post("/api/auth/google").header("X-Real-IP", uniqueIp())
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("credential", credential))));
    }

    private ResultActions completeSignup(String signupToken, String birthDate, String role) throws Exception {
        Map<String, Object> body = new HashMap<>(Map.of(
                "signupToken", signupToken, "birthDate", birthDate, "cpf", validCpf(), "role", role, "acceptTerms", true));
        if ("ADVERTISER".equals(role)) {
            body.put("advertiserKind", "VAGA");
        }
        return mvc.perform(post("/api/auth/google/cadastro").header("X-Real-IP", uniqueIp())
                .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(body)));
    }

    @Test
    @DisplayName("conta nova: não cria nada até completar a tela \"falta pouco\"; depois entra direto")
    void newAccountGoesThroughSignup() throws Exception {
        String email = uniqueEmail("google", "gmail.com");
        String credential = googleToken(email, true);

        JsonNode first = body(continueWithGoogle(credential).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SIGNUP_REQUIRED"))
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.name").value("Pessoa Google"))
                .andExpect(jsonPath("$.token").doesNotExist()));
        assertThat(userRepository.findByEmailIgnoreCase(email)).isEmpty();

        JsonNode created = body(completeSignup(first.get("signupToken").asText(), "1999-03-02", "RENTER")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.renter").value(true))
                .andExpect(jsonPath("$.user.emailConfirmed").value(true))
                .andExpect(jsonPath("$.user.legalTermsAccepted").value(true)));
        long id = created.get("user").get("id").asLong();
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + created.get("token").asText()))
                .andExpect(status().isOk());

        // Da próxima vez, o mesmo login do Google entra direto na conta.
        continueWithGoogle(credential).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOGGED_IN"))
                .andExpect(jsonPath("$.user.id").value(id))
                .andExpect(jsonPath("$.token").exists());
    }

    @Test
    @DisplayName("o comprovante da tela \"falta pouco\" não serve como login")
    void signupTokenIsNotALogin() throws Exception {
        JsonNode first = body(continueWithGoogle(googleToken(uniqueEmail("google", "gmail.com"), true)));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + first.get("signupToken").asText()))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("menor de 18 anos não cria conta e nada fica guardado")
    void underageIsRefused() throws Exception {
        String email = uniqueEmail("menor", "gmail.com");
        JsonNode first = body(continueWithGoogle(googleToken(email, true)));
        completeSignup(first.get("signupToken").asText(), java.time.LocalDate.now().minusYears(16).toString(), "RENTER")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("18 anos")));
        assertThat(userRepository.findByEmailIgnoreCase(email)).isEmpty();
    }

    @Test
    @DisplayName("comprovante adulterado é recusado")
    void tamperedSignupTokenIsRefused() throws Exception {
        JsonNode first = body(continueWithGoogle(googleToken(uniqueEmail("google", "gmail.com"), true)));
        String token = first.get("signupToken").asText();
        int i = token.indexOf('.') + 6;   // troca uma letra no meio do conteúdo: a assinatura deixa de bater
        String tampered = token.substring(0, i) + (token.charAt(i) == 'A' ? 'B' : 'A') + token.substring(i + 1);
        completeSignup(tampered, "1999-03-02", "ADVERTISER")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("continuar com Google")));
    }

    @Test
    @DisplayName("e-mail não confirmado pelo Google não entra")
    void unverifiedGoogleEmailIsRefused() throws Exception {
        continueWithGoogle(googleToken(uniqueEmail("google", "gmail.com"), false))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("conta já existente com o mesmo e-mail (confirmado) entra e continua com a senha")
    void linksExistingConfirmedAccount() throws Exception {
        Account a = register(uniqueEmail("comsenha", "teste.com"), "RENTER");   // teste.com nasce confirmado
        continueWithGoogle(googleToken(a.email(), true)).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOGGED_IN"))
                .andExpect(jsonPath("$.user.id").value(a.id()));
        login(a.email(), PASSWORD, uniqueIp()).andExpect(status().isOk());
        assertThat(userRepository.findById(a.id()).orElseThrow().getGoogleSub()).isNotNull();
    }

    @Test
    @DisplayName("conta com e-mail NÃO confirmado: o Google prova o dono e a senha antiga deixa de valer")
    void unconfirmedAccountLosesForeignPassword() throws Exception {
        Account a = register(uniqueEmail("naoconfirmada", "exemplo.com"), "RENTER");
        continueWithGoogle(googleToken(a.email(), true)).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("LOGGED_IN"))
                .andExpect(jsonPath("$.user.emailConfirmed").value(true));
        login(a.email(), PASSWORD, uniqueIp()).andExpect(status().isUnauthorized());
        mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("o site descobre o Client ID pelo /config")
    void configExposesClientId() throws Exception {
        when(verifier.clientId()).thenReturn("123-abc.apps.googleusercontent.com");
        mvc.perform(get("/api/auth/google/config"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.clientId").value("123-abc.apps.googleusercontent.com"));
    }
}
