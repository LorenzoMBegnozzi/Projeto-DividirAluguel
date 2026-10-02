package com.rachaai.chat;

import com.rachaai.chat.dto.TypingResponse;
import com.rachaai.conversation.ConversationService;
import com.rachaai.security.SecurityUser;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/conversations/{conversationId}/digitando")
public class TypingController {

    private final TypingService typingService;
    private final ConversationService conversationService;

    public TypingController(TypingService typingService, ConversationService conversationService) {
        this.typingService = typingService;
        this.conversationService = conversationService;
    }

    @PostMapping
    public void markTyping(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long conversationId) {
        conversationService.getForUser(conversationId, principal.getId());
        typingService.markTyping(conversationId, principal.getId());
    }

    @GetMapping
    public TypingResponse isOtherTyping(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long conversationId) {
        conversationService.getForUser(conversationId, principal.getId());
        return new TypingResponse(typingService.isOtherTyping(conversationId, principal.getId()));
    }
}
