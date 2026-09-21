package com.rachaai.rating;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ConvivioRepository extends JpaRepository<Convivio, Long> {

    @Query("select c from Convivio c where c.usuario1.id = :menorId and c.usuario2.id = :maiorId")
    Optional<Convivio> findByParOrdenado(@Param("menorId") Long menorId, @Param("maiorId") Long maiorId);

    @Query("select c from Convivio c where c.usuario1.id = :usuarioId or c.usuario2.id = :usuarioId "
            + "order by c.criadoEm desc")
    List<Convivio> findAllByUsuario(@Param("usuarioId") Long usuarioId);
}
