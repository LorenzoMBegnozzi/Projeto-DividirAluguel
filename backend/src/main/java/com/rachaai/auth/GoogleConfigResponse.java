package com.rachaai.auth;

/** @param clientId Client ID do Google para o botão; null = login com Google desligado */
public record GoogleConfigResponse(String clientId) {
}
