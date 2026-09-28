package com.rachaai.billing;

import com.rachaai.billing.dto.PaymentRequest;
import com.rachaai.billing.dto.PlanResponse;
import com.rachaai.billing.gateway.PaymentGateway;
import com.rachaai.common.ApiException;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class BillingService {

    private static final Logger log = LoggerFactory.getLogger(BillingService.class);

    public static final Set<ListingType> ADVERTISER_TYPES = EnumSet.of(ListingType.TEM_VAGA, ListingType.ESTABELECIMENTO);

    private final BillingProperties props;
    private final PaymentRepository paymentRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final PaymentGateway gateway;
    private final String baseUrl;
    /**
     * Nossa referência no gateway: "rachaai-<ambiente>-<id do pagamento>". O ambiente entra porque
     * dev, homolog e prod usam a mesma conta do Mercado Pago e os ids dos pagamentos se repetem.
     */
    private final String referencePrefix;

    public BillingService(
            BillingProperties props,
            PaymentRepository paymentRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            PaymentGateway gateway,
            @Value("${app.base-url}") String baseUrl,
            org.springframework.core.env.Environment environment
    ) {
        // Perfil ativo de verdade (dev, homolog, prod; "test" nos testes automáticos).
        String[] active = environment.getActiveProfiles();
        this.referencePrefix = "rachaai-" + (active.length > 0 ? active[0] : "dev") + "-";
        this.props = props;
        this.paymentRepository = paymentRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.gateway = gateway;
        this.baseUrl = baseUrl;
    }

    @Transactional(readOnly = true)
    public PlanResponse plan(Long userId) {
        return new PlanResponse(
                props.freeListings(),
                listingRepository.countByUserIdAndActiveTrueAndTypeInAndExpiresAtIsNull(userId, ADVERTISER_TYPES),
                availableCredits(userId),
                props.extraListingPrice(),
                props.extraListingDays(),
                props.highlightPrice(),
                props.highlightDays(),
                props.isSimulated(),
                props.mode() == null ? "SIMULADO" : props.mode().toUpperCase()
        );
    }

    @Transactional(readOnly = true)
    public List<Payment> listMine(Long userId) {
        return paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    /**
     * Cria a compra. No modo MERCADOPAGO também cria a cobrança no Mercado Pago e devolve o link do
     * checkout (Pix, crédito ou débito). Se já existe uma compra igual pendente, reaproveita a mesma
     * (clicar duas vezes em "Destacar" não gera duas cobranças).
     */
    @Transactional
    public Payment createPayment(Long userId, PaymentRequest request) {
        User user = requireAdvertiser(userId);
        if (!props.isSimulated() && !props.isMercadoPago()) {
            throw ApiException.forbidden("Compras estão temporariamente indisponíveis");
        }

        Payment payment;
        if (request.type() == PaymentType.DESTAQUE) {
            if (request.listingId() == null) {
                throw ApiException.badRequest("Informe o anúncio que será destacado");
            }
            Listing listing = listingRepository.findByIdAndUserId(request.listingId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
            if (!listing.isActive() || !ADVERTISER_TYPES.contains(listing.getType())) {
                throw ApiException.badRequest("Só é possível destacar um anúncio ativo");
            }
            Optional<Payment> pending = findReusablePending(userId, PaymentType.DESTAQUE, listing.getId());
            if (pending.isPresent()) {
                return pending.get();
            }
            payment = paymentRepository.save(new Payment(user, PaymentType.DESTAQUE, props.highlightPrice(), listing.getId()));
        } else {
            Optional<Payment> pending = findReusablePending(userId, PaymentType.ANUNCIO_EXTRA, null);
            if (pending.isPresent()) {
                return pending.get();
            }
            payment = paymentRepository.save(new Payment(user, PaymentType.ANUNCIO_EXTRA, props.extraListingPrice(), null));
        }

        if (props.isMercadoPago()) {
            PaymentGateway.CheckoutSession session = gateway.createCheckout(
                    reference(payment), title(payment), payment.getAmount(),
                    baseUrl + "/pagamentos/retorno?pagamento=" + payment.getId());
            payment.attachCheckout(gateway.name(), session.checkoutId(), session.checkoutUrl());
        }
        return payment;
    }

    /**
     * "Voltei do Mercado Pago" / "abri a tela de pagamentos": pergunta ao gateway como está a cobrança.
     * Nunca usa o status que veio na URL de retorno, que qualquer um pode forjar.
     */
    @Transactional
    public Payment syncWithGateway(Long userId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> ApiException.notFound("Pagamento não encontrado"));
        if (payment.getStatus() == PaymentStatus.PENDENTE && payment.getGateway() != null) {
            gateway.findPaymentFor(reference(payment)).ifPresent(result -> applyGatewayResult(payment, result));
        }
        return payment;
    }

    /**
     * Aviso automático do gateway (webhook): "o pagamento X mudou". Confere a assinatura, busca o
     * pagamento na API do gateway e aplica. Pode chegar repetido: aplicar duas vezes não faz nada.
     */
    @Transactional
    public void handleWebhook(String gatewayPaymentId, String signature, String requestId) {
        if (!gateway.isValidWebhookSignature(signature, requestId, gatewayPaymentId)) {
            throw ApiException.unauthorized("Assinatura do aviso inválida");
        }
        gateway.getPayment(gatewayPaymentId).ifPresent(result -> {
            Long ourId = parseReference(result.reference());
            if (ourId == null) {
                log.warn("Aviso do gateway sem referência nossa (pagamento {})", gatewayPaymentId);
                return;
            }
            paymentRepository.findById(ourId).ifPresent(payment -> applyGatewayResult(payment, result));
        });
    }

    /** Desistir de uma compra pendente (some da lista de pendentes; não cobra nada). */
    @Transactional
    public Payment cancel(Long userId, Long paymentId) {
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> ApiException.notFound("Pagamento não encontrado"));
        if (payment.getStatus() != PaymentStatus.PENDENTE) {
            throw ApiException.conflict("Só dá para cancelar um pagamento pendente");
        }
        // Se pagou e o aviso ainda não chegou, não cancela: confirma.
        if (payment.getGateway() != null) {
            gateway.findPaymentFor(reference(payment)).ifPresent(result -> applyGatewayResult(payment, result));
            if (payment.getStatus() == PaymentStatus.PAGO) {
                return payment;
            }
        }
        payment.cancel();
        return payment;
    }

    /**
     * Confirma um pagamento sem cobrar ninguém. Só existe no modo SIMULADO; com um gateway real,
     * quem confirma é o próprio gateway (syncWithGateway / handleWebhook).
     */
    @Transactional
    public Payment simulateConfirmation(Long userId, Long paymentId) {
        if (!props.isSimulated()) {
            throw ApiException.forbidden("A confirmação simulada só existe no modo de teste");
        }
        Payment payment = paymentRepository.findByIdAndUserId(paymentId, userId)
                .orElseThrow(() -> ApiException.notFound("Pagamento não encontrado"));
        if (payment.getStatus() != PaymentStatus.PENDENTE) {
            throw ApiException.conflict("Esse pagamento já foi processado");
        }
        payment.setExternalReference("SIMULADO-" + UUID.randomUUID());
        applyPaid(payment);
        return payment;
    }

    /** Prazo de arrependimento do CDC (art. 49) para compra pela internet. */
    public static final Duration WITHDRAWAL_PERIOD = Duration.ofDays(7);

    /**
     * Reembolso feito pelo admin: devolve o dinheiro pelo gateway (mesmo meio: Pix ou cartão) e
     * desfaz o efeito da compra. Compra do modo simulado não tem dinheiro a devolver: só desfaz.
     */
    @Transactional
    public Payment refund(Long adminId, Long paymentId, String reason) {
        Payment payment = paymentRepository.findById(paymentId)
                .orElseThrow(() -> ApiException.notFound("Pagamento não encontrado"));
        if (payment.getStatus() != PaymentStatus.PAGO) {
            throw ApiException.conflict("Só dá para reembolsar um pagamento pago");
        }
        if (payment.getGateway() != null) {
            if (payment.getGatewayPaymentId() == null) {
                throw ApiException.conflict("Pagamento sem o id do Mercado Pago: reembolse pelo painel do Mercado Pago");
            }
            // Se a chamada falhar, a exceção desfaz tudo: nada fica marcado como reembolsado sem o dinheiro voltar.
            gateway.refund(payment.getGatewayPaymentId());
        }
        undoEffects(payment);
        payment.markRefunded(adminId, reason.trim());
        log.info("Admin {} reembolsou o pagamento {} ({}): {}", adminId, paymentId, payment.getAmount(), reason);
        return payment;
    }

    /**
     * Desfaz o que a compra deu. Destaque: tira os dias daquele pagamento. Anúncio extra: o crédito
     * não usado some sozinho (deixa de estar PAGO); se já foi usado, o anúncio feito com ele sai do ar.
     */
    private void undoEffects(Payment payment) {
        if (payment.getListingId() == null) {
            return;
        }
        listingRepository.findById(payment.getListingId()).ifPresent(listing -> {
            if (payment.getType() == PaymentType.DESTAQUE) {
                Instant until = listing.getHighlightedUntil();
                if (until != null) {
                    Instant reduced = until.minus(Duration.ofDays(props.highlightDays()));
                    listing.setHighlightedUntil(reduced.isAfter(Instant.now()) ? reduced : null);
                }
            } else {
                listing.setActive(false);
            }
        });
    }

    /** Aplica o que o gateway disse: aprovado (e no valor certo) vira PAGO; o resto só fica anotado. */
    private void applyGatewayResult(Payment payment, PaymentGateway.GatewayPayment result) {
        payment.recordGatewayAttempt(result.id(), result.status(), result.method());
        // Reembolso feito direto no painel do Mercado Pago, ou estorno pedido no cartão.
        if (result.isRefunded() && payment.getStatus() == PaymentStatus.PAGO) {
            undoEffects(payment);
            payment.markRefunded(null, "charged_back".equals(result.status())
                    ? "Estorno pedido no cartão (chargeback)" : "Reembolso feito direto no Mercado Pago");
            log.warn("Pagamento {} devolvido no gateway ({}): efeito desfeito", payment.getId(), result.status());
            return;
        }
        if (!result.isApproved() || payment.getStatus() != PaymentStatus.PENDENTE) {
            return;
        }
        if (result.amount() == null || result.amount().compareTo(payment.getAmount()) < 0) {
            log.error("Pagamento {} aprovado no gateway com valor {} menor que o cobrado {}: não aplicado",
                    payment.getId(), result.amount(), payment.getAmount());
            return;
        }
        applyPaid(payment);
        log.info("Pagamento {} confirmado pelo gateway ({}, {})", payment.getId(), result.method(), result.id());
    }

    /** Marca o pagamento como pago e aplica o efeito dele: destaque no anúncio ou crédito de anúncio extra. */
    @Transactional
    public void applyPaid(Payment payment) {
        if (payment.getStatus() == PaymentStatus.PAGO) {
            return;
        }
        payment.markPaid();

        if (payment.getType() == PaymentType.DESTAQUE) {
            Listing listing = listingRepository.findById(payment.getListingId())
                    .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
            Instant now = Instant.now();
            Instant base = listing.getHighlightedUntil() != null && listing.getHighlightedUntil().isAfter(now)
                    ? listing.getHighlightedUntil()
                    : now;
            listing.setHighlightedUntil(base.plus(Duration.ofDays(props.highlightDays())));
        }
    }

    /**
     * Gasta um crédito de anúncio extra no anúncio recém-criado: liga o pagamento ao anúncio e define
     * a validade. Sem crédito pago disponível, o anúncio não pode ser publicado.
     */
    @Transactional
    public void consumeExtraCredit(Long userId, Listing listing) {
        List<Payment> credits = paymentRepository.findAllByUserIdAndTypeAndStatusAndListingIdIsNullOrderByPaidAtAsc(
                userId, PaymentType.ANUNCIO_EXTRA, PaymentStatus.PAGO);
        if (credits.isEmpty()) {
            throw ApiException.paymentRequired("Você já usa os " + props.freeListings()
                    + " anúncios grátis. Compre um anúncio extra para publicar outro.");
        }
        credits.get(0).setListingId(listing.getId());
        listing.setExpiresAt(Instant.now().plus(Duration.ofDays(props.extraListingDays())));
    }

    public int freeListings() {
        return props.freeListings();
    }

    private Optional<Payment> findReusablePending(Long userId, PaymentType type, Long listingId) {
        return paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId).stream()
                .filter(p -> p.getStatus() == PaymentStatus.PENDENTE && p.getType() == type)
                .filter(p -> java.util.Objects.equals(p.getListingId(), listingId))
                // só reaproveita cobrança do mesmo modo e com menos de 23 h (o checkout vale 24 h)
                .filter(p -> (p.getGateway() != null) == props.isMercadoPago())
                .filter(p -> p.getCreatedAt().isAfter(Instant.now().minus(Duration.ofHours(23))))
                .filter(p -> p.getAmount().compareTo(type == PaymentType.DESTAQUE ? props.highlightPrice() : props.extraListingPrice()) == 0)
                .findFirst();
    }

    private String title(Payment payment) {
        return payment.getType() == PaymentType.DESTAQUE
                ? "RachaAi - Destaque de anúncio (" + props.highlightDays() + " dias)"
                : "RachaAi - Anúncio extra (" + props.extraListingDays() + " dias)";
    }

    String reference(Payment payment) {
        return referencePrefix + payment.getId();
    }

    /** Id do nosso pagamento a partir da referência; nulo se for de outro ambiente ou de fora. */
    Long parseReference(String reference) {
        if (reference == null || !reference.startsWith(referencePrefix)) {
            return null;
        }
        try {
            return Long.valueOf(reference.substring(referencePrefix.length()));
        } catch (NumberFormatException e) {
            return null;
        }
    }

    private long availableCredits(Long userId) {
        return paymentRepository.countByUserIdAndTypeAndStatusAndListingIdIsNull(
                userId, PaymentType.ANUNCIO_EXTRA, PaymentStatus.PAGO);
    }

    private User requireAdvertiser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        if (!user.isAdvertiser()) {
            throw ApiException.forbidden("Apenas contas de anúncio podem comprar anúncio extra ou destaque");
        }
        return user;
    }
}
