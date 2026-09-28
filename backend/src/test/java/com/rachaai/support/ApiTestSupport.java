package com.rachaai.support;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.rachaai.common.EmailService;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.atomic.AtomicInteger;

import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.timeout;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Base dos testes de API: sobe o backend inteiro (banco H2 em memória) e chama as rotas de
 * verdade com MockMvc. O envio de e-mail é trocado por um dublê (mock) que captura os links.
 *
 * Todas as classes de teste que herdam daqui compartilham o mesmo contexto e o mesmo banco; por
 * isso cada teste cria contas com e-mails próprios (uniqueEmail) e usa um IP próprio por pessoa,
 * para os limites de tentativas de um teste não atrapalharem outro.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public abstract class ApiTestSupport {

    public static final String PASSWORD = "senha123";
    private static final AtomicInteger SEQ = new AtomicInteger();

    @Autowired
    protected MockMvc mvc;

    @Autowired
    protected ObjectMapper json;

    @MockBean
    protected EmailService emailService;

    /** Uma pessoa de teste: e-mail, IP de onde "acessa", token de login e id. */
    public record Account(String email, String ip, String token, long id) {
    }

    // ------------------------------------------------------------------ contas

    protected static String uniqueEmail(String prefix, String domain) {
        return prefix + "." + SEQ.incrementAndGet() + "." + System.nanoTime() % 100000 + "@" + domain;
    }

    protected static String uniqueIp() {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        return "10." + r.nextInt(1, 255) + "." + r.nextInt(1, 255) + "." + r.nextInt(1, 255);
    }

    /** CPF com dígitos verificadores válidos (aleatório). */
    protected static String validCpf() {
        int[] d = new int[11];
        for (int i = 0; i < 9; i++) {
            d[i] = ThreadLocalRandom.current().nextInt(10);
        }
        d[9] = cpfDigit(d, 9);
        d[10] = cpfDigit(d, 10);
        StringBuilder sb = new StringBuilder();
        for (int x : d) {
            sb.append(x);
        }
        return sb.toString();
    }

    private static int cpfDigit(int[] d, int length) {
        int sum = 0;
        for (int i = 0; i < length; i++) {
            sum += d[i] * (length + 1 - i);
        }
        int r = (sum * 10) % 11;
        return r == 10 ? 0 : r;
    }

    protected Map<String, Object> registerBody(String email, String role) {
        Map<String, Object> body = new java.util.HashMap<>(Map.of(
                "name", "Pessoa Teste",
                "email", email,
                "password", PASSWORD,
                "birthDate", "2000-05-10",
                "cpf", validCpf(),
                "role", role,
                "acceptTerms", true
        ));
        if ("ADVERTISER".equals(role)) {
            body.put("advertiserKind", "VAGA");
        }
        return body;
    }

    /** Cadastra (já confirmada se o domínio for teste.com) e devolve a conta logada. */
    protected Account register(String email, String role) throws Exception {
        String ip = uniqueIp();
        JsonNode res = body(mvc.perform(post("/api/auth/register").header("X-Real-IP", ip)
                        .contentType(MediaType.APPLICATION_JSON).content(json.writeValueAsString(registerBody(email, role))))
                .andExpect(status().isOk()));
        return new Account(email, ip, res.get("token").asText(), res.get("user").get("id").asLong());
    }

    protected Account renter(String gender) throws Exception {
        Account a = register(uniqueEmail("inquilino", "teste.com"), "RENTER");
        saveProfile(a, gender);
        return a;
    }

    protected Account advertiser() throws Exception {
        return register(uniqueEmail("anunciante", "teste.com"), "ADVERTISER");
    }

    /** O admin é admin@teste.com (app.admin.emails): cria na primeira vez, depois só entra. */
    protected Account admin() throws Exception {
        String email = "admin@teste.com";
        String ip = uniqueIp();
        ResultActions login = mvc.perform(post("/api/auth/login").header("X-Real-IP", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", PASSWORD))));
        if (login.andReturn().getResponse().getStatus() == 200) {
            JsonNode res = body(login);
            return new Account(email, ip, res.get("token").asText(), res.get("user").get("id").asLong());
        }
        return register(email, "ADVERTISER");
    }

    protected ResultActions login(String email, String password, String ip) throws Exception {
        return mvc.perform(post("/api/auth/login").header("X-Real-IP", ip)
                .contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(Map.of("email", email, "password", password))));
    }

    protected void saveProfile(Account a, String gender) throws Exception {
        Map<String, Object> profile = new java.util.HashMap<>(Map.of(
                "smokingHabit", "NAO_FUMO",
                "drinkingHabit", "NAO_CURTO",
                "diet", "ONIVORO",
                "petPreferences", java.util.List.of("CACHORRO"),
                "allergyTags", java.util.List.of("POEIRA"),
                "bio", "bio de teste",
                "occupation", "UEM"
        ));
        if (gender != null) {
            profile.put("gender", gender);
        }
        mvc.perform(auth(put("/api/users/me/profile"), a).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(profile)))
                .andExpect(status().isOk());
    }

    // ------------------------------------------------------------------ anúncios

    protected Map<String, Object> listingBody(String type) {
        return new java.util.HashMap<>(Map.of(
                "type", type,
                "title", "Anúncio de teste " + SEQ.incrementAndGet(),
                "address", "Av. Brasil, 1000 - Centro",
                "latitude", -23.42,
                "longitude", -51.93
        ));
    }

    protected long createListing(Account owner, Map<String, Object> body) throws Exception {
        return body(mvc.perform(auth(post("/api/listings"), owner).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(body)))
                .andExpect(status().isOk())).get("id").asLong();
    }

    // ------------------------------------------------------------------ utilidades

    protected MockHttpServletRequestBuilder auth(MockHttpServletRequestBuilder req, Account a) {
        return req.header("Authorization", "Bearer " + a.token()).header("X-Real-IP", a.ip());
    }

    protected MockHttpServletRequestBuilder jsonPost(String url, Account a, Object body) throws Exception {
        MockHttpServletRequestBuilder req = post(url).contentType(MediaType.APPLICATION_JSON)
                .content(json.writeValueAsString(body));
        return a == null ? req.header("X-Real-IP", uniqueIp()) : auth(req, a);
    }

    protected JsonNode body(ResultActions result) throws Exception {
        String content = result.andReturn().getResponse().getContentAsString();
        return content.isEmpty() ? json.nullNode() : json.readTree(content);
    }

    protected JsonNode me(Account a) throws Exception {
        return body(mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().isOk()));
    }

    /** Token puro do último e-mail de confirmação enviado para o endereço (capturado do dublê). */
    protected String lastConfirmationToken(String email, int expectedEmails) {
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000).times(expectedEmails))
                .sendEmailConfirmation(eq(email), anyString(), token.capture(), anyInt());
        return token.getValue();
    }

    /** Token puro do último e-mail de redefinição de senha enviado para o endereço. */
    protected String lastPasswordResetToken(String email) {
        ArgumentCaptor<String> token = ArgumentCaptor.forClass(String.class);
        verify(emailService, timeout(3000).atLeastOnce())
                .sendPasswordReset(eq(email), anyString(), token.capture(), anyInt());
        return token.getValue();
    }
}
