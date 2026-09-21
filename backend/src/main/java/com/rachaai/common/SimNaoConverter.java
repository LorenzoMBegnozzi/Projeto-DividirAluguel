package com.rachaai.common;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Grava Boolean como 'SIM'/'NAO' no banco (null = não informado). */
@Converter
public class SimNaoConverter implements AttributeConverter<Boolean, String> {

    @Override
    public String convertToDatabaseColumn(Boolean value) {
        if (value == null) {
            return null;
        }
        return value ? "SIM" : "NAO";
    }

    @Override
    public Boolean convertToEntityAttribute(String value) {
        if (value == null) {
            return null;
        }
        return "SIM".equals(value);
    }
}
