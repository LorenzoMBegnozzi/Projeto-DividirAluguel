package com.rachaai.rating.dto;

import com.rachaai.rating.Convivio;
import com.rachaai.rating.ConvivioStatus;

import java.time.Instant;
import java.time.LocalDate;

public record ConvivioResponse(
        Long id,
        Long outroUsuarioId,
        String outroUsuarioNome,
        LocalDate periodoInicio,
        LocalDate periodoFim,
        ConvivioStatus status,
        boolean propostoPorMim,
        boolean avaliadoPorMim,
        Instant criadoEm
) {
    public static ConvivioResponse from(Convivio convivio, Long usuarioId, boolean avaliadoPorMim) {
        var outro = convivio.getOutroUsuario(usuarioId);
        return new ConvivioResponse(
                convivio.getId(),
                outro.getId(),
                outro.getName(),
                convivio.getPeriodoInicio(),
                convivio.getPeriodoFim(),
                convivio.getStatus(),
                convivio.getPropostoPorId().equals(usuarioId),
                avaliadoPorMim,
                convivio.getCriadoEm()
        );
    }
}
