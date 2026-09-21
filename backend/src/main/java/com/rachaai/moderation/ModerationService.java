package com.rachaai.moderation;

import com.rachaai.common.ApiException;
import com.rachaai.moderation.dto.ReportRequest;
import com.rachaai.user.User;
import com.rachaai.user.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
public class ModerationService {

    private final BlockRepository blockRepository;
    private final ReportRepository reportRepository;
    private final UserRepository userRepository;

    public ModerationService(BlockRepository blockRepository, ReportRepository reportRepository, UserRepository userRepository) {
        this.blockRepository = blockRepository;
        this.reportRepository = reportRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Block block(Long userId, Long blockedId) {
        if (userId.equals(blockedId)) {
            throw ApiException.badRequest("Você não pode bloquear você mesmo");
        }
        User user = requireUser(userId);
        User blocked = requireUser(blockedId);

        return blockRepository.findByUserIdAndBlockedId(userId, blockedId)
                .orElseGet(() -> blockRepository.save(new Block(user, blocked)));
    }

    @Transactional
    public void unblock(Long userId, Long blockedId) {
        blockRepository.findByUserIdAndBlockedId(userId, blockedId).ifPresent(blockRepository::delete);
    }

    @Transactional(readOnly = true)
    public List<Block> listBlocked(Long userId) {
        return blockRepository.findAllByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional(readOnly = true)
    public boolean isBlockedEitherWay(Long userId, Long otherUserId) {
        return blockRepository.existsBetween(userId, otherUserId);
    }

    @Transactional(readOnly = true)
    public Set<Long> relatedBlockedIds(Long userId) {
        return new HashSet<>(blockRepository.findRelatedUserIds(userId));
    }

    @Transactional
    public Report report(Long userId, ReportRequest request) {
        if (userId.equals(request.denunciadoId())) {
            throw ApiException.badRequest("Você não pode denunciar você mesmo");
        }
        User reporter = requireUser(userId);
        User reported = requireUser(request.denunciadoId());

        Report report = new Report(reporter, reported, request.conversaId(), request.motivo(), request.descricao());
        return reportRepository.save(report);
    }

    private User requireUser(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Usuário não encontrado"));
    }
}
