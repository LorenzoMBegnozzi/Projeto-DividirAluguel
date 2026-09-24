package com.rachaai.listing.dto;

import com.rachaai.listing.GenderPreference;
import com.rachaai.listing.ListingType;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record ListingRequest(
        @NotNull ListingType type,
        @NotBlank @Size(max = 160) String title,
        @Size(max = 2000) String description,
        @Size(max = 160) String preferredNeighborhood,
        @Size(max = 160) String nearCollege,
        BigDecimal price,
        @Min(1) Integer availableSlots,
        GenderPreference genderPreference,
        @Size(max = 255) String address,
        @DecimalMin("-90.0") @DecimalMax("90.0") Double latitude,
        @DecimalMin("-180.0") @DecimalMax("180.0") Double longitude,
        Boolean acceptsPets,
        Boolean acceptsSmoker
) {
}
