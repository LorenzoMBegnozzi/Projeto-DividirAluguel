package com.rachaai.user.dto;

import jakarta.validation.constraints.NotBlank;

/** Confirmação de "Excluir minha conta": a senha atual, para ninguém excluir a conta de um navegador aberto. */
public record DeleteAccountRequest(@NotBlank String password) {
}
