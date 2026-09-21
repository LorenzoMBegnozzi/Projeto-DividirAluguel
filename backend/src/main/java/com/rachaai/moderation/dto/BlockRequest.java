package com.rachaai.moderation.dto;

import jakarta.validation.constraints.NotNull;

public record BlockRequest(@NotNull Long bloqueadoId) {
}
