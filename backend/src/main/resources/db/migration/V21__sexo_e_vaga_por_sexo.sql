ALTER TABLE perfis_usuario ADD sexo VARCHAR2(20 CHAR);
ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_sexo
    CHECK (sexo IN ('MASCULINO', 'FEMININO', 'OUTRO'));

ALTER TABLE anuncios ADD sexo_aceito VARCHAR2(20 CHAR) DEFAULT 'QUALQUER' NOT NULL;
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_sexo_aceito
    CHECK (sexo_aceito IN ('QUALQUER', 'MASCULINO', 'FEMININO'));
