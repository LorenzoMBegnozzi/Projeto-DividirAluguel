package com.rachaai.common;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.UUID;

/**
 * Tokens de uso único enviados por e-mail (redefinir senha, confirmar e-mail): o link leva o token
 * puro, o banco guarda só o SHA-256. Quem ler o banco não consegue montar um link válido.
 */
public final class TokenHasher {

    private TokenHasher() {
    }

    /** 32 caracteres hexadecimais aleatórios (122 bits). */
    public static String newRawToken() {
        return UUID.randomUUID().toString().replace("-", "");
    }

    public static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(digest.digest(rawToken.getBytes(StandardCharsets.UTF_8)));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 indisponível", e);
        }
    }
}
