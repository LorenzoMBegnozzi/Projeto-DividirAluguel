package com.rachaai.rating;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AvaliacaoRepository extends JpaRepository<Avaliacao, Long> {

    List<Avaliacao> findAllByAvaliadoIdOrderByCriadoEmDesc(Long avaliadoId);

    boolean existsByConvivioIdAndAvaliadorId(Long convivioId, Long avaliadorId);
}
