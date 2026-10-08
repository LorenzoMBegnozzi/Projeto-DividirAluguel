package com.rachaai.auth;

import com.rachaai.user.AdvertiserKind;
import com.rachaai.user.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;

import java.time.LocalDate;

/**
 * Tela "falta pouco" do login com Google: o que o Google não informa. Nome e e-mail vêm do
 * signupToken (conferido pelo Google), não do formulário.
 */
public record GoogleSignupRequest(
        @NotBlank String signupToken,
        @NotNull @Past LocalDate birthDate,
        @NotBlank String cpf,
        @NotNull Role role,
        AdvertiserKind advertiserKind,
        @AssertTrue(message = "é preciso aceitar os Termos de Uso e a Política de Privacidade") boolean acceptTerms
) {
}
