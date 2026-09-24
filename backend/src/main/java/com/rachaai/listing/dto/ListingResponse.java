package com.rachaai.listing.dto;

import com.rachaai.listing.Listing;
import com.rachaai.listing.ListingType;

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
        String address,
        Double latitude,
        Double longitude,
        Boolean acceptsPets,
        Boolean acceptsSmoker,
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
                listing.getAddress(),
                listing.getLatitude(),
                listing.getLongitude(),
                isEstablishment ? listing.getAcceptsPets() : null,
                isEstablishment ? listing.getAcceptsSmoker() : null,
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
