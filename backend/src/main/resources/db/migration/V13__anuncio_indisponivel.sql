ALTER TABLE anuncios ADD disponivel VARCHAR2(3) DEFAULT 'SIM' NOT NULL;
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_disponivel CHECK (disponivel IN ('SIM', 'NAO'));

ALTER TABLE anuncios ADD fechado_com_usuario_id NUMBER(19);
ALTER TABLE anuncios ADD CONSTRAINT fk_anuncios_fechado_com
    FOREIGN KEY (fechado_com_usuario_id) REFERENCES usuarios (id);
