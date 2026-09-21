package com.rachaai.user;

import com.rachaai.common.SimNaoConverter;
import jakarta.persistence.*;

import java.time.Instant;

@Entity
@Table(name = "perfis_usuario")
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false, unique = true)
    private User user;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "fumante", length = 3)
    private Boolean smoker;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "bebe", length = 3)
    private Boolean drinksAlcohol;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "vegetariano", length = 3)
    private Boolean vegetarian;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "tem_pets", length = 3)
    private Boolean hasPets;

    @Convert(converter = SimNaoConverter.class)
    @Column(name = "gosta_animais", length = 3)
    private Boolean likesAnimals;

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

    public Boolean getSmoker() {
        return smoker;
    }

    public void setSmoker(Boolean smoker) {
        this.smoker = smoker;
    }

    public Boolean getDrinksAlcohol() {
        return drinksAlcohol;
    }

    public void setDrinksAlcohol(Boolean drinksAlcohol) {
        this.drinksAlcohol = drinksAlcohol;
    }

    public Boolean getVegetarian() {
        return vegetarian;
    }

    public void setVegetarian(Boolean vegetarian) {
        this.vegetarian = vegetarian;
    }

    public Boolean getHasPets() {
        return hasPets;
    }

    public void setHasPets(Boolean hasPets) {
        this.hasPets = hasPets;
    }

    public Boolean getLikesAnimals() {
        return likesAnimals;
    }

    public void setLikesAnimals(Boolean likesAnimals) {
        this.likesAnimals = likesAnimals;
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
}
