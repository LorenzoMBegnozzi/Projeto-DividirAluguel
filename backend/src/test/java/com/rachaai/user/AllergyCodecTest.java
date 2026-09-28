package com.rachaai.user;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Alergias: gravação e leitura (AllergyCodec)")
class AllergyCodecTest {

    @Test
    @DisplayName("tags e o texto do \"Outro\" vão e voltam iguais")
    void roundTrip() {
        String stored = AllergyCodec.encode(List.of(AllergyTag.POEIRA, AllergyTag.OUTRO), "amendoim");
        assertThat(stored).isEqualTo("POEIRA,OUTRO:amendoim");
        AllergyCodec.Decoded decoded = AllergyCodec.decode(stored);
        assertThat(decoded.tags()).containsExactly(AllergyTag.POEIRA, AllergyTag.OUTRO);
        assertThat(decoded.otherText()).isEqualTo("amendoim");
    }

    @Test
    @DisplayName("\"Prefiro não informar\" não guarda nenhuma alergia junto")
    void preferNotToSayStandsAlone() {
        String stored = AllergyCodec.encode(List.of(AllergyTag.POEIRA, AllergyTag.PREFIRO_NAO_INFORMAR, AllergyTag.OUTRO), "x");
        assertThat(stored).isEqualTo("PREFIRO_NAO_INFORMAR");
    }

    @Test
    @DisplayName("sem resposta vira nulo; texto antigo em formato livre cai em \"Outro\"")
    void emptyAndLegacy() {
        assertThat(AllergyCodec.encode(List.of(), null)).isNull();
        AllergyCodec.Decoded legacy = AllergyCodec.decode("rinite");
        assertThat(legacy.tags()).containsExactly(AllergyTag.OUTRO);
        assertThat(legacy.otherText()).isEqualTo("rinite");
    }
}
