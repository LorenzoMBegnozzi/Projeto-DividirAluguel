package com.rachaai.user.dto;

import com.rachaai.user.Role;
import com.rachaai.user.Routine;
import com.rachaai.user.User;

import java.time.LocalDate;

public record UserResponse(
        Long id,
        String name,
        String email,
        LocalDate birthDate,
        Role role,
        String occupation,
        String bio,
        Boolean smoker,
        Boolean drinksAlcohol,
        Boolean vegetarian,
        Boolean hasPets,
        Boolean likesAnimals,
        String allergies,
        String musicTaste,
        Routine routine,
        boolean safetyTermsAccepted
) {
    public static UserResponse from(User user) {
        var profile = user.getProfile();
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getBirthDate(),
                user.getRole(),
                user.getOccupation(),
                user.getBio(),
                profile != null ? profile.getSmoker() : null,
                profile != null ? profile.getDrinksAlcohol() : null,
                profile != null ? profile.getVegetarian() : null,
                profile != null ? profile.getHasPets() : null,
                profile != null ? profile.getLikesAnimals() : null,
                profile != null ? profile.getAllergies() : null,
                profile != null ? profile.getMusicTaste() : null,
                profile != null ? profile.getRoutine() : null,
                user.getSafetyTermsAcceptedAt() != null
        );
    }
}
