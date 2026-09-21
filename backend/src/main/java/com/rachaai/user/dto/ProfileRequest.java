package com.rachaai.user.dto;

import com.rachaai.user.Routine;
import jakarta.validation.constraints.Size;

public record ProfileRequest(
        Boolean smoker,
        Boolean drinksAlcohol,
        Boolean vegetarian,
        Boolean hasPets,
        Boolean likesAnimals,
        @Size(max = 500) String allergies,
        @Size(max = 500) String musicTaste,
        Routine routine,
        @Size(max = 1000) String bio,
        @Size(max = 160) String occupation
) {
}
