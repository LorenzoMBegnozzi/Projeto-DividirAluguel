package com.rachaai.conversation;

import com.rachaai.listing.Listing;
import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "conversas")
public class Conversation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "inquilino_id", nullable = false)
    private User renter;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Conversation() {
    }

    public Conversation(Listing listing, User renter) {
        this.listing = listing;
        this.renter = renter;
    }

    public Long getId() {
        return id;
    }

    public Listing getListing() {
        return listing;
    }

    public User getRenter() {
        return renter;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean includes(Long userId) {
        return renter.getId().equals(userId) || listing.getUser().getId().equals(userId);
    }

    public User other(Long userId) {
        return renter.getId().equals(userId) ? listing.getUser() : renter;
    }
}
