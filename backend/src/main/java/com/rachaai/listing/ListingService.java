package com.rachaai.listing;

import com.rachaai.billing.BillingService;
import com.rachaai.common.ApiException;
import com.rachaai.common.PhotoValidator;
import com.rachaai.conversation.ConversationRepository;
import com.rachaai.listing.dto.ListingRequest;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.user.Gender;
import com.rachaai.user.User;
import com.rachaai.user.UserProfile;
import com.rachaai.user.UserProfileRepository;
import com.rachaai.user.UserService;
import com.rachaai.user.dto.UserResponse;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ListingService {

    private static final int MAX_PHOTOS_PER_LISTING = 6;

    private final ListingRepository listingRepository;
    private final ListingPhotoRepository listingPhotoRepository;
    private final UserService userService;
    private final BillingService billingService;
    private final ConversationRepository conversationRepository;
    private final UserProfileRepository userProfileRepository;

    public ListingService(
            ListingRepository listingRepository,
            ListingPhotoRepository listingPhotoRepository,
            UserService userService,
            BillingService billingService,
            ConversationRepository conversationRepository,
            UserProfileRepository userProfileRepository
    ) {
        this.listingRepository = listingRepository;
        this.listingPhotoRepository = listingPhotoRepository;
        this.userService = userService;
        this.billingService = billingService;
        this.conversationRepository = conversationRepository;
        this.userProfileRepository = userProfileRepository;
    }

    @Transactional(readOnly = true)
    public List<ListingResponse> listMine(Long userId) {
        return listingRepository.findAllByUserIdAndActiveTrue(userId).stream().map(ListingResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public ListingResponse getById(Long viewerId, Long listingId) {
        Listing listing = listingRepository.findById(listingId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        // Vaga só para um sexo: quem não se encaixa não vê nem pelo link direto (mesma regra da busca).
        boolean isOwner = listing.getUser().getId().equals(viewerId);
        if (!isOwner && listing.getType() == ListingType.TEM_VAGA) {
            Gender viewerGender = userProfileRepository.findByUserId(viewerId).map(UserProfile::getGender).orElse(null);
            if (!listing.getGenderPreference().accepts(viewerGender)) {
                throw ApiException.notFound("Anúncio não encontrado");
            }
        }
        return ListingResponse.from(listing);
    }

    @Transactional
    public Listing create(Long userId, ListingRequest request) {
        User user = userService.getById(userId);
        validateRoleForType(user, request.type());

        if (request.latitude() == null || request.longitude() == null || isBlank(request.address())) {
            throw ApiException.badRequest("Informe endereço e localização no mapa");
        }
        if (request.suites() != null && request.bedrooms() != null && request.suites() > request.bedrooms()) {
            throw ApiException.badRequest("O número de suítes não pode ser maior que o de dormitórios");
        }

        long freeInUse = listingRepository.countByUserIdAndActiveTrueAndTypeInAndExpiresAtIsNull(
                userId, BillingService.ADVERTISER_TYPES);
        boolean needsExtraCredit = freeInUse >= billingService.freeListings();

        Listing listing = new Listing(user, request.type(), request.title());
        listing.setDescription(request.description());
        listing.setPreferredNeighborhood(request.preferredNeighborhood());
        listing.setNearCollege(request.nearCollege());
        listing.setPrice(request.price());
        listing.setAddress(request.address());
        listing.setLatitude(request.latitude());
        listing.setLongitude(request.longitude());
        listing.setBedrooms(request.bedrooms());
        listing.setSuites(request.suites());
        listing.setBathrooms(request.bathrooms());
        listing.setParkingSpots(request.parkingSpots());
        boolean hasParking = request.parkingSpots() != null && request.parkingSpots() > 0;
        listing.setParkingForCar(hasParking ? request.parkingForCar() : null);
        listing.setParkingForMotorcycle(hasParking ? request.parkingForMotorcycle() : null);
        listing.setParkingLayout(hasParking ? request.parkingLayout() : null);
        listing.setParkingCovered(hasParking ? request.parkingCovered() : null);
        listing.setHasPool(request.hasPool());
        listing.setHasPartyRoom(request.hasPartyRoom());
        listing.setHasGym(request.hasGym());
        listing.setHasPlayground(request.hasPlayground());
        listing.setHasConcierge24h(request.hasConcierge24h());
        if (request.type() == ListingType.TEM_VAGA) {
            listing.setAvailableSlots(request.availableSlots());
            if (request.genderPreference() != null) {
                listing.setGenderPreference(request.genderPreference());
            }
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

    @Transactional
    public void addPhoto(Long userId, Long listingId, byte[] content, String contentType, long size) {
        listingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        PhotoValidator.validate(content, contentType, size);

        long count = listingPhotoRepository.countByListingId(listingId);
        if (count >= MAX_PHOTOS_PER_LISTING) {
            throw ApiException.badRequest("Cada anúncio pode ter até " + MAX_PHOTOS_PER_LISTING + " fotos");
        }

        listingPhotoRepository.save(new ListingPhoto(listingId, content, contentType, (int) count));
    }

    @Transactional
    public void removePhoto(Long userId, Long listingId, Long photoId) {
        listingRepository.findByIdAndUserId(listingId, userId)
                .orElseThrow(() -> ApiException.notFound("Anúncio não encontrado"));
        ListingPhoto photo = listingPhotoRepository.findByIdAndListingId(photoId, listingId)
                .orElseThrow(() -> ApiException.notFound("Foto não encontrada"));
        listingPhotoRepository.delete(photo);
    }

    @Transactional(readOnly = true)
    public List<String> listPhotoUrls(Long listingId) {
        return listingPhotoRepository.findByListingIdOrderBySortOrderAscIdAsc(listingId).stream()
                .map(photo -> "/api/listings/" + listingId + "/fotos/" + photo.getId())
                .toList();
    }

    @Transactional(readOnly = true)
    public ListingPhoto getPhoto(Long listingId, Long photoId) {
        return listingPhotoRepository.findByIdAndListingId(photoId, listingId)
                .orElseThrow(() -> ApiException.notFound("Foto não encontrada"));
    }

    private void validateRoleForType(User user, ListingType type) {
        if (BillingService.ADVERTISER_TYPES.contains(type) && !user.isAdvertiser()) {
            throw ApiException.forbidden("Apenas contas de anúncio podem publicar esse tipo de anúncio");
        }
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
