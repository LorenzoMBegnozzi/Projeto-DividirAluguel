package com.rachaai.common;

import java.util.Set;

/** Regras compartilhadas por qualquer upload de imagem (foto de perfil, fotos de anúncio). */
public final class PhotoValidator {

    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final long MAX_BYTES = 3L * 1024 * 1024;

    private PhotoValidator() {
    }

    public static void validate(byte[] content, String contentType, long size) {
        if (content == null || content.length == 0) {
            throw ApiException.badRequest("Envie um arquivo de imagem");
        }
        if (size > MAX_BYTES) {
            throw ApiException.badRequest("A imagem precisa ter até 3 MB");
        }
        if (contentType == null || !ALLOWED_TYPES.contains(contentType.toLowerCase())) {
            throw ApiException.badRequest("Use uma imagem JPEG, PNG ou WEBP");
        }
    }
}
