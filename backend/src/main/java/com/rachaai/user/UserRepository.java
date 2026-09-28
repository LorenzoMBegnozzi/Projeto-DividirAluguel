package com.rachaai.user;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByCpf(String cpf);

    /** Busca da área administrativa: por nome ou e-mail (vazio = todos), mais recentes primeiro. */
    @Query("select u from User u where :term = '' or lower(u.name) like concat('%', :term, '%') "
            + "or lower(u.email) like concat('%', :term, '%') order by u.createdAt desc")
    List<User> searchForAdmin(String term, Limit limit);

    long countByBlockedAtIsNotNull();

    List<User> findAllByAdminTrue();
}
