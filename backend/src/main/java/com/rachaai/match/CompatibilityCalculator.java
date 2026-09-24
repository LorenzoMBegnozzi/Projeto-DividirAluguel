package com.rachaai.match;

import com.rachaai.listing.Listing;
import com.rachaai.user.UserProfile;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;

/**
 * Calcula um score de compatibilidade (0-100) entre dois usuários, combinando
 * hábitos de convivência (fumo, bebida, dieta, animais, rotina, música).
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

        double[] boolWeight = {10, 10, 15}; // smoker, drinksAlcohol, vegetarian
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

        double petsWeight = 25;
        Double petsScore = petsCompatibility(a, b);
        if (petsScore != null) {
            possible += petsWeight;
            earned += petsWeight * petsScore;
        }

        double routineWeight = 15;
        if (a != null && b != null && a.getRoutine() != null && b.getRoutine() != null) {
            possible += routineWeight;
            if (a.getRoutine() == b.getRoutine()) {
                earned += routineWeight;
            }
        }

        double musicWeight = 25;
        Double musicScore = textOverlap(a == null ? null : a.getMusicTaste(), b == null ? null : b.getMusicTaste());
        if (musicScore != null) {
            possible += musicWeight;
            earned += musicWeight * musicScore;
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

    private Double textOverlap(String a, String b) {
        Set<String> tokensA = tokenize(a);
        Set<String> tokensB = tokenize(b);
        if (tokensA.isEmpty() || tokensB.isEmpty()) {
            return null;
        }
        Set<String> intersection = new HashSet<>(tokensA);
        intersection.retainAll(tokensB);
        Set<String> union = new HashSet<>(tokensA);
        union.addAll(tokensB);
        return union.isEmpty() ? 0.0 : (double) intersection.size() / union.size();
    }

    private Set<String> tokenize(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }
        return new HashSet<>(Arrays.asList(
                text.toLowerCase()
                        .replaceAll("[^a-z0-9áàâãéèêíïóôõöúçñ ,]", "")
                        .split("[,\\s]+")
        ));
    }
}
