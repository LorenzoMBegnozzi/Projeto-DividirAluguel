package com.rachaai.interest;

import com.rachaai.listing.Listing;
import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** "Tenho interesse" em um estabelecimento: liga quem se interessou ao anúncio. */
@Entity
@Table(name = "interesses")
public class Interest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "anuncio_id", nullable = false)
    private Listing listing;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Interest() {
    }

    public Interest(Listing listing, User user) {
        this.listing = listing;
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public Listing getListing() {
        return listing;
    }

    public User getUser() {
        return user;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
