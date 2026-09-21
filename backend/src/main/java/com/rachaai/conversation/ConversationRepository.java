package com.rachaai.conversation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByListingIdAndRenterId(Long listingId, Long renterId);

    @Query("select c from Conversation c where c.renter.id = :userId or c.listing.user.id = :userId order by c.createdAt desc")
    List<Conversation> findAllForUser(Long userId);

    @Query("select c from Conversation c where c.id = :id and (c.renter.id = :userId or c.listing.user.id = :userId)")
    Optional<Conversation> findByIdForUser(Long id, Long userId);
}
