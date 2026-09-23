package com.rachaai.user;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Guardada numa tabela própria (não em User) para o BLOB nunca ser carregado junto
 * quando um usuário é buscado em listagens, anúncios ou conversas.
 */
@Entity
@Table(name = "fotos_usuario")
public class UserPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "usuario_id", nullable = false, unique = true)
    private Long userId;

    @Lob
    @Column(name = "conteudo", nullable = false)
    private byte[] content;

    @Column(name = "tipo_conteudo", nullable = false, length = 50)
    private String contentType;

    @Column(name = "atualizado_em", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserPhoto() {
    }

    public UserPhoto(Long userId, byte[] content, String contentType) {
        this.userId = userId;
        this.content = content;
        this.contentType = contentType;
    }

    public Long getId() {
        return id;
    }

    public Long getUserId() {
        return userId;
    }

    public byte[] getContent() {
        return content;
    }

    public String getContentType() {
        return contentType;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void replace(byte[] content, String contentType) {
        this.content = content;
        this.contentType = contentType;
        this.updatedAt = Instant.now();
    }
}
