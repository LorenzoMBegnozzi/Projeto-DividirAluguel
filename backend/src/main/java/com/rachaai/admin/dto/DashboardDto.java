package com.rachaai.admin.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

/** Números do dashboard do admin para um período (os últimos N dias). */
public record DashboardDto(
        int days,
        Kpis kpis,
        Attention attention,
        List<WeekCount> signupsByWeek,
        List<MethodRevenue> revenueByMethod,
        List<TypeRevenue> revenueByType,
        List<Neighborhood> topNeighborhoods
) {

    public record Kpis(
            long newUsers,
            /** mesmo número no período anterior de mesmo tamanho (para a comparação) */
            long newUsersPrevious,
            long newRenters,
            long newAdvertisers,
            /** contas que usaram o site no período (registros de acesso); nulo se indisponível */
            Long activeUsers,
            long totalUsers,
            BigDecimal revenue,
            long sales,
            long refunds,
            BigDecimal averageTicket,
            long dealsClosed,
            long activeListings
    ) {
    }

    /** O que precisa de ação agora (independe do período). */
    public record Attention(
            long reportsOpenOver24h,
            long paymentsWithinWithdrawal,
            long pendingPaymentsOver1Day,
            long unconfirmedEmails,
            long usersWithManyOpenReports
    ) {
    }

    /** weekStart: segunda-feira da semana. total conta cada conta uma vez (há contas que procuram e anunciam). */
    public record WeekCount(LocalDate weekStart, long total, long renters, long advertisers) {
    }

    /** method: pix, credit_card, debit_card, account_money ou "simulado". */
    public record MethodRevenue(String method, BigDecimal amount, long count) {
    }

    public record TypeRevenue(String type, BigDecimal amount, long count) {
    }

    public record Neighborhood(String name, long listings, BigDecimal averagePrice) {
    }
}
