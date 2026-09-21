package com.rachaai.user;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** No banco o papel é gravado por extenso em português: ALUGAR / ANUNCIAR. */
@Converter
public class RoleConverter implements AttributeConverter<Role, String> {

    @Override
    public String convertToDatabaseColumn(Role role) {
        if (role == null) {
            return null;
        }
        return switch (role) {
            case RENTER -> "ALUGAR";
            case ADVERTISER -> "ANUNCIAR";
        };
    }

    @Override
    public Role convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }
        return switch (value) {
            case "ALUGAR" -> Role.RENTER;
            case "ANUNCIAR" -> Role.ADVERTISER;
            default -> throw new IllegalArgumentException("Papel desconhecido no banco: " + value);
        };
    }
}
