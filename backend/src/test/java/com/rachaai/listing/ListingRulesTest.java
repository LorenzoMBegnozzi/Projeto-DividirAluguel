package com.rachaai.listing;

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

@DisplayName("Anúncios: vaga por sexo, dados do imóvel e interesse")
class ListingRulesTest extends ApiTestSupport {

    private boolean appearsInRoommateSearch(Account viewer, long listingId) throws Exception {
        JsonNode items = body(mvc.perform(auth(get("/api/browse/roommates"), viewer)).andExpect(status().isOk()));
        for (JsonNode item : items) {
            if (item.get("listing").get("id").asLong() == listingId) {
                return true;
            }
        }
        return false;
    }

    @Test
    @DisplayName("vaga só para mulheres não aparece para homens, nem pelo link, nem para conversar")
    void womenOnlyListingIsHiddenFromMen() throws Exception {
        Account owner = advertiser();
        Map<String, Object> body = listingBody("TEM_VAGA");
        body.put("genderPreference", "FEMININO");
        body.put("availableSlots", 1);
        long listingId = createListing(owner, body);

        Account woman = renter("FEMININO");
        Account man = renter("MASCULINO");
        Account noGender = renter(null);

        assertThat(appearsInRoommateSearch(woman, listingId)).isTrue();
        assertThat(appearsInRoommateSearch(man, listingId)).isFalse();
        assertThat(appearsInRoommateSearch(noGender, listingId)).isFalse();

        mvc.perform(auth(get("/api/listings/" + listingId), woman)).andExpect(status().isOk());
        mvc.perform(auth(get("/api/listings/" + listingId), man)).andExpect(status().isNotFound());
        mvc.perform(auth(get("/api/listings/" + listingId), owner)).andExpect(status().isOk());
        mvc.perform(jsonPost("/api/conversations", man, Map.of("listingId", listingId))).andExpect(status().isForbidden());
        mvc.perform(jsonPost("/api/conversations", woman, Map.of("listingId", listingId))).andExpect(status().isOk());
    }

    @Test
    @DisplayName("suítes não podem passar do número de dormitórios")
    void suitesCannotExceedBedrooms() throws Exception {
        Account owner = advertiser();
        Map<String, Object> body = listingBody("ESTABELECIMENTO");
        body.put("bedrooms", 1);
        body.put("suites", 2);
        mvc.perform(jsonPost("/api/listings", owner, body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("suítes")));
    }

    @Test
    @DisplayName("sem vaga de garagem, tipo e cobertura da garagem são descartados")
    void parkingDetailsDroppedWithoutSpots() throws Exception {
        Account owner = advertiser();
        Map<String, Object> body = listingBody("ESTABELECIMENTO");
        body.put("parkingSpots", 0);
        body.put("parkingLayout", "GAVETA");
        body.put("parkingCovered", true);
        body.put("parkingForCar", true);
        mvc.perform(jsonPost("/api/listings", owner, body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.parkingLayout").doesNotExist())
                .andExpect(jsonPath("$.parkingCovered").doesNotExist())
                .andExpect(jsonPath("$.parkingForCar").doesNotExist());
    }

    @Test
    @DisplayName("tipo de vaga de garagem inválido é recusado")
    void invalidParkingLayoutIsRejected() throws Exception {
        Account owner = advertiser();
        Map<String, Object> body = listingBody("ESTABELECIMENTO");
        body.put("parkingSpots", 1);
        body.put("parkingLayout", "TORTA");
        mvc.perform(jsonPost("/api/listings", owner, body)).andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("\"Tenho interesse\" notifica o dono e quem já tinha interesse")
    void interestNotifiesOwnerAndOthers() throws Exception {
        Account owner = advertiser();
        long listingId = createListing(owner, listingBody("ESTABELECIMENTO"));
        Account first = renter("FEMININO");
        Account second = renter("MASCULINO");

        mvc.perform(auth(post("/api/listings/" + listingId + "/interest"), first)).andExpect(status().isOk());
        mvc.perform(auth(post("/api/listings/" + listingId + "/interest"), second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2));

        assertThat(notificationTypes(owner)).filteredOn("NOVO_INTERESSE"::equals).hasSize(2);
        assertThat(notificationTypes(first)).contains("INTERESSE_EM_COMUM");
        assertThat(notificationTypes(second)).contains("INTERESSE_EM_COMUM");

        // O dono vê a lista; quem não demonstrou interesse, não.
        mvc.perform(auth(get("/api/listings/" + listingId + "/interest/people"), owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(auth(get("/api/listings/" + listingId + "/interest/people"), renter("FEMININO")))
                .andExpect(status().isForbidden());
    }

    private java.util.List<String> notificationTypes(Account a) throws Exception {
        java.util.List<String> types = new java.util.ArrayList<>();
        for (JsonNode n : body(mvc.perform(auth(get("/api/notificacoes"), a)).andExpect(status().isOk()))) {
            types.add(n.get("type").asText());
        }
        return types;
    }
}
