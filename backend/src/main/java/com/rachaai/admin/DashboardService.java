package com.rachaai.admin;

import com.rachaai.admin.dto.DashboardDto;
import com.rachaai.billing.Payment;
import com.rachaai.billing.PaymentStatus;
import com.rachaai.listing.Listing;
import com.rachaai.moderation.ReportStatus;
import com.rachaai.user.User;
import jakarta.persistence.EntityManager;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.text.Normalizer;
import java.time.DayOfWeek;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Números do dashboard do admin. Tudo sai de dados que o sistema já guarda; nada novo é coletado.
 * Só contagens e somas: nenhum dado pessoal sai daqui.
 */
@Service
public class DashboardService {

    private static final Logger log = LoggerFactory.getLogger(DashboardService.class);
    private static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final int TOP_NEIGHBORHOODS = 5;

    private final EntityManager em;
    private final JdbcTemplate jdbc;

    public DashboardService(EntityManager em, JdbcTemplate jdbc) {
        this.em = em;
        this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    public DashboardDto build(int days) {
        Instant now = Instant.now();
        Instant from = now.minus(Duration.ofDays(days));
        Instant previousFrom = from.minus(Duration.ofDays(days));

        List<User> newUsers = em.createQuery(
                        "select u from User u where u.createdAt >= :from and u.deletedAt is null and u.admin = false", User.class)
                .setParameter("from", from)
                .getResultList();
        long previousUsers = count("select count(u) from User u where u.createdAt >= :a and u.createdAt < :b and u.admin = false",
                Map.of("a", previousFrom, "b", from));

        List<Payment> paid = em.createQuery("select p from Payment p where p.status = :s and p.paidAt >= :from", Payment.class)
                .setParameter("s", PaymentStatus.PAGO)
                .setParameter("from", from)
                .getResultList();
        BigDecimal revenue = paid.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        long refunds = count("select count(p) from Payment p where p.status = :s and p.refundedAt >= :from",
                Map.of("s", PaymentStatus.REEMBOLSADO, "from", from));

        DashboardDto.Kpis kpis = new DashboardDto.Kpis(
                newUsers.size(),
                previousUsers,
                newUsers.stream().filter(User::isRenter).count(),
                newUsers.stream().filter(User::isAdvertiser).count(),
                activeUsers(from),
                count("select count(u) from User u where u.deletedAt is null and u.admin = false", Map.of()),
                revenue,
                paid.size(),
                refunds,
                paid.isEmpty() ? BigDecimal.ZERO : revenue.divide(BigDecimal.valueOf(paid.size()), 2, RoundingMode.HALF_UP),
                count("select count(l) from Listing l where l.closedAt >= :from", Map.of("from", from)),
                count("select count(l) from Listing l where l.active = true and l.available = true", Map.of())
        );

        return new DashboardDto(days, kpis, attention(now), signupsByWeek(newUsers, days), byMethod(paid), byType(paid),
                topNeighborhoods());
    }

    private DashboardDto.Attention attention(Instant now) {
        List<Object[]> reportsPerUser = em.createQuery(
                        "select r.reported.id, count(r) from Report r where r.status = :s and r.reported.blockedAt is null "
                                + "group by r.reported.id having count(r) >= 2", Object[].class)
                .setParameter("s", ReportStatus.ABERTA)
                .getResultList();
        return new DashboardDto.Attention(
                count("select count(r) from Report r where r.status = :s and r.createdAt < :limit",
                        Map.of("s", ReportStatus.ABERTA, "limit", now.minus(Duration.ofHours(24)))),
                count("select count(p) from Payment p where p.status = :s and p.paidAt >= :limit",
                        Map.of("s", PaymentStatus.PAGO, "limit", now.minus(Duration.ofDays(7)))),
                count("select count(p) from Payment p where p.status = :s and p.createdAt < :limit",
                        Map.of("s", PaymentStatus.PENDENTE, "limit", now.minus(Duration.ofDays(1)))),
                count("select count(u) from User u where u.emailConfirmedAt is null and u.deletedAt is null and u.admin = false",
                        Map.of()),
                reportsPerUser.size()
        );
    }

    /** Semanas (segunda a domingo) que cobrem o período, com os cadastros de cada uma. */
    private List<DashboardDto.WeekCount> signupsByWeek(List<User> users, int days) {
        LocalDate today = LocalDate.now(ZONE);
        LocalDate firstWeek = today.minusDays(days - 1L).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        Map<LocalDate, long[]> weeks = new LinkedHashMap<>();
        for (LocalDate w = firstWeek; !w.isAfter(today); w = w.plusWeeks(1)) {
            weeks.put(w, new long[3]);
        }
        for (User u : users) {
            LocalDate week = u.getCreatedAt().atZone(ZONE).toLocalDate().with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
            long[] c = weeks.get(week);
            if (c != null) {
                c[2]++;
                if (u.isRenter()) c[0]++;
                if (u.isAdvertiser()) c[1]++;
            }
        }
        List<DashboardDto.WeekCount> result = new ArrayList<>();
        weeks.forEach((w, c) -> result.add(new DashboardDto.WeekCount(w, c[2], c[0], c[1])));
        return result;
    }

    private List<DashboardDto.MethodRevenue> byMethod(List<Payment> paid) {
        Map<String, List<Payment>> groups = new HashMap<>();
        for (Payment p : paid) {
            groups.computeIfAbsent(p.getMethod() != null ? p.getMethod() : "simulado", k -> new ArrayList<>()).add(p);
        }
        return groups.entrySet().stream()
                .map(e -> new DashboardDto.MethodRevenue(e.getKey(), sum(e.getValue()), e.getValue().size()))
                .sorted(Comparator.comparing(DashboardDto.MethodRevenue::amount).reversed())
                .toList();
    }

    private List<DashboardDto.TypeRevenue> byType(List<Payment> paid) {
        Map<String, List<Payment>> groups = new HashMap<>();
        for (Payment p : paid) {
            groups.computeIfAbsent(p.getType().name(), k -> new ArrayList<>()).add(p);
        }
        return groups.entrySet().stream()
                .map(e -> new DashboardDto.TypeRevenue(e.getKey(), sum(e.getValue()), e.getValue().size()))
                .sorted(Comparator.comparing(DashboardDto.TypeRevenue::amount).reversed())
                .toList();
    }

    /** Bairros com mais anúncios ativos; "Zona 7", "zona 7 " e "ZONA 7" contam juntos. */
    private List<DashboardDto.Neighborhood> topNeighborhoods() {
        List<Listing> active = em.createQuery(
                        "select l from Listing l where l.active = true and l.available = true and l.preferredNeighborhood is not null",
                        Listing.class)
                .getResultList();
        Map<String, List<Listing>> groups = new HashMap<>();
        Map<String, String> displayName = new HashMap<>();
        for (Listing l : active) {
            String name = l.getPreferredNeighborhood().trim().replaceAll("\\s+", " ");
            if (name.isEmpty()) continue;
            String key = Normalizer.normalize(name.toLowerCase(), Normalizer.Form.NFD).replaceAll("\\p{M}", "");
            groups.computeIfAbsent(key, k -> new ArrayList<>()).add(l);
            displayName.putIfAbsent(key, name);
        }
        return groups.entrySet().stream()
                .map(e -> {
                    List<BigDecimal> prices = e.getValue().stream().map(Listing::getPrice).filter(p -> p != null).toList();
                    BigDecimal avg = prices.isEmpty() ? null
                            : prices.stream().reduce(BigDecimal.ZERO, BigDecimal::add)
                                    .divide(BigDecimal.valueOf(prices.size()), 0, RoundingMode.HALF_UP);
                    return new DashboardDto.Neighborhood(displayName.get(e.getKey()), e.getValue().size(), avg);
                })
                .sorted(Comparator.comparingLong(DashboardDto.Neighborhood::listings).reversed()
                        .thenComparing(DashboardDto.Neighborhood::name))
                .limit(TOP_NEIGHBORHOODS)
                .toList();
    }

    /** Contas distintas nos registros de acesso do período (a tabela só existe no Oracle). */
    private Long activeUsers(Instant from) {
        try {
            return jdbc.queryForObject(
                    "SELECT COUNT(DISTINCT usuario_id) FROM registros_acesso WHERE usuario_id IS NOT NULL AND criado_em >= ?",
                    Long.class, Timestamp.from(from));
        } catch (RuntimeException e) {
            log.debug("Usuários ativos indisponíveis: {}", e.getMessage());
            return null;
        }
    }

    private long count(String jpql, Map<String, Object> params) {
        var query = em.createQuery(jpql, Long.class);
        params.forEach(query::setParameter);
        return query.getSingleResult();
    }

    private static BigDecimal sum(List<Payment> payments) {
        return payments.stream().map(Payment::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
