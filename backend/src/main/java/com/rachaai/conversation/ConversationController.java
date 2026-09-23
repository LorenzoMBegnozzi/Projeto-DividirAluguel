package com.rachaai.conversation;

import com.rachaai.conversation.dto.ConversationResponse;
import com.rachaai.conversation.dto.StartConversationRequest;
import com.rachaai.conversation.dto.StartPeerConversationRequest;
import com.rachaai.security.SecurityUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations")
public class ConversationController {

    private final ConversationService conversationService;

    public ConversationController(ConversationService conversationService) {
        this.conversationService = conversationService;
    }

    @PostMapping
    public ConversationResponse start(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody StartConversationRequest request
    ) {
        return conversationService.startConversation(principal.getId(), request.listingId());
    }

    @PostMapping("/interessados")
    public ConversationResponse startWithInterested(
            @AuthenticationPrincipal SecurityUser principal,
            @Valid @RequestBody StartPeerConversationRequest request
    ) {
        return conversationService.startPeerConversation(principal.getId(), request.listingId(), request.otherUserId());
    }

    @GetMapping
    public List<ConversationResponse> list(@AuthenticationPrincipal SecurityUser principal) {
        return conversationService.listForUser(principal.getId());
    }

    @GetMapping("/{id}")
    public ConversationResponse get(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long id) {
        return conversationService.getResponseForUser(id, principal.getId());
    }
}
