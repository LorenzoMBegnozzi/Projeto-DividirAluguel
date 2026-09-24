package com.rachaai.user.dto;

import com.rachaai.user.AllergyTag;
import com.rachaai.user.Diet;
import com.rachaai.user.DrinkingHabit;
import com.rachaai.user.Gender;
import com.rachaai.user.PetPreference;
import com.rachaai.user.Routine;
import com.rachaai.user.SmokingHabit;
import jakarta.validation.constraints.Size;

import java.util.List;

public record ProfileRequest(
        SmokingHabit smokingHabit,
        DrinkingHabit drinkingHabit,
        Gender gender,
        Diet diet,
        @Size(max = 160) String dietOther,
        List<PetPreference> petPreferences,
        List<AllergyTag> allergyTags,
        @Size(max = 300) String allergyOther,
        @Size(max = 500) String musicTaste,
        Routine routine,
        @Size(max = 1000) String bio,
        @Size(max = 160) String occupation
) {
}
