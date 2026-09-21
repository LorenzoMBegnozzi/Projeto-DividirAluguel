package com.rachaai.rating.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AvaliacaoRequest(
        @NotNull Long convivioId,
        @NotNull @Min(1) @Max(5) Integer notaPontualidade,
        @NotNull @Min(1) @Max(5) Integer notaConvivencia,
        @Size(max = 1000) String comentario
) {
}
