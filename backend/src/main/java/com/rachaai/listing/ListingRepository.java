package com.rachaai.listing;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ListingRepository extends JpaRepository<Listing, Long> {

    List<Listing> findAllByUserIdAndActiveTrue(Long userId);

    Optional<Listing> findByIdAndUserId(Long id, Long userId);

    @Query("select l from Listing l where l.active = true and l.type = :type and l.user.id <> :userId")
    List<Listing> findAllActiveByTypeExceptUser(ListingType type, Long userId);

    /** Anuncios gratis em uso: os pagos (extras) tem validade, os gratis nao. */
    long countByUserIdAndActiveTrueAndTypeInAndExpiresAtIsNull(Long userId, Collection<ListingType> types);

    @Modifying
    @Query("update Listing l set l.active = false where l.active = true and l.expiresAt is not null and l.expiresAt < :now")
    int deactivateExpired(Instant now);

    @Modifying
    @Query("update Listing l set l.active = false where l.user.id = :userId and l.active = true and l.type = :type")
    void deactivateAllForUserAndType(Long userId, ListingType type);
}
