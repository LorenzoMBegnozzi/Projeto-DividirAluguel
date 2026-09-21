package com.rachaai.conversation;

import com.rachaai.common.ApiException;
import com.rachaai.conversation.dto.ConversationResponse;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.moderation.ModerationService;
import com.rachaai.notification.NotificationService;
import com.rachaai.notification.NotificationType;
import com.rachaai.user.Role;
import com.rachaai.user.User;
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

    public ConversationService(
            ConversationRepository conversationRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            ModerationService moderationService
    ) {
        this.conversationRepository = conversationRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.moderationService = moderationService;
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

        var existing = conversationRepository.findByListingIdAndRenterId(listingId, renterId);
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

        return ConversationResponse.from(conversation, renterId);
    }

    @Transactional(readOnly = true)
    public List<ConversationResponse> listForUser(Long userId) {
        return conversationRepository.findAllForUser(userId).stream()
                .map(conversation -> ConversationResponse.from(conversation, userId))
                .toList();
    }

    @Transactional(readOnly = true)
    public Conversation getForUser(Long conversationId, Long userId) {
        return conversationRepository.findByIdForUser(conversationId, userId)
                .orElseThrow(() -> ApiException.notFound("Conversa não encontrada"));
    }
}
