package com.rachaai.rating;

import com.rachaai.user.User;
import jakarta.persistence.*;

import java.time.Instant;
import java.time.LocalDate;

/** Registro de que dois usuários moraram juntos, proposto por um e confirmado pelo outro. */
@Entity
@Table(name = "convivios")
public class Convivio {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario1_id", nullable = false)
    private User usuario1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario2_id", nullable = false)
    private User usuario2;

    @Column(name = "proposto_por_id", nullable = false)
    private Long propostoPorId;

    @Column(name = "periodo_inicio", nullable = false)
    private LocalDate periodoInicio;

    @Column(name = "periodo_fim")
    private LocalDate periodoFim;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private ConvivioStatus status = ConvivioStatus.PENDENTE;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    @Column(name = "confirmado_em")
    private Instant confirmadoEm;

    protected Convivio() {
    }

    public Convivio(User usuario1, User usuario2, Long propostoPorId, LocalDate periodoInicio, LocalDate periodoFim) {
        this.usuario1 = usuario1;
        this.usuario2 = usuario2;
        this.propostoPorId = propostoPorId;
        this.periodoInicio = periodoInicio;
        this.periodoFim = periodoFim;
    }

    public Long getId() {
        return id;
    }

    public User getUsuario1() {
        return usuario1;
    }

    public User getUsuario2() {
        return usuario2;
    }

    public Long getPropostoPorId() {
        return propostoPorId;
    }

    public LocalDate getPeriodoInicio() {
        return periodoInicio;
    }

    public LocalDate getPeriodoFim() {
        return periodoFim;
    }

    public ConvivioStatus getStatus() {
        return status;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public Instant getConfirmadoEm() {
        return confirmadoEm;
    }

    public boolean envolve(Long usuarioId) {
        return usuario1.getId().equals(usuarioId) || usuario2.getId().equals(usuarioId);
    }

    public User getOutroUsuario(Long usuarioId) {
        return usuario1.getId().equals(usuarioId) ? usuario2 : usuario1;
    }

    public void confirmar() {
        this.status = ConvivioStatus.CONFIRMADO;
        this.confirmadoEm = Instant.now();
    }

    public void recusar() {
        this.status = ConvivioStatus.RECUSADO;
    }
}
