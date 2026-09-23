package com.rachaai.listing;

import com.rachaai.billing.BillingService;
import com.rachaai.common.ApiException;
import com.rachaai.conversation.ConversationRepository;
import com.rachaai.listing.dto.ListingRequest;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.user.AdvertiserKind;
import com.rachaai.user.Role;
import com.rachaai.user.User;
import com.rachaai.user.UserService;
import com.rachaai.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListingService {

    private final ListingRepository listingRepository;
    private final UserService userService;
    private final BillingService billingService;
    private final ConversationRepository conversationRepository;

    public ListingService(
            ListingRepository listingRepository,
            UserService userService,
            BillingService billingService,
            ConversationRepository conversationRepository
    ) {
        this.listingRepository = listingRepository;
        this.userService = userService;
        this.billingService = billingService;
        this.conversationRepository = conversationRepository;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> listMine(Long userId) {
        return listingRepository.findAllByUserIdAndActiveTrue(userId).stream().map(ListingResponse::from).toList();
    }

    @Transactional
    public Listing create(Long userId, ListingRequest request) {
        User user = userService.getById(userId);
        validateRoleForType(user, request.type());

        if (request.type() != ListingType.PROCURANDO
                && (request.latitude() == null || request.longitude() == null || isBlank(request.address()))) {
            throw ApiException.badRequest("Informe endereço e localização no mapa");
        }

        boolean needsExtraCredit = false;
        if (request.type() == ListingType.PROCURANDO) {
            listingRepository.deactivateAllForUserAndType(userId, ListingType.PROCURANDO);
        } else {
            long freeInUse = listingRepository.countByUserIdAndActiveTrueAndTypeInAndExpiresAtIsNull(
                    userId, BillingService.ADVERTISER_TYPES);
            needsExtraCredit = freeInUse >= billingService.freeListings();
        }

        Listing listing = new Listing(user, request.type(), request.title());
        listing.setDescription(request.description());
        listing.setPreferredNeighborhood(request.preferredNeighborhood());
        listing.setNearCollege(request.nearCollege());
        listing.setPrice(request.price());

        if (request.type() != ListingType.PROCURANDO) {
            listing.setAddress(request.address());
            listing.setLatitude(request.latitude());
            listing.setLongitude(request.longitude());
        }
        if (request.type() == ListingType.ESTABELECIMENTO) {
            listing.setAcceptsPets(request.acceptsPets());
            listing.setAcceptsSmoker(request.acceptsSmoker());
        }

        Listing saved = listingRepository.save(listing);
        if (needsExtraCredit) {
            billingService.consumeExtraCredit(userId, saved);
        }
        return saved;
    }

    @Transactional
    public void delete(Long userId, Long listingId) {
        Listing listing = listingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        listing.setActive(false);
    }

    @Transactional
    public ListingResponse markUnavailable(Long userId, Long listingId, Long closedWithUserId) {
        Listing listing = listingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        if (listing.getType() == ListingType.PROCURANDO) {
            throw ApiException.badRequest("Esse tipo de anúncio não tem essa opção");
        }

        User closedWith = null;
        if (closedWithUserId != null) {
            boolean chatted = conversationRepository.findOwnerConversationsForListing(listingId, userId).stream()
                    .anyMatch(c -> c.getRenter().getId().equals(closedWithUserId));
            if (!chatted) {
                throw ApiException.badRequest("Selecione alguém com quem você conversou sobre esse anúncio");
            }
            closedWith = userService.getById(closedWithUserId);
        }

        listing.setAvailable(false);
        listing.setDealClosedWith(closedWith);
        return ListingResponse.from(listing);
    }

    @Transactional
    public ListingResponse markAvailable(Long userId, Long listingId) {
        Listing listing = listingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        listing.setAvailable(true);
        listing.setDealClosedWith(null);
        return ListingResponse.from(listing);
    }

    @Transactional(readOnly = true)
    public List<UserResponse> listChatContacts(Long userId, Long listingId) {
        listingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        return conversationRepository.findOwnerConversationsForListing(listingId, userId).stream()
                .map(c -> c.getRenter())
                .distinct()
                .map(u -> UserResponse.from(u, userService.hasPhoto(u.getId())))
                .toList();
    }

    private void validateRoleForType(User user, ListingType type) {
        if (type == ListingType.PROCURANDO && user.getRole() != Role.RENTER) {
            throw ApiException.forbidden("Apenas contas de aluguel podem publicar um anúncio de busca");
        }
        if (BillingService.ADVERTISER_TYPES.contains(type) && user.getRole() != Role.ADVERTISER) {
            throw ApiException.forbidden("Apenas contas de anúncio podem publicar esse tipo de anúncio");
        }
        if (user.getAdvertiserKind() == AdvertiserKind.VAGA && type == ListingType.ESTABELECIMENTO) {
            throw ApiException.forbidden("Sua conta é para anunciar vaga compartilhada, não estabelecimentos");
        }
        if (user.getAdvertiserKind() == AdvertiserKind.ESTABELECIMENTO && type == ListingType.TEM_VAGA) {
            throw ApiException.forbidden("Sua conta é para anunciar estabelecimentos, não vaga compartilhada");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
