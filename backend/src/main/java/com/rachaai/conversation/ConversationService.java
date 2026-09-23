package com.rachaai.conversation;

import com.rachaai.common.ApiException;
import com.rachaai.conversation.dto.ConversationResponse;
import com.rachaai.interest.InterestRepository;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.moderation.ModerationService;
import com.rachaai.notification.NotificationService;
import com.rachaai.notification.NotificationType;
import com.rachaai.user.Role;
import com.rachaai.user.User;
import com.rachaai.user.UserPhotoRepository;
import com.rachaai.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ConversationService {

    private final ConversationRepository conversationRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final ModerationService moderationService;
    private final InterestRepository interestRepository;
    private final UserPhotoRepository userPhotoRepository;

    public ConversationService(
            ConversationRepository conversationRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            ModerationService moderationService,
            InterestRepository interestRepository,
            UserPhotoRepository userPhotoRepository
    ) {
        this.conversationRepository = conversationRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.moderationService = moderationService;
        this.interestRepository = interestRepository;
        this.userPhotoRepository = userPhotoRepository;
    }

    private ConversationResponse toResponse(Conversation conversation, Long userId) {
        boolean hasPhoto = userPhotoRepository.existsByUserId(conversation.other(userId).getId());
        return ConversationResponse.from(conversation, userId, hasPhoto);
    }

    @Transactional
    public ConversationResponse startConversation(Long renterId, Long listingId) {
        User renter = userRepository.findById(renterId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        if (renter.getRole() != Role.RENTER) {
            throw ApiException.forbidden("Apenas contas de aluguel podem iniciar uma conversa");
        }

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        if (!listing.isActive() || listing.getType() == ListingType.PROCURANDO) {
            throw ApiException.badRequest("Esse anúncio não aceita conversas");
        }
        if (listing.getUser().getId().equals(renterId)) {
            throw ApiException.badRequest("Você não pode iniciar uma conversa com o seu próprio anúncio");
        }
        if (moderationService.isBlockedEitherWay(renterId, listing.getUser().getId())) {
            throw ApiException.forbidden("Não é possível iniciar essa conversa");
        }

        var existing = conversationRepository.findByListingIdAndRenterIdAndSecondUserIsNull(listingId, renterId);
        Conversation conversation = existing.orElseGet(() -> conversationRepository.save(new Conversation(listing, renter)));

        if (existing.isEmpty()) {
            notificationService.notify(
                    listing.getUser(),
                    NotificationType.NOVA_CONVERSA,
                    "Novo interesse no seu anúncio",
                    renter.getName() + " quer conversar sobre \"" + listing.getTitle() + "\"",
                    "/conversas/" + conversation.getId()
            );
        }

        return toResponse(conversation, renterId);
    }

    /**
     * Conversa entre duas pessoas que demonstraram interesse no mesmo estabelecimento
     * (não com o dono) — para combinarem de dividir o aluguel juntas.
     */
    @Transactional
    public ConversationResponse startPeerConversation(Long userId, Long listingId, Long otherUserId) {
        if (userId.equals(otherUserId)) {
            throw ApiException.badRequest("Você não pode iniciar uma conversa com você mesmo");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        User other = userRepository.findById(otherUserId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));

        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        if (listing.getType() != ListingType.ESTABELECIMENTO || !listing.isActive()) {
            throw ApiException.badRequest("Esse anúncio não aceita esse tipo de conversa");
        }
        if (!interestRepository.existsByListingIdAndUserId(listingId, userId)
                || !interestRepository.existsByListingIdAndUserId(listingId, otherUserId)) {
            throw ApiException.forbidden("As duas pessoas precisam ter demonstrado interesse nesse anúncio");
        }
        if (moderationService.isBlockedEitherWay(userId, otherUserId)) {
            throw ApiException.forbidden("Não é possível iniciar essa conversa");
        }

        var existing = conversationRepository.findPeerConversation(listingId, userId, otherUserId);
        Conversation conversation = existing.orElseGet(() -> conversationRepository.save(new Conversation(listing, user, other)));

        if (existing.isEmpty()) {
            notificationService.notify(
                    other,
                    NotificationType.NOVA_CONVERSA,
                    "Alguém também se interessou por \"" + listing.getTitle() + "\"",
                    user.getName() + " também quer o mesmo lugar e quer falar com você",
                    "/conversas/" + conversation.getId()
            );
        }

        return toResponse(conversation, userId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listForUser(Long userId) {
        return conversationRepository.findAllForUser(userId).stream()
                .map(conversation -> toResponse(conversation, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public Conversation getForUser(Long conversationId, Long userId) {
        return conversationRepository.findByIdForUser(conversationId, userId)
                .orElseThrow(() -> ApiException.notFound("Conversa não encontrada"));
    }

    @Transactional(readOnly = true)
    public ConversationResponse getResponseForUser(Long conversationId, Long userId) {
        return toResponse(getForUser(conversationId, userId), userId);
    }
}
