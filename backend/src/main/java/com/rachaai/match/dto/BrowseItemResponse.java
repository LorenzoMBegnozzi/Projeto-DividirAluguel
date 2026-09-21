package com.rachaai.match.dto;

import com.rachaai.listing.dto.ListingResponse;
import com.rachaai.user.dto.UserResponse;

public record BrowseItemResponse(UserResponse user, ListingResponse listing, int compatibilityScore) {
}
