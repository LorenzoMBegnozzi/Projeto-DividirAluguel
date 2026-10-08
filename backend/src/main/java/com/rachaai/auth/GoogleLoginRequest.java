package com.rachaai.auth;

import jakarta.validation.constraints.NotBlank;

/** @param credential o token que o botão do Google entrega ao site (Google Identity Services) */
public record GoogleLoginRequest(@NotBlank String credential) {
}
