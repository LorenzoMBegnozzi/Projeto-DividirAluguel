package com.rachaai.interest;

import com.rachaai.common.ApiException;
import com.rachaai.interest.dto.InterestStatusResponse;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.user.Role;
import com.rachaai.user.User;
import com.rachaai.user.UserPhotoRepository;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InterestService {

    private final InterestRepository interestRepository;
    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserPhotoRepository userPhotoRepository;

    public InterestService(
            InterestRepository interestRepository,
            ListingRepository listingRepository,
            UserRepository userRepository,
            UserPhotoRepository userPhotoRepository
    ) {
        this.interestRepository = interestRepository;
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.userPhotoRepository = userPhotoRepository;
    }

    @Transactional
    public InterestStatusResponse markInterest(Long userId, Long listingId) {
        User user = requireUser(userId);
        if (user.getRole() != Role.RENTER) {
            throw ApiException.forbidden("Apenas contas de aluguel podem demonstrar interesse");
        }
        Listing listing = requireEstablishment(listingId);

        if (!interestRepository.existsByListingIdAndUserId(listingId, userId)) {
            interestRepository.save(new Interest(listing, user));
        }
        return status(userId, listingId);
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
