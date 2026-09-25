package com.rachaai.listing.dto;

import com.rachaai.listing.GenderPreference;
import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingType;
import com.rachaai.listing.ParkingLayout;

import java.math.BigDecimal;
import java.time.Instant;

public record ListingResponse(
        Long id,
        Long userId,
        ListingType type,
        String title,
        String description,
        String preferredNeighborhood,
        String nearCollege,
        BigDecimal price,
        Integer availableSlots,
        GenderPreference genderPreference,
        String address,
        Double latitude,
        Double longitude,
        Boolean acceptsPets,
        Boolean acceptsSmoker,
        Integer bedrooms,
        Integer suites,
        Integer bathrooms,
        Integer parkingSpots,
        Boolean parkingForCar,
        Boolean parkingForMotorcycle,
        ParkingLayout parkingLayout,
        Boolean parkingCovered,
        Boolean hasPool,
        Boolean hasPartyRoom,
        Boolean hasGym,
        Boolean hasPlayground,
        Boolean hasConcierge24h,
        boolean highlighted,
        Instant highlightedUntil,
        Instant expiresAt,
        Instant createdAt,
        boolean available,
        Long dealClosedWithUserId,
        String dealClosedWithUserName
) {
    public static ListingResponse from(Listing listing) {
        boolean isEstablishment = listing.getType() == ListingType.ESTABELECIMENTO;
        var dealClosedWith = listing.getDealClosedWith();
        return new ListingResponse(
                listing.getId(),
                listing.getUser().getId(),
                listing.getType(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPreferredNeighborhood(),
                listing.getNearCollege(),
                listing.getPrice(),
                listing.getAvailableSlots(),
                listing.getGenderPreference(),
                listing.getAddress(),
                listing.getLatitude(),
                listing.getLongitude(),
                isEstablishment ? listing.getAcceptsPets() : null,
                isEstablishment ? listing.getAcceptsSmoker() : null,
                listing.getBedrooms(),
                listing.getSuites(),
                listing.getBathrooms(),
                listing.getParkingSpots(),
                listing.getParkingForCar(),
                listing.getParkingForMotorcycle(),
                listing.getParkingLayout(),
                listing.getParkingCovered(),
                listing.getHasPool(),
                listing.getHasPartyRoom(),
                listing.getHasGym(),
                listing.getHasPlayground(),
                listing.getHasConcierge24h(),
                listing.isHighlighted(),
                listing.getHighlightedUntil(),
                listing.getExpiresAt(),
                listing.getCreatedAt(),
                listing.isAvailable(),
                dealClosedWith != null ? dealClosedWith.getId() : null,
                dealClosedWith != null ? dealClosedWith.getName() : null
        );
    }
}
