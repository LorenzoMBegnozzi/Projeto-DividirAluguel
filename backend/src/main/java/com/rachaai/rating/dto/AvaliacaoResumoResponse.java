package com.rachaai.rating.dto;

public record AvaliacaoResumoResponse(
        long total,
        double mediaPontualidade,
        double mediaConvivencia
) {
}
