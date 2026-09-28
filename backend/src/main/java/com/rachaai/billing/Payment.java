package com.rachaai.billing;

import com.rachaai.user.User;
import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "pagamentos")
public class Payment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    private User user;

    @Column(name = "anuncio_id")
    private Long listingId;

    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false, length = 20)
    private PaymentType type;

    @Column(name = "valor", nullable = false)
    private BigDecimal amount;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private PaymentStatus status = PaymentStatus.PENDENTE;

    @Column(name = "referencia_externa", length = 100)
    private String externalReference;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "pago_em")
    private Instant paidAt;

    @Version
    @Column(name = "versao", nullable = false)
    private long version;

    /** Quem processou (MERCADOPAGO). Nulo = modo simulado. */
    @Column(name = "gateway", length = 20)
    private String gateway;

    /** Página do checkout no gateway, para retomar um pagamento pendente. */
    @Column(name = "link_pagamento", length = 500)
    private String checkoutUrl;

    @Column(name = "gateway_pagamento_id", length = 40)
    private String gatewayPaymentId;

    /** Como pagou: pix, credit_card, debit_card, account_money... (vem do gateway). */
    @Column(name = "metodo", length = 30)
    private String method;

    /** Último status informado pelo gateway (approved, pending, rejected...). */
    @Column(name = "status_gateway", length = 30)
    private String gatewayStatus;

    @Column(name = "reembolsado_em")
    private Instant refundedAt;

    /** Admin que fez o reembolso (nulo = reembolso/estorno feito direto no Mercado Pago). */
    @Column(name = "reembolsado_por_id")
    private Long refundedById;

    @Column(name = "motivo_reembolso", length = 500)
    private String refundReason;

    protected Payment() {
    }

    public Payment(User user, PaymentType type, BigDecimal amount, Long listingId) {
        this.user = user;
        this.type = type;
        this.amount = amount;
        this.listingId = listingId;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Long getListingId() {
        return listingId;
    }

    public void setListingId(Long listingId) {
        this.listingId = listingId;
    }

    public PaymentType getType() {
        return type;
    }

    public BigDecimal getAmount() {
        return amount;
    }

    public PaymentStatus getStatus() {
        return status;
    }

    public String getExternalReference() {
        return externalReference;
    }

    public void setExternalReference(String externalReference) {
        this.externalReference = externalReference;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getPaidAt() {
        return paidAt;
    }

    public void markPaid() {
        this.status = PaymentStatus.PAGO;
        this.paidAt = Instant.now();
    }

    public void cancel() {
        this.status = PaymentStatus.CANCELADO;
    }

    public void markRefunded(Long adminId, String reason) {
        this.status = PaymentStatus.REEMBOLSADO;
        this.refundedAt = Instant.now();
        this.refundedById = adminId;
        this.refundReason = reason;
    }

    public Instant getRefundedAt() {
        return refundedAt;
    }

    public String getRefundReason() {
        return refundReason;
    }

    public String getGateway() {
        return gateway;
    }

    public String getCheckoutUrl() {
        return checkoutUrl;
    }

    public String getGatewayPaymentId() {
        return gatewayPaymentId;
    }

    public String getMethod() {
        return method;
    }

    public String getGatewayStatus() {
        return gatewayStatus;
    }

    /** Cobrança criada no gateway: guarda o id dela e o link do checkout. */
    public void attachCheckout(String gateway, String checkoutId, String checkoutUrl) {
        this.gateway = gateway;
        this.externalReference = checkoutId;
        this.checkoutUrl = checkoutUrl;
    }

    /** O que o gateway respondeu sobre a última tentativa de pagamento. */
    public void recordGatewayAttempt(String gatewayPaymentId, String gatewayStatus, String method) {
        this.gatewayPaymentId = gatewayPaymentId;
        this.gatewayStatus = gatewayStatus;
        this.method = method;
    }
}
