package com.rachaai.notification;

import com.rachaai.common.SimNaoConverter;
import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "notificacoes")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 30)
    private NotificationType type;

    @Column(name = "titulo", nullable = false, length = 160)
    private String title;

    @Column(name = "mensagem", length = 500)
    private String message;

    @Column(name = "link", length = 200)
    private String link;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "lida", nullable = false, length = 3)
    private Boolean read = false;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Notification() {
    }

    public Notification(User user, NotificationType type, String title, String message, String link) {
        this.user = user;
        this.type = type;
        this.title = title;
        this.message = message;
        this.link = link;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public NotificationType getType() {
        return type;
    }

    public String getTitle() {
        return title;
    }

    public String getMessage() {
        return message;
    }

    public String getLink() {
        return link;
    }

    public Boolean getRead() {
        return read;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public void markRead() {
        this.read = true;
    }
}
