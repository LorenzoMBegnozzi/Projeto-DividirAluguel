package com.rachaai.moderation.dto;

import com.rachaai.moderation.Report;

import java.time.Instant;

public record ReportResponse(Long id, Instant createdAt) {
    public static ReportResponse from(Report report) {
        return new ReportResponse(report.getId(), report.getCreatedAt());
    }
}
