package com.rachaai.auth;

import com.rachaai.user.AdvertiserKind;
import com.rachaai.user.Role;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

public record RegisterRequest(
        @NotBlank @Size(max = 120) String name,
        @NotBlank @Email @Size(max = 180) String email,
        @NotBlank @Size(min = 8, max = 72) String password,
        @NotNull @Past LocalDate birthDate,
        @NotBlank String cpf,
        @NotNull Role role,
        AdvertiserKind advertiserKind,
        /** Aceite dos Termos de Uso e da Política de Privacidade (LGPD): sem ele não cria a conta. */
        @AssertTrue(message = "é preciso aceitar os Termos de Uso e a Política de Privacidade") boolean acceptTerms
) {
}
