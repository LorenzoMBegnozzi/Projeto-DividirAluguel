package com.rachaai.user;

import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "usuarios")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nome", nullable = false, length = 120)
    private String name;

    @Column(nullable = false, unique = true, length = 180)
    private String email;

    @Column(name = "senha_hash", nullable = false)
    private String passwordHash;

    @Column(name = "data_nascimento", nullable = false)
    private LocalDate birthDate;

    @Column(name = "cpf", length = 11)
    private String cpf;

    @Convert(converter = RoleConverter.class)
    @Column(name = "papel", nullable = false, length = 20)
    private Role role;

    @Convert(converter = AdvertiserKindConverter.class)
    @Column(name = "tipo_anunciante", length = 20)
    private AdvertiserKind advertiserKind;

    @Column(name = "ocupacao", length = 160)
    private String occupation;

    @Column(length = 1000)
    private String bio;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "termos_seguranca_aceito_em")
    private Instant safetyTermsAcceptedAt;

    @OneToOne(mappedBy = "user", cascade = CascadeType.ALL, orphanRemoval = true)
    private UserProfile profile;

    protected User() {
    }

    public User(String name, String email, String passwordHash, LocalDate birthDate, String cpf, Role role, AdvertiserKind advertiserKind) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.birthDate = birthDate;
        this.cpf = cpf;
        this.role = role;
        this.advertiserKind = advertiserKind;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public LocalDate getBirthDate() {
        return birthDate;
    }

    public String getCpf() {
        return cpf;
    }

    public Role getRole() {
        return role;
    }

    public AdvertiserKind getAdvertiserKind() {
        return advertiserKind;
    }

    public String getOccupation() {
        return occupation;
    }

    public void setOccupation(String occupation) {
        this.occupation = occupation;
    }

    public String getBio() {
        return bio;
    }

    public void setBio(String bio) {
        this.bio = bio;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getSafetyTermsAcceptedAt() {
        return safetyTermsAcceptedAt;
    }

    public void acceptSafetyTerms() {
        this.safetyTermsAcceptedAt = Instant.now();
    }

    public UserProfile getProfile() {
        return profile;
    }

    public void setProfile(UserProfile profile) {
        this.profile = profile;
    }
}
