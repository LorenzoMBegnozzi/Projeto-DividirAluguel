ALTER TABLE usuarios ADD tipo_anunciante VARCHAR2(20);

ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_tipo_anunciante
    CHECK (tipo_anunciante IN ('VAGA', 'ESTABELECIMENTO'));
