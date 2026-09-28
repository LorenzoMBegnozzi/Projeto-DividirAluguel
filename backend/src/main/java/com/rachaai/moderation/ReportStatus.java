package com.rachaai.moderation;

/** Andamento de uma denúncia na moderação. */
public enum ReportStatus {
    /** Ainda não foi analisada. */
    ABERTA,
    /** Um admin analisou e agiu (ex.: bloqueou a conta). */
    RESOLVIDA,
    /** Um admin analisou e não viu problema. */
    DESCARTADA
}
