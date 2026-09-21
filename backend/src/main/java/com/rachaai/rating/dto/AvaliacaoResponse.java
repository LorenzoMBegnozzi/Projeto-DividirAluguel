package com.rachaai.rating.dto;

import com.rachaai.rating.Avaliacao;

import java.time.Instant;
import java.time.LocalDate;

public record AvaliacaoResponse(
        Long id,
        Long avaliadorId,
        String avaliadorNome,
        Integer notaPontualidade,
        Integer notaConvivencia,
        String comentario,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        Instant criadoEm
) {
    public static AvaliacaoResponse from(Avaliacao avaliacao) {
        return new AvaliacaoResponse(
                avaliacao.getId(),
                avaliacao.getAvaliador().getId(),
                avaliacao.getAvaliador().getName(),
                avaliacao.getNotaPontualidade(),
                avaliacao.getNotaConvivencia(),
                avaliacao.getComentario(),
                avaliacao.getConvivio().getPeriodoInicio(),
                avaliacao.getConvivio().getPeriodoFim(),
                avaliacao.getCriadoEm()
        );
    }
}
