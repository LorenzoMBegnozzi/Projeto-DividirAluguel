package com.rachaai.listing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ListingPhotoRepository extends JpaRepository<ListingPhoto, Long> {
    List<ListingPhoto> findByListingIdOrderBySortOrderAscIdAsc(Long listingId);

    Optional<ListingPhoto> findFirstByListingIdOrderBySortOrderAscIdAsc(Long listingId);

    Optional<ListingPhoto> findByIdAndListingId(Long id, Long listingId);

    long countByListingId(Long listingId);
}
