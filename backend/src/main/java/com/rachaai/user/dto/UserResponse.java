package com.rachaai.user.dto;

import com.rachaai.user.AdvertiserKind;
import com.rachaai.user.AllergyCodec;
import com.rachaai.user.AllergyTag;
import com.rachaai.user.Diet;
import com.rachaai.user.DrinkingHabit;
import com.rachaai.user.PetPreference;
import com.rachaai.user.Routine;
import com.rachaai.user.SmokingHabit;
import com.rachaai.user.User;

import java.time.LocalDate;
import java.util.List;

public record UserResponse(
        Long id,
        String name,
        String email,
        LocalDate birthDate,
        boolean renter,
        boolean advertiser,
        AdvertiserKind advertiserKind,
        String occupation,
        String bio,
        SmokingHabit smokingHabit,
        DrinkingHabit drinkingHabit,
        Diet diet,
        List<PetPreference> petPreferences,
        List<AllergyTag> allergyTags,
        String allergyOther,
        String musicTaste,
        Routine routine,
        boolean safetyTermsAccepted,
        String photoUrl
) {
    public static UserResponse from(User user, boolean hasPhoto) {
        var profile = user.getProfile();
        var allergies = AllergyCodec.decode(profile != null ? profile.getAllergies() : null);
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getBirthDate(),
                user.isRenter(),
                user.isAdvertiser(),
                user.getAdvertiserKind(),
                user.getOccupation(),
                user.getBio(),
                profile != null ? profile.getSmokingHabit() : null,
                profile != null ? profile.getDrinkingHabit() : null,
                profile != null ? profile.getDiet() : null,
                profile != null ? profile.getPetPreferencesList() : List.of(),
                allergies.tags(),
                allergies.otherText(),
                profile != null ? profile.getMusicTaste() : null,
                profile != null ? profile.getRoutine() : null,
                user.getSafetyTermsAcceptedAt() != null,
                hasPhoto ? "/api/users/" + user.getId() + "/foto" : null
        );
    }
}
