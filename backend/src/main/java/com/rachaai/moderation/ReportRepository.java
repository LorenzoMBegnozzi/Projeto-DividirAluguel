package com.rachaai.moderation;

import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface ReportRepository extends JpaRepository<Report, Long> {

    List<Report> findAllByStatusOrderByCreatedAtDesc(ReportStatus status, Limit limit);

    List<Report> findAllByOrderByCreatedAtDesc(Limit limit);

    List<Report> findAllByReportedIdAndStatus(Long reportedId, ReportStatus status);

    long countByStatus(ReportStatus status);

    long countByReportedId(Long reportedId);

    /** Quantas denúncias cada usuário da lista recebeu: [id, total]. */
    @Query("select r.reported.id, count(r) from Report r where r.reported.id in :userIds group by r.reported.id")
    List<Object[]> countByReportedIds(List<Long> userIds);
}
