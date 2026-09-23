package com.rachaai.conversation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface ConversationRepository extends JpaRepository<Conversation, Long> {

    Optional<Conversation> findByListingIdAndRenterIdAndSecondUserIsNull(Long listingId, Long renterId);

    @Query("select c from Conversation c join c.renter r left join c.secondUser su "
            + "where c.listing.id = :listingId and su is not null "
            + "and ((r.id = :userIdA and su.id = :userIdB) or (r.id = :userIdB and su.id = :userIdA))")
    Optional<Conversation> findPeerConversation(Long listingId, Long userIdA, Long userIdB);

    @Query("select c from Conversation c join c.renter r left join c.secondUser su join c.listing l join l.user lu "
            + "where r.id = :userId or su.id = :userId or (su is null and lu.id = :userId) "
            + "order by c.createdAt desc")
    List<Conversation> findAllForUser(Long userId);

    @Query("select c from Conversation c join c.listing l "
            + "where l.id = :listingId and l.user.id = :ownerId and c.secondUser is null "
            + "order by c.createdAt desc")
    List<Conversation> findOwnerConversationsForListing(Long listingId, Long ownerId);

    @Query("select c from Conversation c join c.renter r left join c.secondUser su join c.listing l join l.user lu "
            + "where c.id = :id and (r.id = :userId or su.id = :userId or (su is null and lu.id = :userId))")
    Optional<Conversation> findByIdForUser(Long id, Long userId);
}
