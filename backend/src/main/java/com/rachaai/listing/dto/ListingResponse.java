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
        String address,
        Double latitude,
        Double longitude,
        Boolean acceptsPets,
        Boolean acceptsSmoker,
        boolean highlighted,
        Instant highlightedUntil,
        Instant expiresAt,
        Instant createdAt
) {
    public static ListingResponse from(Listing listing) {
        boolean hasLocation = listing.getType() != ListingType.PROCURANDO;
        boolean isEstablishment = listing.getType() == ListingType.ESTABELECIMENTO;
        return new ListingResponse(
                listing.getId(),
                listing.getUser().getId(),
                listing.getType(),
                listing.getTitle(),
                listing.getDescription(),
                listing.getPreferredNeighborhood(),
                listing.getNearCollege(),
                listing.getPrice(),
                hasLocation ? listing.getAddress() : null,
                hasLocation ? listing.getLatitude() : null,
                hasLocation ? listing.getLongitude() : null,
                isEstablishment ? listing.getAcceptsPets() : null,
                isEstablishment ? listing.getAcceptsSmoker() : null,
                listing.isHighlighted(),
                listing.getHighlightedUntil(),
                listing.getExpiresAt(),
                listing.getCreatedAt()
        );
    }
}
