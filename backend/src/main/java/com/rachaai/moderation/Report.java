package com.rachaai.moderation;

import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "denuncias")
public class Report {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
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
}
