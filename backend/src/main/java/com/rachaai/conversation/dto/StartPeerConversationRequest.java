package com.rachaai.conversation.dto;

import jakarta.validation.constraints.NotNull;

public record StartPeerConversationRequest(@NotNull Long listingId, @NotNull Long otherUserId) {
}
