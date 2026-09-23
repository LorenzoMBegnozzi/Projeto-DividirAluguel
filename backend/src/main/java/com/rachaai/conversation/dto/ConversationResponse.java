package com.rachaai.conversation.dto;

import com.rachaai.conversation.Conversation;
import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.user.dto.UserResponse;

import java.time.Instant;

public record ConversationResponse(Long id, UserResponse otherUser, ListingResponse listing, Instant createdAt) {
    public static ConversationResponse from(Conversation conversation, Long currentUserId, boolean otherUserHasPhoto) {
        return new ConversationResponse(
                conversation.getId(),
                UserResponse.from(conversation.other(currentUserId), otherUserHasPhoto),
                ListingResponse.from(conversation.getListing()),
                conversation.getCreatedAt()
        );
    }
}
