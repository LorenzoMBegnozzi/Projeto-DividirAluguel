package com.rachaai.chat.dto;

import com.rachaai.chat.Message;

import java.time.Instant;

public record MessageResponse(Long id, Long conversationId, Long senderId, String content, Instant sentAt) {
    public static MessageResponse from(Message message) {
        return new MessageResponse(
                message.getId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getContent(),
                message.getSentAt()
        );
    }
}
