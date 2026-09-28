package com.rachaai.admin.dto;

import com.rachaai.billing.PaymentStatus;
import com.rachaai.billing.PaymentType;
import com.rachaai.listing.ListingType;
import com.rachaai.moderation.ReportReason;
import com.rachaai.moderation.ReportStatus;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.Instant;

/** Formatos de entrada e saída da área administrativa (/api/admin). */
public final class AdminDtos {

    private AdminDtos() {
    }

    public record Summary(
            long totalUsers,
            long blockedUsers,
            long activeListings,
            long openReports,
            long paidPayments,
            long pendingPayments
    ) {
    }

    /** Pessoa numa denúncia. O admin vê o e-mail para poder entrar em contato se precisar. */
    public record ReportPerson(Long id, String name, String email, boolean blocked, long reportsReceived) {
    }

    public record Report(
            Long id,
            ReportPerson reporter,
            ReportPerson reported,
            Long conversationId,
            ReportReason reason,
            String description,
            ReportStatus status,
            Instant createdAt,
            Instant resolvedAt,
            String resolvedByName,
            String adminNote
    ) {
    }

    public record CloseReportRequest(
            @NotNull ReportStatus status,
            @Size(max = 1000) String note,
            /** true = bloqueia também a conta denunciada. */
            boolean blockReported
    ) {
    }

    public record User(
            Long id,
            String name,
            String email,
            Instant createdAt,
            boolean renter,
            boolean advertiser,
            boolean admin,
            boolean blocked,
            Instant blockedAt,
            String blockReason,
            long reportsReceived,
            long activeListings
    ) {
    }

    public record BlockRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record Payment(
            Long id,
            Long userId,
            String userName,
            String userEmail,
            PaymentType type,
            Long listingId,
            BigDecimal amount,
            PaymentStatus status,
            /** pix, credit_card, debit_card... (nulo = simulado) */
            String method,
            /** MERCADOPAGO ou nulo (modo simulado) */
            String gateway,
            String gatewayPaymentId,
            Instant createdAt,
            Instant paidAt,
            Instant refundedAt,
            String refundReason,
            /** Pago há no máximo 7 dias: dentro do prazo de arrependimento do CDC. */
            boolean withinWithdrawalPeriod
    ) {
    }

    public record RefundRequest(@NotBlank @Size(max = 500) String reason) {
    }

    public record Listing(
            Long id,
            String title,
            ListingType type,
            Long ownerId,
            String ownerName,
            boolean ownerBlocked,
            boolean active,
            boolean available,
            boolean highlighted,
            Instant createdAt
    ) {
    }
}
