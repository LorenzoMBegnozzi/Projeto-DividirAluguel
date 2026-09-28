package com.rachaai.auth;

import com.rachaai.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Cadastro, login e sessão")
class AuthAndSessionTest extends ApiTestSupport {

    @Test
    @DisplayName("cadastro sem aceitar os Termos e a Política é recusado")
    void registerRequiresTerms() throws Exception {
        Map<String, Object> body = registerBody(uniqueEmail("semtermos", "teste.com"), "RENTER");
        body.put("acceptTerms", false);
        mvc.perform(jsonPost("/api/auth/register", null, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("aceitar")));
    }

    @Test
    @DisplayName("cadastro registra o aceite da versão atual dos Termos")
    void registerRecordsTermsAcceptance() throws Exception {
        Account a = register(uniqueEmail("comtermos", "teste.com"), "RENTER");
        mvc.perform(auth(get("/api/users/me"), a))
                .andExpect(jsonPath("$.legalTermsAccepted").value(true))
                .andExpect(jsonPath("$.email").value(a.email()));
    }

    @Test
    @DisplayName("5 senhas erradas travam a conta por 15 min, mesmo vindo de IPs diferentes")
    void wrongPasswordLocksAccount() throws Exception {
        Account a = register(uniqueEmail("forcabruta", "teste.com"), "RENTER");
        for (int i = 0; i < 5; i++) {
            login(a.email(), "chute" + i, uniqueIp()).andExpect(status().isUnauthorized());
        }
        login(a.email(), "chute5", uniqueIp()).andExpect(status().isTooManyRequests());
        // Travado vale até para a senha certa (senão o limite não protegeria nada).
        login(a.email(), PASSWORD, uniqueIp())
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Muitas tentativas")));
    }

    @Test
    @DisplayName("um IP só pode tentar 20 logins a cada 5 min")
    void loginAttemptsPerIpAreLimited() throws Exception {
        String ip = uniqueIp();
        for (int i = 0; i < 20; i++) {
            login(uniqueEmail("naoexiste", "teste.com"), "x", ip).andExpect(status().isUnauthorized());
        }
        login(uniqueEmail("naoexiste", "teste.com"), "x", ip).andExpect(status().isTooManyRequests());
    }

    @Test
    @DisplayName("sair invalida o token na hora")
    void logoutInvalidatesToken() throws Exception {
        Account a = register(uniqueEmail("logout", "teste.com"), "RENTER");
        mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().isOk());
        mvc.perform(auth(post("/api/auth/logout"), a)).andExpect(status().isNoContent());
        mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().isForbidden());
        login(a.email(), PASSWORD, uniqueIp()).andExpect(status().isOk());
    }

    @Test
    @DisplayName("redefinir a senha derruba os logins abertos e o link só vale uma vez")
    void passwordResetRevokesSessions() throws Exception {
        Account a = register(uniqueEmail("reset", "teste.com"), "RENTER");
        mvc.perform(jsonPost("/api/auth/esqueci-senha", null, Map.of("email", a.email()))).andExpect(status().isOk());
        String token = lastPasswordResetToken(a.email());

        mvc.perform(jsonPost("/api/auth/redefinir-senha", null, Map.of("token", token, "newPassword", "senhaNova123")))
                .andExpect(status().isNoContent());
        mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().isForbidden());
        login(a.email(), "senhaNova123", uniqueIp()).andExpect(status().isOk());
        login(a.email(), PASSWORD, uniqueIp()).andExpect(status().isUnauthorized());

        mvc.perform(jsonPost("/api/auth/redefinir-senha", null, Map.of("token", token, "newPassword", "outraSenha123")))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("\"esqueci a senha\" responde igual exista a conta ou não")
    void forgotPasswordDoesNotRevealAccounts() throws Exception {
        Account a = register(uniqueEmail("existe", "teste.com"), "RENTER");
        String existing = body(mvc.perform(jsonPost("/api/auth/esqueci-senha", null, Map.of("email", a.email())))).get("message").asText();
        String missing = body(mvc.perform(jsonPost("/api/auth/esqueci-senha", null,
                Map.of("email", uniqueEmail("ninguem", "teste.com"))))).get("message").asText();
        org.assertj.core.api.Assertions.assertThat(missing).isEqualTo(existing);
    }

    @Test
    @DisplayName("rotas da API exigem login")
    void apiRequiresLogin() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isForbidden());
        mvc.perform(get("/api/browse/roommates")).andExpect(status().isForbidden());
    }
}
