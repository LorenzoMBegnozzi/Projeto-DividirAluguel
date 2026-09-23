package com.rachaai.user;

import java.util.ArrayList;
import java.util.List;

/**
 * Converte entre a lista de tags/texto livre que o formulário envia e a string única
 * guardada em perfis_usuario.alergias (tags separadas por vírgula; quando inclui
 * "Outro", o texto livre vem como o segmento "OUTRO:texto").
 */
public final class AllergyCodec {

    private AllergyCodec() {
    }

    public static String encode(List<AllergyTag> tags, String otherText) {
        if (tags == null || tags.isEmpty()) {
            return null;
        }
        List<String> segments = new ArrayList<>();
        for (AllergyTag tag : tags) {
            if (tag == AllergyTag.OUTRO) {
                segments.add(otherText != null && !otherText.isBlank() ? "OUTRO:" + otherText.trim() : "OUTRO");
            } else {
                segments.add(tag.name());
            }
        }
        return String.join(",", segments);
    }

    public record Decoded(List<AllergyTag> tags, String otherText) {
    }

    public static Decoded decode(String stored) {
        if (stored == null || stored.isBlank()) {
            return new Decoded(List.of(), null);
        }
        List<AllergyTag> tags = new ArrayList<>();
        String otherText = null;
        for (String raw : stored.split(",")) {
            String segment = raw.trim();
            if (segment.isEmpty()) {
                continue;
            }
            if (segment.startsWith("OUTRO:")) {
                tags.add(AllergyTag.OUTRO);
                otherText = segment.substring("OUTRO:".length());
            } else {
                try {
                    tags.add(AllergyTag.valueOf(segment));
                } catch (IllegalArgumentException ignored) {
                    // dado legado em texto livre (versão anterior do formulário): ignora aqui,
                    // mas mantém o valor bruto disponível como "outro" para não perder a informação.
                    otherText = otherText == null ? segment : otherText + ", " + segment;
                    if (!tags.contains(AllergyTag.OUTRO)) {
                        tags.add(AllergyTag.OUTRO);
                    }
                }
            }
        }
        return new Decoded(tags, otherText);
    }
}
