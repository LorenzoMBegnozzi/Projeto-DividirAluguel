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

    @Column(name = "vagas_disponiveis")
    private Integer availableSlots;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo_aceito", nullable = false, length = 20)
    private GenderPreference genderPreference = GenderPreference.QUALQUER;

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

    @Column(name = "dormitorios")
    private Integer bedrooms;

    @Column(name = "suites")
    private Integer suites;

    @Column(name = "banheiros_sociais")
    private Integer bathrooms;

    @Column(name = "vagas_garagem")
    private Integer parkingSpots;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "garagem_carro", length = 3)
    private Boolean parkingForCar;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "garagem_moto", length = 3)
    private Boolean parkingForMotorcycle;

    @Enumerated(EnumType.STRING)
    @Column(name = "garagem_disposicao", length = 20)
    private ParkingLayout parkingLayout;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "garagem_coberta", length = 3)
    private Boolean parkingCovered;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "piscina", length = 3)
    private Boolean hasPool;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "salao_festas", length = 3)
    private Boolean hasPartyRoom;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "academia", length = 3)
    private Boolean hasGym;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "playground", length = 3)
    private Boolean hasPlayground;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "portaria_24h", length = 3)
    private Boolean hasConcierge24h;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "ativo", nullable = false, length = 3)
    private boolean active = true;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "disponivel", nullable = false, length = 3)
    private boolean available = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fechado_com_usuario_id")
    private User dealClosedWith;

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

    public GenderPreference getGenderPreference() {
        return genderPreference;
    }

    public void setGenderPreference(GenderPreference genderPreference) {
        this.genderPreference = genderPreference;
    }

    public Integer getAvailableSlots() {
        return availableSlots;
    }

    public void setAvailableSlots(Integer availableSlots) {
        this.availableSlots = availableSlots;
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

    public Integer getBedrooms() {
        return bedrooms;
    }

    public void setBedrooms(Integer bedrooms) {
        this.bedrooms = bedrooms;
    }

    public Integer getSuites() {
        return suites;
    }

    public void setSuites(Integer suites) {
        this.suites = suites;
    }

    public Integer getBathrooms() {
        return bathrooms;
    }

    public void setBathrooms(Integer bathrooms) {
        this.bathrooms = bathrooms;
    }

    public Integer getParkingSpots() {
        return parkingSpots;
    }

    public void setParkingSpots(Integer parkingSpots) {
        this.parkingSpots = parkingSpots;
    }

    public Boolean getParkingForCar() {
        return parkingForCar;
    }

    public void setParkingForCar(Boolean parkingForCar) {
        this.parkingForCar = parkingForCar;
    }

    public Boolean getParkingForMotorcycle() {
        return parkingForMotorcycle;
    }

    public void setParkingForMotorcycle(Boolean parkingForMotorcycle) {
        this.parkingForMotorcycle = parkingForMotorcycle;
    }

    public ParkingLayout getParkingLayout() {
        return parkingLayout;
    }

    public void setParkingLayout(ParkingLayout parkingLayout) {
        this.parkingLayout = parkingLayout;
    }

    public Boolean getParkingCovered() {
        return parkingCovered;
    }

    public void setParkingCovered(Boolean parkingCovered) {
        this.parkingCovered = parkingCovered;
    }

    public Boolean getHasPool() {
        return hasPool;
    }

    public void setHasPool(Boolean hasPool) {
        this.hasPool = hasPool;
    }

    public Boolean getHasPartyRoom() {
        return hasPartyRoom;
    }

    public void setHasPartyRoom(Boolean hasPartyRoom) {
        this.hasPartyRoom = hasPartyRoom;
    }

    public Boolean getHasGym() {
        return hasGym;
    }

    public void setHasGym(Boolean hasGym) {
        this.hasGym = hasGym;
    }

    public Boolean getHasPlayground() {
        return hasPlayground;
    }

    public void setHasPlayground(Boolean hasPlayground) {
        this.hasPlayground = hasPlayground;
    }

    public Boolean getHasConcierge24h() {
        return hasConcierge24h;
    }

    public void setHasConcierge24h(Boolean hasConcierge24h) {
        this.hasConcierge24h = hasConcierge24h;
    }

    public boolean isActive() {
        return active;
    }

    public void setActive(boolean active) {
        this.active = active;
    }

    public boolean isAvailable() {
        return available;
    }

    public void setAvailable(boolean available) {
        this.available = available;
    }

    public User getDealClosedWith() {
        return dealClosedWith;
    }

    public void setDealClosedWith(User dealClosedWith) {
        this.dealClosedWith = dealClosedWith;
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
