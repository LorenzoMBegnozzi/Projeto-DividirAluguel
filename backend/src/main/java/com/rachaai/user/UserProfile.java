package com.rachaai.user;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Entity
@Table(name = "perfis_usuario")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(name = "habito_fumo", length = 30)
    private SmokingHabit smokingHabit;

    @Enumerated(EnumType.STRING)
    @Column(name = "habito_bebida", length = 30)
    private DrinkingHabit drinkingHabit;

    @Enumerated(EnumType.STRING)
    @Column(name = "alimentacao", length = 20)
    private Diet diet;

    @Column(name = "alimentacao_outro", length = 160)
    private String dietOther;

    @Enumerated(EnumType.STRING)
    @Column(name = "sexo", length = 20)
    private Gender gender;

    /** Chips escolhidos (com.rachaai.user.PetPreference), separados por vírgula. */
    @Column(name = "pet_preferencias", length = 500)
    private String petPreferences;

    /**
     * Tags de com.rachaai.user.AllergyTag separadas por vírgula; quando inclui "Outro", o
     * texto livre da pessoa vem como o segmento "OUTRO:texto" no lugar de só "OUTRO".
     */
    @Column(name = "alergias", length = 500)
    private String allergies;

    @Column(name = "gosto_musical", length = 500)
    private String musicTaste;

    @Enumerated(EnumType.STRING)
    @Column(name = "rotina", length = 20)
    private Routine routine;

    @Column(name = "atualizado_em", nullable = false)
    private Instant updatedAt = Instant.now();

    protected UserProfile() {
    }

    public UserProfile(User user) {
        this.user = user;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public SmokingHabit getSmokingHabit() {
        return smokingHabit;
    }

    public void setSmokingHabit(SmokingHabit smokingHabit) {
        this.smokingHabit = smokingHabit;
    }

    public DrinkingHabit getDrinkingHabit() {
        return drinkingHabit;
    }

    public void setDrinkingHabit(DrinkingHabit drinkingHabit) {
        this.drinkingHabit = drinkingHabit;
    }

    public Diet getDiet() {
        return diet;
    }

    public void setDiet(Diet diet) {
        this.diet = diet;
    }

    public Gender getGender() {
        return gender;
    }

    public void setGender(Gender gender) {
        this.gender = gender;
    }

    public String getDietOther() {
        return dietOther;
    }

    public void setDietOther(String dietOther) {
        this.dietOther = dietOther;
    }

    public String getPetPreferences() {
        return petPreferences;
    }

    public void setPetPreferences(String petPreferences) {
        this.petPreferences = petPreferences;
    }

    public List<PetPreference> getPetPreferencesList() {
        return parseEnumList(petPreferences, PetPreference::valueOf);
    }

    public void setPetPreferencesList(List<PetPreference> values) {
        this.petPreferences = values == null || values.isEmpty()
                ? null
                : values.stream().map(Enum::name).collect(Collectors.joining(","));
    }

    public String getAllergies() {
        return allergies;
    }

    public void setAllergies(String allergies) {
        this.allergies = allergies;
    }

    public String getMusicTaste() {
        return musicTaste;
    }

    public void setMusicTaste(String musicTaste) {
        this.musicTaste = musicTaste;
    }

    public Routine getRoutine() {
        return routine;
    }

    public void setRoutine(Routine routine) {
        this.routine = routine;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public void touch() {
        this.updatedAt = Instant.now();
    }

    // ---- derivados, usados pelo cálculo de compatibilidade (não têm coluna própria) ----

    public Boolean getSmoker() {
        if (smokingHabit == null) {
            return null;
        }
        return switch (smokingHabit) {
            case FUMANTE, FUMO_SOCIALMENTE, FUMO_QUANDO_BEBO -> true;
            case NAO_FUMO, TENTANDO_PARAR -> false;
        };
    }

    public Boolean getDrinksAlcohol() {
        if (drinkingHabit == null) {
            return null;
        }
        return switch (drinkingHabit) {
            case NAO_CURTO, PAREI_DE_BEBER -> false;
            case BEBO_COM_MODERACAO, OCASIOES_ESPECIAIS, SOCIALMENTE_FDS, QUASE_TODA_NOITE -> true;
        };
    }

    public Boolean getVegetarian() {
        if (diet == null) {
            return null;
        }
        return switch (diet) {
            case VEGETARIANO, VEGANO -> true;
            case ONIVORO, PESCETARIANO, FLEXITARIANO -> false;
            case OUTRO -> null;
        };
    }

    public Boolean getHasPets() {
        List<PetPreference> prefs = getPetPreferencesList();
        if (prefs.isEmpty()) {
            return null;
        }
        return prefs.stream().anyMatch(PetPreference.TIPOS_DE_ANIMAL::contains);
    }

    public Boolean getLikesAnimals() {
        List<PetPreference> prefs = getPetPreferencesList();
        if (prefs.isEmpty()) {
            return null;
        }
        if (prefs.contains(PetPreference.TENHO_ALERGIA_A_PETS)) {
            return false;
        }
        boolean positivo = prefs.stream()
                .anyMatch(p -> PetPreference.TIPOS_DE_ANIMAL.contains(p) || PetPreference.SINAL_POSITIVO.contains(p));
        return positivo;
    }

    private <E extends Enum<E>> List<E> parseEnumList(String stored, java.util.function.Function<String, E> parser) {
        if (stored == null || stored.isBlank()) {
            return List.of();
        }
        return Arrays.stream(stored.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(s -> {
                    try {
                        return parser.apply(s);
                    } catch (IllegalArgumentException e) {
                        return null;
                    }
                })
                .filter(java.util.Objects::nonNull)
                .toList();
    }
}
