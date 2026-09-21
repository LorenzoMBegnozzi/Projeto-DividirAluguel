package com.rachaai.moderation.dto;

import com.rachaai.moderation.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ReportRequest(
        @NotNull Long denunciadoId,
        @NotNull ReportReason motivo,
        @Size(max = 1000) String descricao,
        Long conversaId
) {
}
