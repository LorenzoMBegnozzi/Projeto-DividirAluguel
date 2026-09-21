package com.rachaai.chat;

import com.rachaai.chat.dto.MessageRequest;
import com.rachaai.chat.dto.MessageResponse;
import com.rachaai.security.SecurityUser;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversations/{conversationId}/messages")
public class ChatController {

    private final ChatService chatService;

    public ChatController(ChatService chatService) {
        this.chatService = chatService;
    }

    @GetMapping
    public List<MessageResponse> getMessages(@AuthenticationPrincipal SecurityUser principal, @PathVariable Long conversationId) {
        return chatService.getMessages(conversationId, principal.getId());
    }

    @PostMapping
    public MessageResponse sendMessage(
            @AuthenticationPrincipal SecurityUser principal,
            @PathVariable Long conversationId,
            @Valid @RequestBody MessageRequest request
    ) {
        return chatService.sendMessage(conversationId, principal.getId(), request.content());
    }
}
