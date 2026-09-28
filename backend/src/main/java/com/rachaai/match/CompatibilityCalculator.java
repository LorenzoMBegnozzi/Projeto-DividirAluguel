package com.rachaai.match;

import com.rachaai.listing.Listing;
import com.rachaai.user.UserProfile;
import org.springframework.stereotype.Component;

/**
 * Calcula um score de compatibilidade (0-100) entre dois usuários, combinando
 * hábitos de convivência (fumo, bebida, dieta, animais).
 * Localização e orçamento não entram aqui: são filtros na busca, não pontuação
 * (ver DiscoveryService), pra não misturar "combina com você" com "está perto".
 * Atributos não preenchidos por nenhum dos dois lados simplesmente não entram
 * na conta, para não penalizar quem ainda não completou o perfil.
 */
@Component
public class CompatibilityCalculator {

    public int calculateRoommate(UserProfile a, UserProfile b) {
        double earned = 0;
        double possible = 0;

        double[] boolWeight = {15, 15, 25}; // smoker, drinksAlcohol, vegetarian
        Boolean[][] boolPairs = {
                {a == null ? null : a.getSmoker(), b == null ? null : b.getSmoker()},
                {a == null ? null : a.getDrinksAlcohol(), b == null ? null : b.getDrinksAlcohol()},
                {a == null ? null : a.getVegetarian(), b == null ? null : b.getVegetarian()},
        };
        for (int i = 0; i < boolPairs.length; i++) {
            Boolean va = boolPairs[i][0];
            Boolean vb = boolPairs[i][1];
            if (va != null && vb != null) {
                possible += boolWeight[i];
                if (va.equals(vb)) {
                    earned += boolWeight[i];
                }
            }
        }

        double petsWeight = 45;
        Double petsScore = petsCompatibility(a, b);
        if (petsScore != null) {
            possible += petsWeight;
            earned += petsWeight * petsScore;
        }

        if (possible == 0) {
            return 50;
        }
        return (int) Math.round((earned / possible) * 100);
    }

    /**
     * Compatibilidade entre quem procura aluguel e um anúncio de estabelecimento:
     * aqui não se compara hábito com hábito (não é sobre convivência), e sim o
     * hábito do inquilino contra a preferência que o dono declarou aceitar.
     */
    public int calculateEstablishment(UserProfile renter, Listing establishment) {
        double earned = 0;
        double possible = 0;

        double smokerWeight = 50;
        if (renter != null && renter.getSmoker() != null && establishment.getAcceptsSmoker() != null) {
            possible += smokerWeight;
            boolean fits = establishment.getAcceptsSmoker() || !renter.getSmoker();
            if (fits) {
                earned += smokerWeight;
            }
        }

        double petsWeight = 50;
        if (renter != null && renter.getHasPets() != null && establishment.getAcceptsPets() != null) {
            possible += petsWeight;
            boolean fits = establishment.getAcceptsPets() || !renter.getHasPets();
            if (fits) {
                earned += petsWeight;
            }
        }

        if (possible == 0) {
            return 50;
        }
        return (int) Math.round((earned / possible) * 100);
    }

    private Double petsCompatibility(UserProfile a, UserProfile b) {
        if (a == null || b == null) {
            return null;
        }
        Boolean aHasPets = a.getHasPets();
        Boolean bHasPets = b.getHasPets();
        Boolean aLikesAnimals = a.getLikesAnimals();
        Boolean bLikesAnimals = b.getLikesAnimals();

        if (aHasPets == null && bHasPets == null && aLikesAnimals == null && bLikesAnimals == null) {
            return null;
        }

        boolean conflict = (Boolean.TRUE.equals(aHasPets) && Boolean.FALSE.equals(bLikesAnimals))
                || (Boolean.TRUE.equals(bHasPets) && Boolean.FALSE.equals(aLikesAnimals));
        if (conflict) {
            return 0.0;
        }

        boolean bothEnjoyAnimals = (aLikesAnimals == null || Boolean.TRUE.equals(aLikesAnimals))
                && (bLikesAnimals == null || Boolean.TRUE.equals(bLikesAnimals));
        return bothEnjoyAnimals ? 1.0 : 0.6;
    }
}
