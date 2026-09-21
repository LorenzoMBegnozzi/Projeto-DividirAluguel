-- Troca valores numéricos (0/1) por texto ('NAO'/'SIM') e o papel da conta por
-- 'ALUGAR'/'ANUNCIAR', para o banco ser legível sem consultar o código.
-- O Oracle só muda o tipo de uma coluna que esteja vazia; por isso cada coluna é
-- copiada para uma temporária, zerada, convertida, preenchida de novo e a temporária removida.
-- NULL continua significando "não informado" nas preferências.

DROP INDEX uq_anuncios_uma_busca_por_usuario;
ALTER TABLE perfis_usuario DROP CONSTRAINT ck_perfis_usuario_bools;
ALTER TABLE anuncios       DROP CONSTRAINT ck_anuncios_ativo;
ALTER TABLE anuncios       DROP CONSTRAINT ck_anuncios_aceita;
ALTER TABLE usuarios       DROP CONSTRAINT ck_usuarios_papel;

-- ------------------------------------------------------------ perfis_usuario
ALTER TABLE perfis_usuario ADD (
    fumante_tmp NUMBER(1), bebe_tmp NUMBER(1), vegetariano_tmp NUMBER(1),
    tem_pets_tmp NUMBER(1), gosta_animais_tmp NUMBER(1)
);
UPDATE perfis_usuario SET
    fumante_tmp = fumante, bebe_tmp = bebe, vegetariano_tmp = vegetariano,
    tem_pets_tmp = tem_pets, gosta_animais_tmp = gosta_animais;
UPDATE perfis_usuario SET
    fumante = NULL, bebe = NULL, vegetariano = NULL, tem_pets = NULL, gosta_animais = NULL;
ALTER TABLE perfis_usuario MODIFY (
    fumante VARCHAR2(3 CHAR), bebe VARCHAR2(3 CHAR), vegetariano VARCHAR2(3 CHAR),
    tem_pets VARCHAR2(3 CHAR), gosta_animais VARCHAR2(3 CHAR)
);
UPDATE perfis_usuario SET
    fumante       = CASE fumante_tmp       WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END,
    bebe          = CASE bebe_tmp          WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END,
    vegetariano   = CASE vegetariano_tmp   WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END,
    tem_pets      = CASE tem_pets_tmp      WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END,
    gosta_animais = CASE gosta_animais_tmp WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END;
ALTER TABLE perfis_usuario DROP (fumante_tmp, bebe_tmp, vegetariano_tmp, tem_pets_tmp, gosta_animais_tmp);
ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_sim_nao CHECK (
    fumante IN ('SIM', 'NAO') AND bebe IN ('SIM', 'NAO') AND vegetariano IN ('SIM', 'NAO')
    AND tem_pets IN ('SIM', 'NAO') AND gosta_animais IN ('SIM', 'NAO')
);

-- ------------------------------------------------------------------ anuncios
ALTER TABLE anuncios ADD (aceita_pets_tmp NUMBER(1), aceita_fumante_tmp NUMBER(1), ativo_tmp NUMBER(1));
UPDATE anuncios SET aceita_pets_tmp = aceita_pets, aceita_fumante_tmp = aceita_fumante, ativo_tmp = ativo;
ALTER TABLE anuncios MODIFY (ativo DEFAULT NULL);
ALTER TABLE anuncios MODIFY (ativo NULL);
UPDATE anuncios SET aceita_pets = NULL, aceita_fumante = NULL, ativo = NULL;
ALTER TABLE anuncios MODIFY (
    aceita_pets VARCHAR2(3 CHAR), aceita_fumante VARCHAR2(3 CHAR), ativo VARCHAR2(3 CHAR) DEFAULT 'SIM'
);
UPDATE anuncios SET
    aceita_pets    = CASE aceita_pets_tmp    WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END,
    aceita_fumante = CASE aceita_fumante_tmp WHEN 1 THEN 'SIM' WHEN 0 THEN 'NAO' END,
    ativo          = CASE ativo_tmp          WHEN 1 THEN 'SIM' ELSE 'NAO' END;
ALTER TABLE anuncios MODIFY (ativo NOT NULL);
ALTER TABLE anuncios DROP (aceita_pets_tmp, aceita_fumante_tmp, ativo_tmp);
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_ativo CHECK (ativo IN ('SIM', 'NAO'));
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_aceita CHECK (
    aceita_pets IN ('SIM', 'NAO') AND aceita_fumante IN ('SIM', 'NAO')
);

-- ------------------------------------------------------------------ usuarios
UPDATE usuarios SET papel = CASE papel WHEN 'RENTER' THEN 'ALUGAR' WHEN 'ADVERTISER' THEN 'ANUNCIAR' END;
ALTER TABLE usuarios ADD CONSTRAINT ck_usuarios_papel CHECK (papel IN ('ALUGAR', 'ANUNCIAR'));

-- No máximo uma busca (PROCURANDO) ativa por usuário (Oracle não tem índice parcial).
CREATE UNIQUE INDEX uq_anuncios_uma_busca_por_usuario
    ON anuncios (CASE WHEN ativo = 'SIM' AND tipo = 'PROCURANDO' THEN usuario_id END);
