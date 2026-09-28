package com.rachaai.user;

/**
 * Chips de múltipla escolha para a seção "Alergias" do perfil. OUTRO vem acompanhado de um texto livre.
 * Alergia é dado de saúde (sensível na LGPD): PREFIRO_NAO_INFORMAR sempre existe e, quando escolhido,
 * substitui qualquer outra resposta.
 */
public enum AllergyTag {
    POEIRA,
    PELO_DE_ANIMAL,
    POLEN_MOFO,
    PICADA_DE_INSETO,
    ALIMENTOS,
    MEDICAMENTOS,
    LATEX,
    NENHUMA,
    OUTRO,
    PREFIRO_NAO_INFORMAR
}
