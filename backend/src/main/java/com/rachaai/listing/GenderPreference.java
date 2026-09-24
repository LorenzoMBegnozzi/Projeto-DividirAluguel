package com.rachaai.listing;

import com.rachaai.user.Gender;

/** Quem pode ocupar uma vaga. Quem não informou o sexo só enxerga vagas QUALQUER. */
public enum GenderPreference {
    QUALQUER,
    MASCULINO,
    FEMININO;

    public boolean accepts(Gender gender) {
        return switch (this) {
            case QUALQUER -> true;
            case MASCULINO -> gender == Gender.MASCULINO;
            case FEMININO -> gender == Gender.FEMININO;
        };
    }
}
