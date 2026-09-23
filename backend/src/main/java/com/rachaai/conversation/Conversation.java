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

    /**
     * Segundo participante quando a conversa é entre duas pessoas interessadas no mesmo
     * anúncio (não com o dono). Nulo = conversa de sempre, com o dono do anúncio.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario2_id")
    private User secondUser;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Conversation() {
    }

    /** Conversa entre um inquilino e o dono do anúncio. */
    public Conversation(Listing listing, User renter) {
        this.listing = listing;
        this.renter = renter;
    }

    /** Conversa entre duas pessoas interessadas no mesmo anúncio. */
    public Conversation(Listing listing, User renter, User secondUser) {
        this.listing = listing;
        this.renter = renter;
        this.secondUser = secondUser;
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

    public User getSecondUser() {
        return secondUser;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public boolean includes(Long userId) {
        if (secondUser != null) {
            return renter.getId().equals(userId) || secondUser.getId().equals(userId);
        }
        return renter.getId().equals(userId) || listing.getUser().getId().equals(userId);
    }

    public User other(Long userId) {
        if (secondUser != null) {
            return renter.getId().equals(userId) ? secondUser : renter;
        }
        return renter.getId().equals(userId) ? listing.getUser() : renter;
    }
}
