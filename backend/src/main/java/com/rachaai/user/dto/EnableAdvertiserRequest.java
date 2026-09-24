package com.rachaai.user.dto;

import com.rachaai.user.AdvertiserKind;
import jakarta.validation.constraints.NotNull;

public record EnableAdvertiserRequest(@NotNull AdvertiserKind advertiserKind) {
}
