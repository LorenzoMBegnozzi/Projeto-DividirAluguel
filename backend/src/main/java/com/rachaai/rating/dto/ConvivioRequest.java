package com.rachaai.rating.dto;

import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record ConvivioRequest(
        @NotNull Long outroUsuarioId,
        @NotNull LocalDate periodoInicio,
        LocalDate periodoFim
) {
}
