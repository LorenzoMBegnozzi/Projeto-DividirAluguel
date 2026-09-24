ALTER TABLE perfis_usuario ADD alimentacao_outro VARCHAR2(160 CHAR);

ALTER TABLE perfis_usuario DROP CONSTRAINT ck_perfis_usuario_alimentacao;
ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_alimentacao
    CHECK (alimentacao IN ('ONIVORO', 'VEGETARIANO', 'VEGANO', 'PESCETARIANO', 'FLEXITARIANO', 'OUTRO'));
