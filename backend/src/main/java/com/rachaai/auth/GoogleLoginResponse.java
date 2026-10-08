package com.rachaai.auth;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.rachaai.user.dto.UserResponse;

/**
 * Resposta do "continuar com Google":
 *   LOGGED_IN        já tem conta → token e user, igual ao login normal
 *   SIGNUP_REQUIRED  conta nova → signupToken (vale 30 min) + nome e e-mail do Google, para a
 *                    tela "falta pouco" pedir o resto (perfil, nascimento, CPF, termos)
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record GoogleLoginResponse(
        Status status,
        String token,
        UserResponse user,
        String signupToken,
        String name,
        String email
) {
    public enum Status { LOGGED_IN, SIGNUP_REQUIRED }

    static GoogleLoginResponse loggedIn(String token, UserResponse user) {
        return new GoogleLoginResponse(Status.LOGGED_IN, token, user, null, null, null);
    }

    static GoogleLoginResponse signupRequired(String signupToken, String name, String email) {
        return new GoogleLoginResponse(Status.SIGNUP_REQUIRED, null, null, signupToken, name, email);
    }
}
