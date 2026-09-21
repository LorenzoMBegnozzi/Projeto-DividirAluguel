package com.rachaai.conversation.dto;

import jakarta.validation.constraints.NotNull;

public record StartConversationRequest(@NotNull Long listingId) {
}
