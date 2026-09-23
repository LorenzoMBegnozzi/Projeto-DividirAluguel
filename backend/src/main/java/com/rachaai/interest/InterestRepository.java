package com.rachaai.interest;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InterestRepository extends JpaRepository<Interest, Long> {

    Optional<Interest> findByListingIdAndUserId(Long listingId, Long userId);

    boolean existsByListingIdAndUserId(Long listingId, Long userId);

    @Query("select i from Interest i where i.listing.id = :listingId order by i.createdAt asc")
    List<Interest> findAllByListingId(Long listingId);
}
