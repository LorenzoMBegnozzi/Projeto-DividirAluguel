package com.rachaai.user;

import com.fasterxml.jackson.databind.JsonNode;
import com.rachaai.support.ApiTestSupport;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@DisplayName("Privacidade, perfil e exclusão de conta (LGPD)")
class PrivacyAndAccountTest extends ApiTestSupport {

    @Autowired
    private UserRepository userRepository;

    @Test
    @DisplayName("perfil de outra pessoa vem sem e-mail, nascimento e alergias")
    void publicProfileHidesPrivateData() throws Exception {
        Account ana = renter("FEMININO");
        Account bruno = renter("MASCULINO");

        mvc.perform(auth(get("/api/users/" + ana.id()), bruno))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").exists())
                .andExpect(jsonPath("$.email").doesNotExist())
                .andExpect(jsonPath("$.birthDate").doesNotExist())
                .andExpect(jsonPath("$.allergyTags").isEmpty())
                .andExpect(jsonPath("$.admin").value(false));

        // A própria pessoa continua vendo tudo.
        mvc.perform(auth(get("/api/users/me"), ana))
                .andExpect(jsonPath("$.email").value(ana.email()))
                .andExpect(jsonPath("$.birthDate").value("2000-05-10"))
                .andExpect(jsonPath("$.allergyTags[0]").value("POEIRA"));
    }

    @Test
    @DisplayName("o sexo não pode ser trocado depois de salvo")
    void genderIsLockedAfterSaved() throws Exception {
        Account a = renter("MASCULINO");
        Map<String, Object> changed = Map.of("gender", "FEMININO", "allergyTags", List.of(), "petPreferences", List.of());
        mvc.perform(auth(put("/api/users/me/profile"), a).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(changed)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("não pode ser alterado")));
        assertThat(me(a).get("gender").asText()).isEqualTo("MASCULINO");
    }

    @Test
    @DisplayName("\"Prefiro não informar\" na alergia apaga as outras respostas")
    void preferNotToSayAllergyStandsAlone() throws Exception {
        Account a = renter("FEMININO");
        Map<String, Object> profile = Map.of("gender", "FEMININO", "petPreferences", List.of(),
                "allergyTags", List.of("PREFIRO_NAO_INFORMAR", "POEIRA", "OUTRO"), "allergyOther", "amendoim");
        mvc.perform(auth(put("/api/users/me/profile"), a).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsString(profile)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allergyTags.length()").value(1))
                .andExpect(jsonPath("$.allergyTags[0]").value("PREFIRO_NAO_INFORMAR"))
                .andExpect(jsonPath("$.allergyOther").doesNotExist());
    }

    @Test
    @DisplayName("excluir a conta pede a senha certa")
    void deleteAccountRequiresPassword() throws Exception {
        Account a = renter("FEMININO");
        mvc.perform(jsonPost("/api/users/me/excluir-conta", a, Map.of("password", "errada")))
                .andExpect(status().isForbidden());
        mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("excluir a conta apaga os dados pessoais, derruba o login e apaga as mensagens enviadas")
    void deleteAccountAnonymizes() throws Exception {
        Account owner = advertiser();
        long listingId = createListing(owner, listingBody("ESTABELECIMENTO"));
        Account a = renter("FEMININO");

        JsonNode conversation = body(mvc.perform(jsonPost("/api/conversations", a, Map.of("listingId", listingId)))
                .andExpect(status().isOk()));
        long conversationId = conversation.get("id").asLong();
        mvc.perform(jsonPost("/api/conversations/" + conversationId + "/messages", a, Map.of("content", "meu telefone é 44 99999-0000")))
                .andExpect(status().isOk());

        mvc.perform(jsonPost("/api/users/me/excluir-conta", a, Map.of("password", PASSWORD)))
                .andExpect(status().isNoContent());

        // Login e token antigos não valem mais; o perfil público some.
        mvc.perform(auth(get("/api/users/me"), a)).andExpect(status().isForbidden());
        login(a.email(), PASSWORD, uniqueIp()).andExpect(status().isUnauthorized());
        mvc.perform(auth(get("/api/users/" + a.id()), owner)).andExpect(status().isNotFound());

        // No banco: a linha fica só como "Usuário excluído", sem nada que identifique.
        User deleted = userRepository.findById(a.id()).orElseThrow();
        assertThat(deleted.getName()).isEqualTo("Usuário excluído");
        assertThat(deleted.getEmail()).doesNotContain(a.email());
        assertThat(deleted.getCpf()).isNull();
        assertThat(deleted.getBio()).isNull();
        assertThat(deleted.isDeleted()).isTrue();

        // A outra pessoa continua com a conversa, mas sem o texto de quem saiu.
        mvc.perform(auth(get("/api/conversations/" + conversationId + "/messages"), owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].content", containsString("mensagem apagada")));
    }

    @Test
    @DisplayName("conta de admin não pode ser excluída pela tela")
    void adminCannotSelfDelete() throws Exception {
        Account admin = admin();
        mvc.perform(jsonPost("/api/users/me/excluir-conta", admin, Map.of("password", PASSWORD)))
                .andExpect(status().isForbidden());
    }
}
