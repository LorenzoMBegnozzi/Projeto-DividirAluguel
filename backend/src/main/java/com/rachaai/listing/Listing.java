package com.rachaai.listing;

import com.rachaai.common.SimNaoConverter;
import com.rachaai.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "anuncios")
public class Listing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private ListingType type;

    @Column(name = "titulo", nullable = false, length = 160)
    private String title;

    @Column(name = "descricao", length = 2000)
    private String description;

    @Column(name = "bairro_preferido", length = 160)
    private String preferredNeighborhood;

    @Column(name = "faculdade_proxima", length = 160)
    private String nearCollege;

    @Column(name = "preco")
    private BigDecimal price;

    @Column(name = "endereco", length = 255)
    private String address;

    private Double latitude;

    private Double longitude;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "aceita_pets", length = 3)
    private Boolean acceptsPets;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "aceita_fumante", length = 3)
    private Boolean acceptsSmoker;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "ativo", nullable = false, length = 3)
    private boolean active = true;

    @Column(name = "expira_em")
    private Instant expiresAt;

    @Column(name = "destaque_ate")
    private Instant highlightedUntil;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected Listing() {
    }

    public Listing(User user, ListingType type, String title) {
        this.user = user;
        this.type = type;
        this.title = title;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public ListingType getType() {
        return type;
    }

    public void setType(ListingType type) {
        this.type = type;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getPreferredNeighborhood() {
        return preferredNeighborhood;
    }

    public void setPreferredNeighborhood(String preferredNeighborhood) {
        this.preferredNeighborhood = preferredNeighborhood;
    }

    public String getNearCollege() {
        return nearCollege;
    }

    public void setNearCollege(String nearCollege) {
        this.nearCollege = nearCollege;
    }

    public BigDecimal getPrice() {
        return price;
    }

    public void setPrice(BigDecimal price) {
        this.price = price;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Boolean getAcceptsPets() {
        return acceptsPets;
    }

    public void setAcceptsPets(Boolean acceptsPets) {
        this.acceptsPets = acceptsPets;
    }

    public Boolean getAcceptsSmoker() {
        return acceptsSmoker;
    }

    public void setAcceptsSmoker(Boolean acceptsSmoker) {
        this.acceptsSmoker = acceptsSmoker;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public Instant getExpiresAt() {
        return expiresAt;
    }

    public void setExpiresAt(Instant expiresAt) {
        this.expiresAt = expiresAt;
    }

    public Instant getHighlightedUntil() {
        return highlightedUntil;
    }

    public void setHighlightedUntil(Instant highlightedUntil) {
        this.highlightedUntil = highlightedUntil;
    }

    public boolean isHighlighted() {
        return highlightedUntil != null && highlightedUntil.isAfter(Instant.now());
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
