package com.rachaai.admin;

import com.rachaai.admin.dto.AdminDtos;
import com.rachaai.billing.PaymentRepository;
import com.rachaai.billing.PaymentStatus;
import com.rachaai.common.ApiException;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.moderation.Report;
import com.rachaai.moderation.ReportRepository;
import com.rachaai.moderation.ReportStatus;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Moderação e visão geral do site. Só é chamado por /api/admin/**, que exige ROLE_ADMIN
 * (SecurityConfig). Toda ação que muda algo fica registrada no log com o id do admin.
 */
@Service
public class AdminService {

    private static final Logger log = LoggerFactory.getLogger(AdminService.class);
    private static final int MAX_LISTED = 200;

    private final UserRepository userRepository;
    private final ListingRepository listingRepository;
    private final ReportRepository reportRepository;
    private final PaymentRepository paymentRepository;

    public AdminService(
            UserRepository userRepository,
            ListingRepository listingRepository,
            ReportRepository reportRepository,
            PaymentRepository paymentRepository
    ) {
        this.userRepository = userRepository;
        this.listingRepository = listingRepository;
        this.reportRepository = reportRepository;
        this.paymentRepository = paymentRepository;
    }

    @Transactional(readOnly = true)
    public AdminDtos.Summary summary() {
        return new AdminDtos.Summary(
                userRepository.count(),
                userRepository.countByBlockedAtIsNotNull(),
                listingRepository.countByActiveTrue(),
                reportRepository.countByStatus(ReportStatus.ABERTA),
                paymentRepository.countByStatus(PaymentStatus.PAGO),
                paymentRepository.countByStatus(PaymentStatus.PENDENTE)
        );
    }

    // ---------------------------------------------------------------- denúncias

    /** status nulo = todas. */
    @Transactional(readOnly = true)
    public List<AdminDtos.Report> listReports(ReportStatus status) {
        List<Report> reports = status == null
                ? reportRepository.findAllByOrderByCreatedAtDesc(Limit.of(MAX_LISTED))
                : reportRepository.findAllByStatusOrderByCreatedAtDesc(status, Limit.of(MAX_LISTED));
        Map<Long, Long> counts = reportCounts(reports.stream()
                .flatMap(r -> java.util.stream.Stream.of(r.getReporter().getId(), r.getReported().getId()))
                .distinct().toList());
        return reports.stream().map(r -> toDto(r, counts)).toList();
    }

    @Transactional
    public AdminDtos.Report closeReport(Long adminId, Long reportId, AdminDtos.CloseReportRequest request) {
        if (request.status() == ReportStatus.ABERTA) {
            throw ApiException.badRequest("Para fechar a denúncia, use RESOLVIDA ou DESCARTADA");
        }
        User admin = requireUser(adminId);
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> ApiException.notFound("Denúncia não encontrada"));
        if (report.getStatus() != ReportStatus.ABERTA) {
            throw ApiException.conflict("Essa denúncia já foi analisada");
        }

        report.close(request.status(), admin, blankToNull(request.note()));
        if (request.blockReported()) {
            String reason = "Denúncia #" + report.getId() + ": " + report.getReason()
                    + (request.note() != null && !request.note().isBlank() ? " — " + request.note() : "");
            blockUser(adminId, report.getReported().getId(), new AdminDtos.BlockRequest(truncate(reason, 500)));
        }
        log.info("Admin {} fechou a denúncia {} como {} (bloquear denunciado: {})",
                adminId, reportId, request.status(), request.blockReported());

