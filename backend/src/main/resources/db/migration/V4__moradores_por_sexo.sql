-- Troca "quantas pessoas já moram no lugar" (um número só) por dois números — homens e
-- mulheres, preenchidos juntos sem serem excludentes.
ALTER TABLE anuncios DROP CONSTRAINT ck_anuncios_moradores_atuais;
ALTER TABLE anuncios DROP COLUMN moradores_atuais;

ALTER TABLE anuncios ADD moradores_homens INTEGER;
ALTER TABLE anuncios ADD moradores_mulheres INTEGER;
ALTER TABLE anuncios ADD CONSTRAINT ck_anuncios_moradores_sexo CHECK (
    (moradores_homens IS NULL OR moradores_homens BETWEEN 0 AND 20)
    AND (moradores_mulheres IS NULL OR moradores_mulheres BETWEEN 0 AND 20)
);
