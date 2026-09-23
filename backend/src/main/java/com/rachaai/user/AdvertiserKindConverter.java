package com.rachaai.user;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** No banco é gravado por extenso em português: VAGA / ESTABELECIMENTO. */
@Converter
public class AdvertiserKindConverter implements AttributeConverter<AdvertiserKind, String> {

    @Override
    public String convertToDatabaseColumn(AdvertiserKind kind) {
        return kind == null ? null : kind.name();
    }

    @Override
    public AdvertiserKind convertToEntityAttribute(String value) {
        return value == null ? null : AdvertiserKind.valueOf(value);
    }
}
