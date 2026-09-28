package com.rachaai.user.dto;

import com.rachaai.user.AdvertiserKind;
import com.rachaai.user.AllergyCodec;
import com.rachaai.user.AllergyTag;
import com.rachaai.user.Diet;
import com.rachaai.user.DrinkingHabit;
import com.rachaai.user.Gender;
import com.rachaai.user.PetPreference;
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
        Gender gender,
        Diet diet,
        String dietOther,
        List<PetPreference> petPreferences,
        List<AllergyTag> allergyTags,
        String allergyOther,
        Boolean needsCarParking,
        Boolean needsMotorcycleParking,
        boolean safetyTermsAccepted,
        boolean admin,
        /** Aceitou a versão ATUAL dos Termos de Uso e da Política de Privacidade. */
        boolean legalTermsAccepted,
        /** Confirmou o e-mail pelo link (só vem para a própria conta). */
        boolean emailConfirmed,
        String photoUrl
) {
    /** A própria conta (/me, login, cadastro): todos os campos. */
    public static UserResponse from(User user, boolean hasPhoto) {
        return build(user, hasPhoto, true);
    }

    /**
     * Outra pessoa (perfil público, busca, conversas, interessados): sem e-mail, sem data de
     * nascimento e sem os marcadores internos da conta. É o que a Política de Privacidade diz
     * que os outros usuários veem.
     */
    public static UserResponse publicFrom(User user, boolean hasPhoto) {
        return build(user, hasPhoto, false);
    }

    private static UserResponse build(User user, boolean hasPhoto, boolean self) {
        var profile = user.getProfile();
        var allergies = AllergyCodec.decode(profile != null ? profile.getAllergies() : null);
        return new UserResponse(
                user.getId(),
                user.getName(),
                self ? user.getEmail() : null,
                self ? user.getBirthDate() : null,
                user.isRenter(),
                user.isAdvertiser(),
                user.getAdvertiserKind(),
                user.getOccupation(),
                user.getBio(),
                profile != null ? profile.getSmokingHabit() : null,
                profile != null ? profile.getDrinkingHabit() : null,
                profile != null ? profile.getGender() : null,
                profile != null ? profile.getDiet() : null,
                profile != null ? profile.getDietOther() : null,
                profile != null ? profile.getPetPreferencesList() : List.of(),
                // Alergia é dado de saúde: só a própria pessoa vê (perfil de outra pessoa vem sem).
                self ? allergies.tags() : List.of(),
                self ? allergies.otherText() : null,
                profile != null ? profile.getNeedsCarParking() : null,
                profile != null ? profile.getNeedsMotorcycleParking() : null,
                self && user.getSafetyTermsAcceptedAt() != null,
                self && user.isAdmin(),
                self && com.rachaai.user.LegalTerms.CURRENT_VERSION.equals(user.getLegalTermsVersion()),
                self && user.isEmailConfirmed(),
                hasPhoto ? "/api/users/" + user.getId() + "/foto" : null
        );
    }
}
