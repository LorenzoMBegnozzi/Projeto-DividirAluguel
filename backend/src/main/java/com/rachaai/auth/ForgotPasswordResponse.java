package com.rachaai.auth;

/**
 * O projeto ainda não envia e-mail de verdade: em vez disso, quando a conta existe,
 * devolvemos o token diretamente na resposta (modo simulado, igual ao billing SIMULADO).
 * Trocar por envio de e-mail real depois é só deixar de devolver o token aqui.
 */
public record ForgotPasswordResponse(String message, String resetToken) {
}
