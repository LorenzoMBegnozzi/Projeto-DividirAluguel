package com.rachaai.moderation;

import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "denuncias")
public class Report {

    @Id
    // Sequência, não IDENTITY: ver o mesmo comentário em Notification.java (RLS + RETURNING).
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "seq_denuncias")
    @SequenceGenerator(name = "seq_denuncias", sequenceName = "seq_denuncias", allocationSize = 1)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "denunciante_id", nullable = false)
    private User reporter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "denunciado_id", nullable = false)
    private User reported;

    @Column(name = "conversa_id")
    private Long conversationId;

    @Enumerated(EnumType.STRING)
    @Column(name = "motivo", nullable = false, length = 30)
    private ReportReason reason;

    @Column(name = "descricao", length = 1000)
    private String description;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ReportStatus status = ReportStatus.ABERTA;

    @Column(name = "resolvida_em")
    private Instant resolvedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolvida_por_id")
    private User resolvedBy;

    @Column(name = "nota_admin", length = 1000)
    private String adminNote;

    protected Report() {
    }

    public Report(User reporter, User reported, Long conversationId, ReportReason reason, String description) {
        this.reporter = reporter;
        this.reported = reported;
        this.conversationId = conversationId;
        this.reason = reason;
        this.description = description;
    }

    public Long getId() {
        return id;
    }

    public User getReporter() {
        return reporter;
    }

    public User getReported() {
        return reported;
    }

    public Long getConversationId() {
        return conversationId;
    }

    public ReportReason getReason() {
        return reason;
    }

    public String getDescription() {
        return description;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public ReportStatus getStatus() {
        return status;
    }

    public Instant getResolvedAt() {
        return resolvedAt;
    }

    public User getResolvedBy() {
        return resolvedBy;
    }

    public String getAdminNote() {
        return adminNote;
    }

    /** Fecha a denúncia (RESOLVIDA ou DESCARTADA), registrando quem decidiu e por quê. */
    public void close(ReportStatus newStatus, User admin, String note) {
        if (newStatus == ReportStatus.ABERTA) {
            throw new IllegalArgumentException("Use RESOLVIDA ou DESCARTADA para fechar uma denúncia");
        }
        this.status = newStatus;
        this.resolvedAt = Instant.now();
        this.resolvedBy = admin;
        this.adminNote = note;
    }
}
