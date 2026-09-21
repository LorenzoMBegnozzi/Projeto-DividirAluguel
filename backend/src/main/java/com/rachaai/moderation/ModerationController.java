package com.rachaai.moderation;

import com.rachaai.moderation.dto.BlockRequest;
import com.rachaai.moderation.dto.BlockedUserResponse;
import com.rachaai.moderation.dto.ReportRequest;
import com.rachaai.moderation.dto.ReportResponse;
import com.rachaai.security.SecurityUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
public class ModerationController {

    private final ModerationService moderationService;

    public ModerationController(ModerationService moderationService) {
        this.moderationService = moderationService;
    }

    @PostMapping("/api/bloqueios")
    public BlockedUserResponse block(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody BlockRequest request
    ) {
        return BlockedUserResponse.from(moderationService.block(principal.getId(), request.bloqueadoId()));
    }

    @DeleteMapping("/api/bloqueios/{bloqueadoId}")
    public void unblock(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long bloqueadoId) {
        moderationService.unblock(principal.getId(), bloqueadoId);
    }

    @GetMapping("/api/bloqueios")
    public List<BlockedUserResponse> listBlocked(@AuthenticationPrincipal SecurityUser principal) {
        return moderationService.listBlocked(principal.getId()).stream().map(BlockedUserResponse::from).toList();
    }

    @PostMapping("/api/denuncias")
    public ReportResponse report(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody ReportRequest request
    ) {
        return ReportResponse.from(moderationService.report(principal.getId(), request));
    }
}
