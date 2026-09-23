package com.rachaai.user;

import java.util.Set;

/** Chips de múltipla escolha para a seção "Pets" do perfil. */
public enum PetPreference {
    CACHORRO,
    GATO,
    REPTIL,
    ANFIBIO,
    PASSARINHO,
    PEIXE,
    TARTARUGA,
    HAMSTER,
    COELHO,
    OUTRO_PET,
    NAO_TENHO_MAS_AMO,
    NAO_TENHO_PETS,
    GOSTO_DE_TODOS,
    QUERO_UM_PET,
    TENHO_ALERGIA_A_PETS,
    /** Só existe em perfis migrados do antigo campo sim/não; não é um chip selecionável. */
    TENHO_PET_NAO_ESPECIFICADO;

    /** Chips que indicam que a pessoa realmente tem um animal (para o cálculo de compatibilidade). */
    public static final Set<PetPreference> TIPOS_DE_ANIMAL = Set.of(
            CACHORRO, GATO, REPTIL, ANFIBIO, PASSARINHO, PEIXE, TARTARUGA, HAMSTER, COELHO, OUTRO_PET,
            TENHO_PET_NAO_ESPECIFICADO
    );

    /** Chips que indicam abertura a conviver com animais. */
    public static final Set<PetPreference> SINAL_POSITIVO = Set.of(
            GOSTO_DE_TODOS, QUERO_UM_PET, NAO_TENHO_MAS_AMO
    );
}
