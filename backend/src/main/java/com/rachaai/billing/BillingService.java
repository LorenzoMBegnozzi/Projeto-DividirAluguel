package com.rachaai.billing;

import com.rachaai.billing.dto.PaymentRequest;
import com.rachaai.billing.dto.PlanResponse;
import com.rachaai.common.ApiException;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class BillingService {

    public static final Set<ListingType> ADVERTISER_TYPES = EnumSet.of(ListingType.TEM_VAGA, ListingType.ESTABELECIMENTO);

    private final BillingProperties props;
    private final PaymentRepository paymentRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;

    public BillingService(
            BillingProperties props,
            PaymentRepository paymentRepository,
            ListingRepository listingRepository,
            UserRepository userRepository
    ) {
        this.props = props;
        this.paymentRepository = paymentRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
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
                props.isSimulated()
        );
    }

    @Transactional(readOnly = true)
    public List<Payment> listMine(Long userId) {
        return paymentRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public Payment createPayment(Long userId, PaymentRequest request) {
        User user = requireAdvertiser(userId);

        if (request.type() == PaymentType.DESTAQUE) {
            if (request.listingId() == null) {
                throw ApiException.badRequest("Informe o anúncio que será destacado");
            }
            Listing listing = listingRepository.findByIdAndUserId(request.listingId(), userId)
                    .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
            if (!listing.isActive() || !ADVERTISER_TYPES.contains(listing.getType())) {
                throw ApiException.badRequest("Só é possível destacar um anúncio ativo");
            }
            return paymentRepository.save(new Payment(user, PaymentType.DESTAQUE, props.highlightPrice(), listing.getId()));
        }

        return paymentRepository.save(new Payment(user, PaymentType.ANUNCIO_EXTRA, props.extraListingPrice(), null));
    }

    /**
     * Confirma um pagamento sem cobrar ninguém. Só existe no modo SIMULADO; com um gateway real,
     * quem chama applyPaid é o webhook de confirmação do gateway (ver docs/06-COBRANCA.md).
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

    /** Marca o pagamento como pago e aplica o efeito dele: destaque no anúncio ou crédito de anúncio extra. */
    @Transactional
    public void applyPaid(Payment payment) {
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
