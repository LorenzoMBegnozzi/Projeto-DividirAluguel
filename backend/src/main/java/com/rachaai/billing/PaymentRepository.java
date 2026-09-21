package com.rachaai.billing;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PaymentRepository extends JpaRepository<Payment, Long> {

    List<Payment> findAllByUserIdOrderByCreatedAtDesc(Long userId);

    Optional<Payment> findByIdAndUserId(Long id, Long userId);

    /** Créditos de anúncio extra já pagos e ainda não usados, do mais antigo para o mais novo. */
    List<Payment> findAllByUserIdAndTypeAndStatusAndListingIdIsNullOrderByPaidAtAsc(
            Long userId, PaymentType type, PaymentStatus status);

    long countByUserIdAndTypeAndStatusAndListingIdIsNull(Long userId, PaymentType type, PaymentStatus status);
}
