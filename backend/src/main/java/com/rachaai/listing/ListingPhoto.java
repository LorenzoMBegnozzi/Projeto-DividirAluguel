package com.rachaai.listing;

import jakarta.persistence.*;

import java.time.Instant;

/**
 * Guardada numa tabela própria (não em Listing) pelo mesmo motivo das fotos de perfil:
 * o BLOB nunca deve ser carregado junto quando o anúncio aparece em listagens/busca.
 */
@Entity
@Table(name = "fotos_anuncio")
public class ListingPhoto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "anuncio_id", nullable = false)
    private Long listingId;

    @Lob
    @Column(name = "conteudo", nullable = false)
    private byte[] content;

    @Column(name = "tipo_conteudo", nullable = false, length = 50)
    private String contentType;

    @Column(name = "ordem", nullable = false)
    private int sortOrder;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    protected ListingPhoto() {
    }

    public ListingPhoto(Long listingId, byte[] content, String contentType, int sortOrder) {
        this.listingId = listingId;
        this.content = content;
        this.contentType = contentType;
        this.sortOrder = sortOrder;
    }

    public Long getId() {
        return id;
    }

    public Long getListingId() {
        return listingId;
    }

    public byte[] getContent() {
        return content;
    }

    public String getContentType() {
        return contentType;
    }

    public int getSortOrder() {
        return sortOrder;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
