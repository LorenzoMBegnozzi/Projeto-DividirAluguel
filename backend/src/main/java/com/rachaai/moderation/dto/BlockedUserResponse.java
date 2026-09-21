package com.rachaai.moderation.dto;

import com.rachaai.moderation.Block;

import java.time.Instant;

public record BlockedUserResponse(Long id, String name, Instant createdAt) {
    public static BlockedUserResponse from(Block block) {
        return new BlockedUserResponse(block.getBlocked().getId(), block.getBlocked().getName(), block.getCreatedAt());
    }
}
