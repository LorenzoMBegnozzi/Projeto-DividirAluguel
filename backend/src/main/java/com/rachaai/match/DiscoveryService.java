package com.rachaai.match;

import com.rachaai.common.ApiException;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingRepository;
import com.rachaai.listing.ListingType;
import com.rachaai.match.dto.BrowseItemResponse;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.moderation.ModerationService;
import com.rachaai.user.Gender;
import com.rachaai.user.User;
import com.rachaai.user.UserPhotoRepository;
import com.rachaai.user.UserProfile;
import com.rachaai.user.UserProfileRepository;
import com.rachaai.user.UserRepository;
import com.rachaai.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Stream;

@Service
public class DiscoveryService {

    /** Anuncios em destaque (pagos) vem primeiro, independente do score; em cada grupo, maior compatibilidade primeiro. */
    private static final Comparator<BrowseItemResponse> HIGHLIGHT_FIRST_THEN_COMPATIBILITY =
            Comparator.comparing((BrowseItemResponse item) -> !item.listing().highlighted())
                    .thenComparing(Comparator.comparingInt(BrowseItemResponse::compatibilityScore).reversed());

    /** Raio usado quando a busca é por um ponto no mapa (sugestão do autocomplete ou marcado à mão). */
    private static final double NEARBY_RADIUS_KM = 3.0;
    private static final double EARTH_RADIUS_KM = 6371.0;

    private final ListingRepository listingRepository;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final CompatibilityCalculator compatibilityCalculator;
    private final ModerationService moderationService;
    private final UserPhotoRepository userPhotoRepository;

    public DiscoveryService(
            ListingRepository listingRepository,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            CompatibilityCalculator compatibilityCalculator,
            ModerationService moderationService,
            UserPhotoRepository userPhotoRepository
    ) {
        this.listingRepository = listingRepository;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.compatibilityCalculator = compatibilityCalculator;
        this.moderationService = moderationService;
        this.userPhotoRepository = userPhotoRepository;
    }

    @Transactional(readOnly = true)
    public List<BrowseItemResponse> browseRoommates(Long userId, String bairro, Double lat, Double lng, BigDecimal precoMax) {
        requireRenter(userId);
        UserProfile myProfile = userProfileRepository.findByUserId(userId).orElse(null);
        Set<Long> blocked = moderationService.relatedBlockedIds(userId);

        Gender myGender = myProfile != null ? myProfile.getGender() : null;

        return filterByLocationAndPrice(listingRepository.findAllActiveByTypeExceptUser(ListingType.TEM_VAGA, userId), bairro, lat, lng, precoMax)
                .filter(listing -> listing.getGenderPreference().accepts(myGender))
                .filter(listing -> !blocked.contains(listing.getUser().getId()))
                .map(listing -> {
                    User candidateUser = listing.getUser();
                    UserProfile candidateProfile = userProfileRepository.findByUserId(candidateUser.getId()).orElse(null);
                    int score = compatibilityCalculator.calculateRoommate(myProfile, candidateProfile);
                    boolean hasPhoto = userPhotoRepository.existsByUserId(candidateUser.getId());
                    return new BrowseItemResponse(UserResponse.from(candidateUser, hasPhoto), ListingResponse.from(listing), score);
                })
                .sorted(HIGHLIGHT_FIRST_THEN_COMPATIBILITY)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<BrowseItemResponse> browseEstablishments(Long userId, String bairro, Double lat, Double lng, BigDecimal precoMax) {
        requireRenter(userId);
        UserProfile myProfile = userProfileRepository.findByUserId(userId).orElse(null);
        Set<Long> blocked = moderationService.relatedBlockedIds(userId);

        return filterByLocationAndPrice(listingRepository.findAllActiveByTypeExceptUser(ListingType.ESTABELECIMENTO, userId), bairro, lat, lng, precoMax)
                .filter(listing -> !blocked.contains(listing.getUser().getId()))
                .map(listing -> {
                    User ownerUser = listing.getUser();
                    int score = compatibilityCalculator.calculateEstablishment(myProfile, listing);
                    boolean hasPhoto = userPhotoRepository.existsByUserId(ownerUser.getId());
                    return new BrowseItemResponse(UserResponse.from(ownerUser, hasPhoto), ListingResponse.from(listing), score);
                })
                .sorted(HIGHLIGHT_FIRST_THEN_COMPATIBILITY)
                .toList();
    }

    /** Local e orçamento são filtro (aparece ou não), não entram na % de compatibilidade. */
    private Stream<Listing> filterByLocationAndPrice(List<Listing> listings, String bairro, Double lat, Double lng, BigDecimal precoMax) {
        String needle = bairro == null || bairro.isBlank() ? null : normalizeLocation(bairro);
        return listings.stream()
                .filter(listing -> matchesLocation(listing, needle, lat, lng))
                .filter(listing -> precoMax == null || listing.getPrice() == null || listing.getPrice().compareTo(precoMax) <= 0);
    }

    /**
     * Quando temos coordenadas (sugestão do mapa ou ponto marcado à mão), o local é "por perto"
     * dentro de um raio, em vez de precisar bater com o texto do bairro. Sem coordenadas, cai no
     * texto livre digitado (bairro ou faculdade).
     */
    private boolean matchesLocation(Listing listing, String needle, Double lat, Double lng) {
        if (lat != null && lng != null) {
            if (listing.getLatitude() == null || listing.getLongitude() == null) {
                return false;
            }
            return distanceKm(lat, lng, listing.getLatitude(), listing.getLongitude()) <= NEARBY_RADIUS_KM;
        }
        if (needle == null) {
            return true;
        }
        String neighborhood = normalizeLocation(listing.getPreferredNeighborhood());
        String college = normalizeLocation(listing.getNearCollege());
        return (neighborhood != null && neighborhood.contains(needle))
                || (college != null && college.contains(needle));
    }

    private static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return EARTH_RADIUS_KM * c;
    }

    /**
     * Bairros vindos de sugestão de mapa (ex.: "Zona 07") às vezes usam zero à esquerda que
     * não aparece no texto livre digitado pelo anunciante (ex.: "Zona 7") — removemos o zero
     * à esquerda dos dois lados antes de comparar.
     */
    private String normalizeLocation(String value) {
        if (value == null) return null;
        return value.trim().toLowerCase().replaceAll("(?<![0-9])0+(?=[0-9])", "");
    }

    private void requireRenter(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
        if (!user.isRenter()) {
            throw ApiException.forbidden("Apenas contas de aluguel podem navegar pelos anúncios");
        }
    }
}
