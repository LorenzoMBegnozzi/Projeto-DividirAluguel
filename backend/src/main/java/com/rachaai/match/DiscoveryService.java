package com.rachaai.match;

import com.rachaai.common.ApiException;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.match.dto.BrowseItemResponse;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.moderation.ModerationService;
import com.rachaai.user.Role;
import com.rachaai.user.User;
import com.rachaai.user.UserProfile;
import com.rachaai.user.UserProfileRepository;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

@Service
public class DiscoveryService {

    /** Anuncios em destaque (pagos) vem primeiro, independente do score; em cada grupo, maior compatibilidade primeiro. */
    private static final Comparator<BrowseItemResponse> HIGHLIGHT_FIRST_THEN_COMPATIBILITY =
            Comparator.comparing((BrowseItemResponse item) -> !item.listing().highlighted())
                    .thenComparing(Comparator.comparingInt(BrowseItemResponse::compatibilityScore).reversed());

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompatibilityCalculator compatibilityCalculator;
    private final ModerationService moderationService;

    public DiscoveryService(
            ListingRepository listingRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            CompatibilityCalculator compatibilityCalculator,
            ModerationService moderationService
    ) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.compatibilityCalculator = compatibilityCalculator;
        this.moderationService = moderationService;
    }

    @Transactional(readOnly = true)
    public List<BrowseItemResponse> browseRoommates(Long userId) {
        requireRenter(userId);
        UserProfile myProfile = userProfileRepository.findByUserId(userId).orElse(null);
        Listing myListing = listingRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .filter(l -> l.getType() == ListingType.PROCURANDO)
                .findFirst()
                .orElse(null);
        Set<Long> blocked = moderationService.relatedBlockedIds(userId);

        return listingRepository.findAllActiveByTypeExceptUser(ListingType.TEM_VAGA, userId).stream()
                .filter(listing -> !blocked.contains(listing.getUser().getId()))
                .map(listing -> {
                    User candidateUser = listing.getUser();
                    UserProfile candidateProfile = userProfileRepository.findByUserId(candidateUser.getId()).orElse(null);
                    int score = compatibilityCalculator.calculateRoommate(myProfile, myListing, candidateProfile, listing);
                    return new BrowseItemResponse(UserResponse.from(candidateUser), ListingResponse.from(listing), score);
                })
                .sorted(HIGHLIGHT_FIRST_THEN_COMPATIBILITY)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BrowseItemResponse> browseEstablishments(Long userId) {
        requireRenter(userId);
        UserProfile myProfile = userProfileRepository.findByUserId(userId).orElse(null);
        Listing myListing = listingRepository.findAllByUserIdAndActiveTrue(userId).stream()
                .filter(l -> l.getType() == ListingType.PROCURANDO)
                .findFirst()
                .orElse(null);
        Set<Long> blocked = moderationService.relatedBlockedIds(userId);

        return listingRepository.findAllActiveByTypeExceptUser(ListingType.ESTABELECIMENTO, userId).stream()
                .filter(listing -> !blocked.contains(listing.getUser().getId()))
                .map(listing -> {
                    User ownerUser = listing.getUser();
                    int score = compatibilityCalculator.calculateEstablishment(myProfile, myListing, listing);
                    return new BrowseItemResponse(UserResponse.from(ownerUser), ListingResponse.from(listing), score);
                })
                .sorted(HIGHLIGHT_FIRST_THEN_COMPATIBILITY)
                .toList();
    }

    private void requireRenter(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        if (user.getRole() != Role.RENTER) {
            throw ApiException.forbidden("Apenas contas de aluguel podem navegar pelos anúncios");
        }
    }
}
