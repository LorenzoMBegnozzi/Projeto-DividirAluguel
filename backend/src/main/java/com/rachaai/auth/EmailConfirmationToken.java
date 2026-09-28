package com.rachaai.auth;

import com.rachaai.common.SimNaoConverter;
import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** Link de confirmação de e-mail (mesmo esquema do link de redefinir senha: só o hash é guardado). */
@Entity
@Table(name = "confirmacoes_email")
public class EmailConfirmationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Column(name = "token_hash", nullable = false, length = 64)
    private String tokenHash;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "usado", nullable = false, length = 3)
    private Boolean used = false;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "expira_em", nullable = false)
    private Instant expiresAt;

    protected EmailConfirmationToken() {
    }

    public EmailConfirmationToken(User user, String tokenHash, Instant expiresAt) {
        this.user = user;
        this.tokenHash = tokenHash;
        this.expiresAt = expiresAt;
    }

    public User getUser() {
        return user;
    }

    public boolean isValid() {
        return !used && expiresAt.isAfter(Instant.now());
    }

    public void markUsed() {
        this.used = true;
    }
}