        Map<Long, Long> counts = reportCounts(List.of(report.getReporter().getId(), report.getReported().getId()));
        return toDto(report, counts);
    }

    // ---------------------------------------------------------------- usuários

    @Transactional(readOnly = true)
    public List<AdminDtos.User> listUsers(String search) {
        List<User> users = userRepository.searchForAdmin(normalize(search), Limit.of(MAX_LISTED));
        Map<Long, Long> counts = reportCounts(users.stream().map(User::getId).toList());
        return users.stream().map(u -> toDto(u, counts.getOrDefault(u.getId(), 0L))).toList();
    }

    /**
     * Bloqueia a conta: não entra mais, os logins abertos caem na hora (versão de sessão) e os
     * anúncios somem da busca. Nada é apagado: desbloquear devolve tudo como estava.
     */
    @Transactional
    public AdminDtos.User blockUser(Long adminId, Long userId, AdminDtos.BlockRequest request) {
        if (adminId.equals(userId)) {
            throw ApiException.badRequest("Você não pode bloquear a sua própria conta");
        }
        User user = requireUser(userId);
        if (user.isAdmin()) {
            throw ApiException.forbidden("Contas de administrador não podem ser bloqueadas por aqui");
        }
        if (!user.isBlocked()) {
            user.block(request.reason().trim(), adminId);
            // Denúncias abertas contra a pessoa ficam resolvidas pelo bloqueio.
            User admin = requireUser(adminId);
            reportRepository.findAllByReportedIdAndStatus(userId, ReportStatus.ABERTA)
                    .forEach(r -> r.close(ReportStatus.RESOLVIDA, admin, "Conta bloqueada: " + request.reason().trim()));
            log.info("Admin {} bloqueou o usuário {}: {}", adminId, userId, request.reason());
        }
        return toDto(user, reportRepository.countByReportedId(userId));
    }

    @Transactional
    public AdminDtos.User unblockUser(Long adminId, Long userId) {
        User user = requireUser(userId);
        if (user.isBlocked()) {
            user.unblock();
            log.info("Admin {} desbloqueou o usuário {}", adminId, userId);
        }
        return toDto(user, reportRepository.countByReportedId(userId));
    }

    // ---------------------------------------------------------------- anúncios

    @Transactional(readOnly = true)
    public List<AdminDtos.Listing> listListings(String search) {
        return listingRepository.searchForAdmin(normalize(search), Limit.of(MAX_LISTED)).stream()
                .map(this::toDto)
                .toList();
    }

    /** Tira o anúncio do ar (mesmo efeito de o dono remover). */
    @Transactional
    public AdminDtos.Listing deactivateListing(Long adminId, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        if (listing.isActive()) {
            listing.setActive(false);
            log.info("Admin {} tirou do ar o anúncio {} (dono {})", adminId, listingId, listing.getUser().getId());
        }
        return toDto(listing);
    }

    // ---------------------------------------------------------------- conversões

    private AdminDtos.Report toDto(Report r, Map<Long, Long> counts) {
        return new AdminDtos.Report(
                r.getId(),
                person(r.getReporter(), counts),
                person(r.getReported(), counts),
                r.getConversationId(),
                r.getReason(),
                r.getDescription(),
                r.getStatus(),
                r.getCreatedAt(),
                r.getResolvedAt(),
                r.getResolvedBy() != null ? r.getResolvedBy().getName() : null,
                r.getAdminNote()
        );
    }

    private AdminDtos.ReportPerson person(User u, Map<Long, Long> counts) {
        return new AdminDtos.ReportPerson(u.getId(), u.getName(), u.getEmail(), u.isBlocked(), counts.getOrDefault(u.getId(), 0L));
    }

    private AdminDtos.User toDto(User u, long reportsReceived) {
        return new AdminDtos.User(
                u.getId(), u.getName(), u.getEmail(), u.getCreatedAt(),
                u.isRenter(), u.isAdvertiser(), u.isAdmin(),
                u.isBlocked(), u.getBlockedAt(), u.getBlockReason(),
                reportsReceived,
                listingRepository.countByUserIdAndActiveTrue(u.getId())
        );
    }

    private AdminDtos.Listing toDto(Listing l) {
        return new AdminDtos.Listing(
                l.getId(), l.getTitle(), l.getType(),
                l.getUser().getId(), l.getUser().getName(), l.getUser().isBlocked(),
                l.isActive(), l.isAvailable(), l.isHighlighted(), l.getCreatedAt()
        );
    }

    private Map<Long, Long> reportCounts(List<Long> userIds) {
        Map<Long, Long> counts = new HashMap<>();
        if (!userIds.isEmpty()) {
            for (Object[] row : reportRepository.countByReportedIds(userIds)) {
                counts.put((Long) row[0], (Long) row[1]);
            }
        }
        return counts;
    }

    private User requireUser(Long id) {
        return userRepository.findById(id).orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
    }

    private static String normalize(String search) {
        return search == null ? "" : search.trim().toLowerCase();
    }

    private static String blankToNull(String text) {
        return text == null || text.isBlank() ? null : text.trim();
    }

    private static String truncate(String text, int max) {
        return text.length() <= max ? text : text.substring(0, max);
    }
}
