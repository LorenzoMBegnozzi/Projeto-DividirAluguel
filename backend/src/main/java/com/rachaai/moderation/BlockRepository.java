package com.rachaai.moderation;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface BlockRepository extends JpaRepository<Block, Long> {

    List<Block> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Block> findByUserIdAndBlockedId(Long userId, Long blockedId);

    @Query("select count(b) > 0 from Block b where "
            + "(b.user.id = :a and b.blocked.id = :b) or (b.user.id = :b and b.blocked.id = :a)")
    boolean existsBetween(@Param("a") Long a, @Param("b") Long b);

    /** Ids de todo mundo que tem bloqueio com o usuário, em qualquer direção — usado para filtrar a busca. */
    @Query("select case when b.user.id = :userId then b.blocked.id else b.user.id end "
            + "from Block b where b.user.id = :userId or b.blocked.id = :userId")
    List<Long> findRelatedUserIds(@Param("userId") Long userId);
}
