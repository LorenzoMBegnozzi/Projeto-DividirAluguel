package com.rachaai.rating;

import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;

/** Avaliação de um usuário sobre o outro, referente a um convívio confirmado entre os dois. */
@Entity
@Table(name = "avaliacoes")
public class Avaliacao {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "convivio_id", nullable = false)
    private Convivio convivio;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avaliador_id", nullable = false)
    private User avaliador;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "avaliado_id", nullable = false)
    private User avaliado;

    @Column(name = "nota_pontualidade", nullable = false)
    private Integer notaPontualidade;

    @Column(name = "nota_convivencia", nullable = false)
    private Integer notaConvivencia;

    @Column(name = "comentario", length = 1000)
    private String comentario;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    protected Avaliacao() {
    }

    public Avaliacao(
            Convivio convivio,
            User avaliador,
            User avaliado,
            Integer notaPontualidade,
            Integer notaConvivencia,
            String comentario
    ) {
        this.convivio = convivio;
        this.avaliador = avaliador;
        this.avaliado = avaliado;
        this.notaPontualidade = notaPontualidade;
        this.notaConvivencia = notaConvivencia;
        this.comentario = comentario;
    }

    public Long getId() {
        return id;
    }

    public Convivio getConvivio() {
        return convivio;
    }

    public User getAvaliador() {
        return avaliador;
    }

    public User getAvaliado() {
        return avaliado;
    }

    public Integer getNotaPontualidade() {
        return notaPontualidade;
    }

    public Integer getNotaConvivencia() {
        return notaConvivencia;
    }

    public String getComentario() {
        return comentario;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }
}
