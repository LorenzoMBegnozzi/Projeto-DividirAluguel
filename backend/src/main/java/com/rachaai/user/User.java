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

    @Column(name = "alugar", nullable = false)
    private boolean renter;

    @Column(name = "anunciar", nullable = false)
    private boolean advertiser;

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

    /** Pode abrir a área administrativa. Só muda por ADMIN_EMAILS (ver AdminBootstrap) ou no banco. */
    @Column(name = "admin", nullable = false)
    private boolean admin;

    /** Preenchido = conta bloqueada por um admin. */
    @Column(name = "bloqueado_em")
    private Instant blockedAt;

    @Column(name = "motivo_bloqueio", length = 500)
    private String blockReason;

    @Column(name = "bloqueado_por_id")
    private Long blockedById;

    /** Vai dentro do token de login; somar 1 invalida todos os logins abertos desta conta. */
    @Column(name = "versao_token", nullable = false)
    private int tokenVersion;

    /** Quando e qual versão dos Termos de Uso / Política de Privacidade foi aceita (LGPD). */
    @Column(name = "termos_aceitos_em")
    private Instant legalTermsAcceptedAt;

    @Column(name = "versao_termos", length = 20)
    private String legalTermsVersion;

    /** Preenchido = a pessoa clicou no link de confirmação do e-mail. */
    @Column(name = "email_confirmado_em")
    private Instant emailConfirmedAt;

    /** Preenchido = a pessoa excluiu a conta e os dados pessoais foram apagados. */
    @Column(name = "excluido_em")
    private Instant deletedAt;

    protected User() {
    }

    public User(String name, String email, String passwordHash, LocalDate birthDate, String cpf, boolean renter, boolean advertiser, AdvertiserKind advertiserKind) {
        this.name = name;
        this.email = email;
        this.passwordHash = passwordHash;
        this.birthDate = birthDate;
        this.cpf = cpf;
        this.renter = renter;
        this.advertiser = advertiser;
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

    public boolean isRenter() {
        return renter;
    }

    public void setRenter(boolean renter) {
        this.renter = renter;
    }

    public boolean isAdvertiser() {
        return advertiser;
    }

    public void enableAdvertiser(AdvertiserKind advertiserKind) {
        this.advertiser = true;
        this.advertiserKind = advertiserKind;
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

    public boolean isAdmin() {
        return admin;
    }

    public void setAdmin(boolean admin) {
        this.admin = admin;
    }

    public boolean isBlocked() {
        return blockedAt != null;
    }

    public Instant getBlockedAt() {
        return blockedAt;
    }

    public String getBlockReason() {
        return blockReason;
    }

    public void block(String reason, Long adminId) {
        this.blockedAt = Instant.now();
        this.blockReason = reason;
        this.blockedById = adminId;
        revokeSessions();
    }

    public void unblock() {
        this.blockedAt = null;
        this.blockReason = null;
        this.blockedById = null;
    }

    public int getTokenVersion() {
        return tokenVersion;
    }

    /** Derruba todos os logins abertos: tokens emitidos antes deixam de valer. */
    public void revokeSessions() {
        this.tokenVersion++;
    }

    public String getLegalTermsVersion() {
        return legalTermsVersion;
    }

    public Instant getLegalTermsAcceptedAt() {
        return legalTermsAcceptedAt;
    }

    public void acceptLegalTerms(String version) {
        this.legalTermsVersion = version;
        this.legalTermsAcceptedAt = Instant.now();
    }

    public boolean isEmailConfirmed() {
        return emailConfirmedAt != null;
    }

    public void confirmEmail() {
        if (emailConfirmedAt == null) {
            emailConfirmedAt = Instant.now();
        }
    }

    /**
     * Ações que envolvem outras pessoas (anunciar, conversar, demonstrar interesse) exigem e-mail
     * confirmado: é o que impede alguém de se cadastrar com o e-mail de outra pessoa e sair agindo.
     *
     * @param action o que a pessoa tentou fazer, para a mensagem ("publicar anúncios")
     */
    public void requireConfirmedEmail(String action) {
        if (!isEmailConfirmed()) {
            throw com.rachaai.common.ApiException.forbidden("Confirme seu e-mail para " + action
                    + ". Enviamos um link para " + email + "; se não chegou, use \"Reenviar e-mail\" no aviso do topo da página.");
        }
    }

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /**
     * Exclusão de conta (LGPD): apaga os dados pessoais da própria linha. Nome, e-mail, CPF,
     * nascimento, bio e ocupação somem; a senha vira um hash que ninguém conhece; todos os logins
     * caem. A linha continua existindo só como "Usuário excluído", para os pagamentos e denúncias
     * ligados a ela (que a lei manda guardar) não perderem a referência.
     *
     * @param unusablePasswordHash hash de uma senha aleatória descartada
     */
    public void anonymize(String unusablePasswordHash) {
        this.name = "Usuário excluído";
        this.email = "excluido-" + id + "@conta-excluida.invalid";
        this.cpf = null;
        this.birthDate = LocalDate.of(1900, 1, 1);
        this.passwordHash = unusablePasswordHash;
        this.occupation = null;
        this.bio = null;
        this.safetyTermsAcceptedAt = null;
        this.deletedAt = Instant.now();
        revokeSessions();
    }
}
