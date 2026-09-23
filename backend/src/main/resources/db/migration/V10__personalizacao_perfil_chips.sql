-- Troca os campos de sim/não do perfil (fumo, bebida, dieta, pets) por seleção de
-- opções (chips) mais expressivas, e o campo de alergias de texto livre para uma
-- lista de tags pré-definidas (com "Outro" opcional). Colunas de lista guardam
-- códigos separados por vírgula (ex.: 'CACHORRO,GATO'), sem índice/constraint por
-- item, no mesmo espírito da coluna gosto_musical que já existia.

ALTER TABLE perfis_usuario ADD (
    habito_fumo     VARCHAR2(30 CHAR),
    habito_bebida   VARCHAR2(30 CHAR),
    alimentacao     VARCHAR2(20 CHAR),
    pet_preferencias VARCHAR2(500 CHAR)
);

-- Migra os dados existentes (sim/não) para o valor mais próximo nas novas opções.
UPDATE perfis_usuario SET habito_fumo = CASE fumante WHEN 'SIM' THEN 'FUMANTE' WHEN 'NAO' THEN 'NAO_FUMO' END
 WHERE fumante IS NOT NULL;

UPDATE perfis_usuario SET habito_bebida = CASE bebe WHEN 'SIM' THEN 'BEBO_COM_MODERACAO' WHEN 'NAO' THEN 'NAO_CURTO' END
 WHERE bebe IS NOT NULL;

UPDATE perfis_usuario SET alimentacao = CASE vegetariano WHEN 'SIM' THEN 'VEGETARIANO' WHEN 'NAO' THEN 'ONIVORO' END
 WHERE vegetariano IS NOT NULL;

-- pet_preferencias: combina tem_pets/gosta_animais no melhor equivalente em chips.
UPDATE perfis_usuario SET pet_preferencias =
    CASE
        WHEN tem_pets = 'SIM' AND gosta_animais = 'SIM' THEN 'TENHO_PET_NAO_ESPECIFICADO,GOSTO_DE_TODOS'
        WHEN tem_pets = 'SIM' THEN 'TENHO_PET_NAO_ESPECIFICADO'
        WHEN tem_pets = 'NAO' AND gosta_animais = 'SIM' THEN 'NAO_TENHO_MAS_AMO'
        WHEN tem_pets = 'NAO' AND gosta_animais = 'NAO' THEN 'NAO_TENHO_PETS'
        WHEN gosta_animais = 'SIM' THEN 'GOSTO_DE_TODOS'
        WHEN gosta_animais = 'NAO' THEN 'NAO_TENHO_PETS'
    END
 WHERE tem_pets IS NOT NULL OR gosta_animais IS NOT NULL;

ALTER TABLE perfis_usuario DROP CONSTRAINT ck_perfis_usuario_sim_nao;
ALTER TABLE perfis_usuario DROP COLUMN fumante;
ALTER TABLE perfis_usuario DROP COLUMN bebe;
ALTER TABLE perfis_usuario DROP COLUMN vegetariano;
ALTER TABLE perfis_usuario DROP COLUMN tem_pets;
ALTER TABLE perfis_usuario DROP COLUMN gosta_animais;

ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_fumo
    CHECK (habito_fumo IN ('NAO_FUMO', 'FUMO_SOCIALMENTE', 'FUMO_QUANDO_BEBO', 'FUMANTE', 'TENTANDO_PARAR'));

ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_bebida
    CHECK (habito_bebida IN ('NAO_CURTO', 'PAREI_DE_BEBER', 'BEBO_COM_MODERACAO', 'OCASIOES_ESPECIAIS', 'SOCIALMENTE_FDS', 'QUASE_TODA_NOITE'));

ALTER TABLE perfis_usuario ADD CONSTRAINT ck_perfis_usuario_alimentacao
    CHECK (alimentacao IN ('ONIVORO', 'VEGETARIANO', 'VEGANO', 'PESCETARIANO', 'FLEXITARIANO'));

-- alergias já existia como texto livre; passa a guardar tags separadas por vírgula
-- (ex.: 'POEIRA,PELO_DE_ANIMAL' ou 'OUTRO:relato livre da pessoa'). Sem mudança de
-- schema, só de significado — dado antigo em texto livre continua legível.
