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

    /** Busca da área administrativa: por título ou nome do dono (vazio = todos), ativos primeiro. */
    @Query("select l from Listing l join l.user u where :term = '' or lower(l.title) like concat('%', :term, '%') "
            + "or lower(u.name) like concat('%', :term, '%') order by l.active desc, l.createdAt desc")
    List<Listing> searchForAdmin(String term, org.springframework.data.domain.Limit limit);

    long countByActiveTrue();

    long countByUserIdAndActiveTrue(Long userId);

    Optional<Listing> findByIdAndUserId(Long id, Long userId);

    /** Anúncios de contas bloqueadas pela moderação não aparecem na busca. */
    @Query("select l from Listing l where l.active = true and l.available = true and l.type = :type "
            + "and l.user.id <> :userId and l.user.blockedAt is null")
    List<Listing> findAllActiveByTypeExceptUser(ListingType type, Long userId);

    /** Anuncios gratis em uso: os pagos (extras) tem validade, os gratis nao. */
    long countByUserIdAndActiveTrueAndTypeInAndExpiresAtIsNull(Long userId, Collection<ListingType> types);

    @Modifying
    @Query("update Listing l set l.active = false where l.active = true and l.expiresAt is not null and l.expiresAt < :now")
    int deactivateExpired(Instant now);
}
