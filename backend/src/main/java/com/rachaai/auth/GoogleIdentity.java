package com.rachaai.auth;

/**
 * Quem o Google confirmou no login.
 *
 * @param subject       o "sub" do Google: identificador fixo da conta (não muda com o e-mail)
 * @param email         e-mail da conta do Google
 * @param emailVerified o Google confirmou que o e-mail é da pessoa
 * @param name          nome no Google (pode faltar)
 */
public record GoogleIdentity(String subject, String email, boolean emailVerified, String name) {
}
