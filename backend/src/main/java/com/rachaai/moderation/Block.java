package com.rachaai.moderation;

import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** Bloqueio unilateral: quem bloqueia deixa de ver e ser visto pela outra pessoa. */
@Entity
@Table(name = "bloqueios")
public class Block {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "bloqueado_id", nullable = false)
    private User blocked;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Block() {
    }

    public Block(User user, User blocked) {
        this.user = user;
        this.blocked = blocked;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public User getBlocked() {
        return blocked;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
