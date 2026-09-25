package com.rachaai.interest;

import com.rachaai.common.ApiException;
import com.rachaai.interest.dto.InterestStatusResponse;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.moderation.ModerationService;
import com.rachaai.notification.NotificationService;
import com.rachaai.notification.NotificationType;
import com.rachaai.user.User;
import com.rachaai.user.UserPhotoRepository;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;

@Service
public class InterestService {

    private final InterestRepository interestRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserPhotoRepository userPhotoRepository;
    private final NotificationService notificationService;
    private final ModerationService moderationService;

    public InterestService(
            InterestRepository interestRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            UserPhotoRepository userPhotoRepository,
            NotificationService notificationService,
            ModerationService moderationService
    ) {
        this.interestRepository = interestRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.userPhotoRepository = userPhotoRepository;
        this.notificationService = notificationService;
        this.moderationService = moderationService;
    }

    @Transactional
    public InterestStatusResponse markInterest(Long userId, Long listingId) {
        User user = requireUser(userId);
        if (!user.isRenter()) {
            throw ApiException.forbidden("Apenas contas de aluguel podem demonstrar interesse");
        }
        Listing listing = requireEstablishment(listingId);

        if (listing.getUser().getId().equals(userId)) {
            throw ApiException.badRequest("Você não pode demonstrar interesse no seu próprio anúncio");
        }

        if (!interestRepository.existsByListingIdAndUserId(listingId, userId)) {
            // quem tem bloqueio com o recém-chegado (nos dois sentidos) não é avisado nem contado
            Set<Long> blocked = moderationService.relatedBlockedIds(userId);
            List<User> othersInterested = interestRepository.findAllByListingId(listingId).stream()
                    .map(Interest::getUser)
                    .filter(u -> !blocked.contains(u.getId()))
                    .toList();
            interestRepository.save(new Interest(listing, user));
            notifyNewInterest(listing, user, othersInterested);
        }
        return status(userId, listingId);
    }

    /**
     * Dono: fica sabendo de cada interessado novo. Quem já tinha interesse: fica sabendo que chegou
     * mais alguém. Quem acabou de clicar: fica sabendo que não está sozinho (se houver outros).
     */
    private void notifyNewInterest(Listing listing, User newcomer, List<User> othersInterested) {
        String listingLink = "/anuncios/" + listing.getId();
        notificationService.notify(
                listing.getUser(),
                NotificationType.NOVO_INTERESSE,
                "Nova pessoa interessada no seu anúncio",
                newcomer.getName() + " tem interesse em \"" + listing.getTitle() + "\"",
                "/anuncio"
        );
        for (User other : othersInterested) {
            notificationService.notify(
                    other,
                    NotificationType.INTERESSE_EM_COMUM,
                    "Mais alguém se interessou",
                    newcomer.getName() + " também tem interesse em \"" + listing.getTitle() + "\". Que tal conversar?",
                    listingLink
            );
        }
        if (!othersInterested.isEmpty()) {
            int count = othersInterested.size();
            notificationService.notify(
                    newcomer,
                    NotificationType.INTERESSE_EM_COMUM,
                    count == 1 ? "Outra pessoa também se interessou" : count + " pessoas também se interessaram",
                    "Veja quem mais tem interesse em \"" + listing.getTitle() + "\" e converse com elas.",
                    listingLink
            );
        }
    }

    @Transactional
    public InterestStatusResponse unmarkInterest(Long userId, Long listingId) {
        interestRepository.findByListingIdAndUserId(listingId, userId).ifPresent(interestRepository::delete);
        return status(userId, listingId);
    }

    @Transactional(readOnly = true)
    public InterestStatusResponse status(Long userId, Long listingId) {
        List<Interest> all = interestRepository.findAllByListingId(listingId);
        boolean interested = all.stream().anyMatch(i -> i.getUser().getId().equals(userId));
        return new InterestStatusResponse(interested, all.size());
    }

    /**
     * Só quem já demonstrou interesse (ou o dono do anúncio) pode ver quem mais se interessou —
     * evita expor a lista para qualquer um que só esteja navegando.
     */
    @Transactional(readOnly = true)
    public List<UserResponse> listInterested(Long userId, Long listingId) {
        Listing listing = requireEstablishment(listingId);
        boolean isOwner = listing.getUser().getId().equals(userId);
        boolean hasInterest = interestRepository.existsByListingIdAndUserId(listingId, userId);
        if (!isOwner && !hasInterest) {
            throw ApiException.forbidden("Demonstre interesse nesse anúncio para ver quem mais se interessou");
        }

        return interestRepository.findAllByListingId(listingId).stream()
                .map(Interest::getUser)
                .filter(u -> isOwner || !u.getId().equals(userId))
                .map(u -> UserResponse.from(u, userPhotoRepository.existsByUserId(u.getId())))
                .toList();
    }

    private Listing requireEstablishment(Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        if (listing.getType() != ListingType.ESTABELECIMENTO || !listing.isActive()) {
            throw ApiException.badRequest("Esse anúncio não aceita demonstração de interesse");
        }
        return listing;
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
    }
}
