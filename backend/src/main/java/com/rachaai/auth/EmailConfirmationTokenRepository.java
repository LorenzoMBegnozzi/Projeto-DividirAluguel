package com.rachaai.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.Optional;

public interface EmailConfirmationTokenRepository extends JpaRepository<EmailConfirmationToken, Long> {

    Optional<EmailConfirmationToken> findByTokenHash(String tokenHash);

    /** Ao reenviar, os links antigos deixam de valer (só o último e-mail funciona). */
    @Modifying
    @Query("update EmailConfirmationToken t set t.used = true where t.user.id = :userId and t.used = false")
    int invalidateAllForUser(Long userId);
}
